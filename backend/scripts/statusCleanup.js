const RAILWAY_INTERNAL_HOST = 'mysql.railway.internal';
process.env.DB_HOST = process.env.DB_HOST || RAILWAY_INTERNAL_HOST;

const { pool: db } = require("../config/db");
const { sendEmail } = require("../config/mailer");
const { deleteUser } = require("../routes/userProfile");
const { createNotification, isEmailNotificationsEnabled } = require("../routes/notifications");

// Runs daily maintenance: status cleanup, leaderboard snapshots, XP/badge rewards, and data cleanup
async function runDailyMaintenance() {
    console.log("🕒 Starting Status Cleanup...");
    
    try {
        const now = new Date();
        const nowString = now.toISOString().slice(0, 19).replace("T", " "); // Current timestamp
        
        // Calculate the cutoff date (14 days ago)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const cutoffDate = fourteenDaysAgo.toISOString().slice(0, 19).replace("T", " "); // 14 days ago timestamp
        
        // Find users whose status is "Suspended" but whose suspendedUntil date is in the past.
        const [expiredSuspensions] = await db.execute(
            `SELECT userID, email, firstname FROM \`user\`
             WHERE \`suspendedUntil\` IS NOT NULL 
               AND \`suspendedUntil\` < ?`, // Check if the expiration date is older than now
            [nowString]
        );

        if (expiredSuspensions.length > 0) {
            console.log(`Found ${expiredSuspensions.length} expired suspensions to process.`);
            
            // Clear suspension fields only, without changing activity status
            const expiredIDs = expiredSuspensions.map(u => u.userID);
            const placeholders = expiredIDs.map(() => '?').join(',');

            await db.execute(
                `UPDATE \`user\` 
                SET \`suspendedUntil\` = NULL 
                WHERE userID IN (${placeholders})`,
                expiredIDs
            );

            console.log(`✅ ${expiredSuspensions.length} suspensions cleared.`);

            // Prepare users for email notification
            const usersToNotify = expiredSuspensions;

            // Send "Suspension Expired" Email Notification
            // Suspension emails always send regardless of toggle (security event)
            const emailPromises = usersToNotify.map(user => {
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background-color: #28a745; padding: 20px; text-align: center;">
                      <h1 style="color: #fff; margin: 0;">Suspension Expired</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                      <h2 style="color: #28a745;">Welcome back, ${user.firstname}!</h2>
                      <p>Your account suspension has automatically expired.</p>
                      
                      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #28a745;">
                        <p style="margin: 0;">You can now log in to SarawakEats and access your account.</p>
                      </div>

                      <p><a href="https://sarawakeats.site/loginregister">Log in to SarawakEats</a></p>
                      
                      <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                        Best regards,<br>The SarawakEats Team
                      </p>
                    </div>
                  </div>
                `;
                
                return sendEmail({
                    to: user.email,
                    subject: "Important: Your Account Suspension Has Ended",
                    html: html,
                    text: "Your account suspension has ended. You can now log in."
                });
            });

            // Wait for all emails to try sending (doesn't block if one fails)
            await Promise.all(emailPromises);
            console.log(`✅ Sent ${usersToNotify.length} auto-unsuspension emails.`);

            // Create in-app notifications for auto-unsuspended users
            const unsuspendNotifPromises = usersToNotify.map(user =>
                createNotification(user.userID, "unsuspended", "Your account suspension has automatically expired. You can now log in.", db)
            );
            await Promise.all(unsuspendNotifPromises);
            console.log(`🔔 Sent ${usersToNotify.length} auto-unsuspension notifications.`);
        }
        
        // Find other currently 'Active' users who are stale (7+ days inactive)

        const [staleUsers] = await db.execute(
            `SELECT userID FROM \`user\`
             WHERE (\`lastLogin\` IS NULL OR \`lastLogin\` < ?)
               AND \`status\` = 'Active'`, // Only check users currently marked 'Active'
            [cutoffDate]
        );

        if (staleUsers.length > 0) {
            const staleIDs = staleUsers.map(u => u.userID);
            const placeholders = staleIDs.map(() => '?').join(',');
            
            await db.execute(
                `UPDATE \`user\` SET \`status\` = 'Inactive'
                 WHERE userID IN (${placeholders})`,
                staleIDs
            );

            console.log(`✅ ${staleUsers.length} previously Active users set to 'Inactive'.`);
        } else {
            console.log("ℹ️ No stale users to mark as Inactive.");
        }

        // Warn users approaching 2 years inactive 
        const warningCutoffStart = new Date();
        warningCutoffStart.setDate(warningCutoffStart.getDate() - 700);
        const warningCutoffEnd = new Date();
        warningCutoffEnd.setDate(warningCutoffEnd.getDate() - 730);
        const warningStart = warningCutoffStart.toISOString().slice(0, 19).replace("T", " ");
        const warningEnd = warningCutoffEnd.toISOString().slice(0, 19).replace("T", " ");

        const [usersToWarn] = await db.execute(
            `SELECT userID, email, firstname FROM \`user\`
             WHERE \`status\` = 'Inactive'
               AND \`lastLogin\` < ?
               AND \`lastLogin\` >= ?
               AND \`deletion_warning_sent\` = 0`,
            [warningStart, warningEnd]
        );

        if (usersToWarn.length > 0) {
            console.log(`Found ${usersToWarn.length} users to warn about upcoming deletion.`);

            const warnIDs = usersToWarn.map(u => u.userID);
            const warnPlaceholders = warnIDs.map(() => '?').join(',');

            // Bypasses email toggle for deletion warnings since it's a critical account event
            const warningEmailPromises = usersToWarn.map(user => {
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background-color: #e67e22; padding: 20px; text-align: center;">
                      <h1 style="color: #fff; margin: 0;">Account Deletion Notice</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                      <h2 style="color: #e67e22;">Hello ${user.firstname},</h2>
                      <p>Your SarawakEats account (<strong>${user.email}</strong>) has been inactive for nearly 2 years.</p>

                      <div style="background-color: #fdebd0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #e67e22;">
                        <p style="margin: 0;">Your account will be <strong>permanently deleted in 30 days</strong> if you do not log in.</p>
                      </div>

                      <p>To keep your account, simply log in before the deadline.</p>

                      <p><a href="https://sarawakeats.site/loginregister">Log in to keep your account</a></p>

                      <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                        Best regards,<br>The SarawakEats Team
                      </p>
                    </div>
                  </div>
                `;

                return sendEmail({
                    to: user.email,
                    subject: "Important: Your SarawakEats Account Will Be Deleted Soon",
                    html: html,
                    text: `Hello ${user.firstname}, your SarawakEats account will be permanently deleted in 30 days due to inactivity. Log in to keep your account.`
                });
            });

            await Promise.all(warningEmailPromises);

            // Mark warning as sent so emails don't repeat
            await db.execute(
                `UPDATE \`user\` SET \`deletion_warning_sent\` = 1
                 WHERE userID IN (${warnPlaceholders})`,
                warnIDs
            );

            console.log(`✅ Sent ${usersToWarn.length} deletion warning emails.`);

            // Create in-app notifications for users approaching deletion
            const deletionWarnNotifPromises = usersToWarn.map(user =>
                createNotification(user.userID, "deletion_warning", "Your account has been inactive for nearly 2 years and will be permanently deleted in 30 days. Log in to keep your account.", db)
            );
            await Promise.all(deletionWarnNotifPromises);
            console.log(`🔔 Sent ${usersToWarn.length} deletion warning notifications.`);
        } else {
            console.log("ℹ️ No users approaching the 2-year inactivity threshold.");
        }

        // Auto-delete accounts inactive for 2+ years
        const twoyearsCutoff = new Date();
        twoyearsCutoff.setDate(twoyearsCutoff.getDate() - 730);
        const deletionCutoff = twoyearsCutoff.toISOString().slice(0, 19).replace("T", " ");

        const [usersToDelete] = await db.execute(
            `SELECT userID, firebase_uid, email, firstname FROM \`user\`
             WHERE \`status\` = 'Inactive'
               AND \`lastLogin\` < ?`,
            [deletionCutoff]
        );

        if (usersToDelete.length > 0) {
            console.log(`Found ${usersToDelete.length} accounts to auto-delete.`);

            for (const user of usersToDelete) {
                try {
                    // Delete user account and all associated data
                    await deleteUser(user.userID, user.firebase_uid || null);
                    console.log(`✅ Auto-deleted account for userID: ${user.userID} (${user.email})`);

                    // Send final deletion notification email only after successful deletion
                    if (user.email) {
                        const deletionHTML = `
                          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <div style="background-color: #dc3545; padding: 20px; text-align: center;">
                              <h1 style="color: #fff; margin: 0;">Account Deleted</h1>
                            </div>
                            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                              <h2 style="color: #dc3545;">Hello ${user.firstname},</h2>
                              <p>Your SarawakEats account (<strong>${user.email}</strong>) has been permanently deleted due to 2 years of inactivity, in accordance with our data retention policy.</p>

                              <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #dc3545;">
                                <p style="margin: 0;">All your personal data, recipes, and posts have been removed from our system.</p>
                              </div>

                              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                                Best regards,<br>The SarawakEats Team
                              </p>
                            </div>
                          </div>
                        `;

                        await sendEmail({
                            to: user.email,
                            subject: "Your SarawakEats Account Has Been Deleted",
                            html: deletionHTML,
                            text: `Hello ${user.firstname}, your SarawakEats account has been permanently deleted due to 2 years of inactivity.`
                        });
                    }

                } catch (deleteError) {
                    console.error(`❌ Failed to auto-delete userID ${user.userID}:`, deleteError.message);
                    // Continue with next user even if one fails
                }
            }

            console.log(`✅ Auto-deletion complete. Processed ${usersToDelete.length} accounts.`);
        } else {
            console.log("ℹ️ No accounts due for auto-deletion.");
        }

        // Auto-delete notifications older than 30 days
        const [notifResult] = await db.execute(
            `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL 30 DAY`
        );
        console.log(`✅ Cleaned up ${notifResult.affectedRows} old notifications.`);

        // Auto-delete activity logs older than 60 days
        const [logResult] = await db.execute(
            `DELETE FROM adminActivityLog WHERE createdAt < NOW() - INTERVAL 60 DAY`
        );
        console.log(`✅ Cleaned up ${logResult.affectedRows} old activity log entries.`);

        // Monthly Leaderboard Snapshot + XP/Badge Rewards
        // Runs every day but only processes last month if not done yet
        const malaysiaOffset = 8 * 60;
        const currentTime = new Date();
        const malaysiaTime = new Date(currentTime.getTime() + malaysiaOffset * 60 * 1000);

        // Calculate last month in Malaysia time
        const lastMonthDate = new Date(malaysiaTime);
        lastMonthDate.setDate(1); // go to 1st of current month
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1); // go back one month
        const lastMonth = lastMonthDate.getMonth() + 1; // 1-12
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonthStr = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`; // e.g. '2026-04'

        console.log(`📅 Processing leaderboard rewards for: ${lastMonthStr}`);

        // XP amounts per rank
        const RECIPE_XP = { 1: 200, 2: 150, 3: 100 };
        const POST_XP   = { 1: 100, 2: 50,  3: 25  };

        // Tiers ordered highest first (mirrors getTierByLevel() in gamificationTiers.jsx)
        const TIERS = [
            { id: "culinary_legend",      minLevel: 50 },
            { id: "culinary_master",      minLevel: 40 },
            { id: "nutrition_expert",     minLevel: 30 },
            { id: "nutrition_scholar",    minLevel: 20 },
            { id: "nutrition_enthusiast", minLevel: 10 },
            { id: "foodie",               minLevel: 5  },
            { id: "novice",               minLevel: 1  },
        ];
        const getTier = (level) => TIERS.find(t => level >= t.minLevel) || TIERS[TIERS.length - 1];

        // Helper to award XP to a user
        const awardXP = async (userProfileID, actionType, referenceId, xpAmount) => {
            // Guard: check if XP already awarded for last month
            const [existing] = await db.query(
                `SELECT id FROM xp_logs 
                 WHERE userProfileID = ? AND action_type = ? AND reference_id = ?
                 AND MONTH(created_at) = ? AND YEAR(created_at) = ?`,
                [userProfileID, actionType, referenceId, lastMonth, lastMonthYear]
            );

            if (existing.length > 0) {
                console.log(`⚠️ XP already awarded for ${actionType} to userProfileID ${userProfileID}, skipping...`);
                return;
            }

            await db.query(
                `INSERT INTO xp_logs (userProfileID, action_type, reference_id, xp_awarded)
                 VALUES (?, ?, ?, ?)`,
                [userProfileID, actionType, referenceId, xpAmount]
            );
            await db.query(
                `UPDATE userProfile SET total_xp = COALESCE(total_xp, 0) + ? WHERE userProfileID = ?`,
                [xpAmount, userProfileID]
            );
            console.log(`✅ Awarded ${xpAmount} XP to userProfileID ${userProfileID} for ${actionType}`);
        };

        // Snapshot + Recipe Leaderboard Rewards
        // Check if snapshot already exists for last month
        const [existingRecipeSnapshot] = await db.query(
            `SELECT id FROM leaderboardSnapshot WHERE snapshot_month = ? AND type = 'recipe' LIMIT 1`,
            [lastMonthStr]
        );

        const [recipeTop20] = await db.query(`
            WITH monthly_recipes AS (
                SELECT
                    r.recipeID,
                    r.userProfileID,
                    r.approved_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY r.userProfileID
                        ORDER BY r.approved_at ASC
                    ) AS row_num,
                    COUNT(*) OVER (PARTITION BY r.userProfileID) AS contributions
                FROM recipe r
                JOIN userProfile up ON r.userProfileID = up.userProfileID
                JOIN user u ON up.userID = u.userID
                WHERE r.status = 'Approved'
                    AND MONTH(r.approved_at) = ?
                    AND YEAR(r.approved_at) = ?
                    AND u.role = 'member'
                    AND u.status != 'Suspended'
            ),
            user_tiebreaker AS (
                SELECT userProfileID, contributions, approved_at AS reached_at
                FROM monthly_recipes
                WHERE row_num = contributions
            )
            SELECT
                ut.userProfileID,
                u.userID,
                u.firstname,
                ut.contributions,
                ut.reached_at
            FROM user_tiebreaker ut
            JOIN userProfile up ON ut.userProfileID = up.userProfileID
            JOIN user u ON up.userID = u.userID
            ORDER BY ut.contributions DESC, ut.reached_at ASC, ut.userProfileID ASC
            LIMIT 20
        `, [lastMonth, lastMonthYear]);

        // Save recipe snapshot if not already saved
        if (existingRecipeSnapshot.length === 0 && recipeTop20.length > 0) {
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();
                for (let i = 0; i < recipeTop20.length; i++) {
                    const user = recipeTop20[i];
                    await connection.query(
                        `INSERT INTO leaderboardSnapshot (snapshot_month, type, rank_position, userProfileID, contributions)
                         VALUES (?, 'recipe', ?, ?, ?)`,
                        [lastMonthStr, i + 1, user.userProfileID, user.contributions]
                    );
                }
                await connection.commit();
                console.log(`✅ Saved recipe leaderboard snapshot for ${lastMonthStr}`);
            } catch (snapshotError) {
                await connection.rollback();
                console.error(`❌ Failed to save recipe snapshot for ${lastMonthStr}:`, snapshotError.message);
            } finally {
                connection.release();
            }
        } else if (existingRecipeSnapshot.length > 0) {
            console.log(`⚠️ Recipe snapshot for ${lastMonthStr} already exists, skipping...`);
        }

        // Award XP to top 3, badge only to rank 1 recipe contributors
        const recipeTop3 = recipeTop20.slice(0, 3);
        for (let i = 0; i < recipeTop3.length; i++) {
            const user = recipeTop3[i];
            const rank = i + 1;
            const xp = RECIPE_XP[rank];
            const actionType = `LEADERBOARD_RECIPE_RANK_${rank}`;

            await awardXP(user.userProfileID, actionType, rank, xp);
            await createNotification(
                user.userID,
                "leaderboard_reward",
                `Congratulations! You ranked #${rank} on the Recipe Leaderboard for ${lastMonthStr} and earned ${xp} XP!`,
                db
            );
            console.log(`🔔 Notification sent to userID ${user.userID} for recipe rank ${rank}`);
        }

        // Badge for recipe rank 1
        if (recipeTop3.length > 0) {
            const rank1Recipe = recipeTop3[0];
            const [existingRecipeBadge] = await db.query(
                `SELECT id FROM badge 
                 WHERE userProfileID = ? AND badge_type = 'top_recipe' AND awarded_month = ?`,
                [rank1Recipe.userProfileID, lastMonthStr]
            );

            if (existingRecipeBadge.length === 0) {
                await db.query(
                    `INSERT INTO badge (userProfileID, badge_type, awarded_month)
                     VALUES (?, 'top_recipe', ?)`,
                    [rank1Recipe.userProfileID, lastMonthStr]
                );
                console.log(`✅ Awarded top_recipe badge to userProfileID ${rank1Recipe.userProfileID} for ${lastMonthStr}`);
            } else {
                console.log(`⚠️ top_recipe badge already awarded to userProfileID ${rank1Recipe.userProfileID} for ${lastMonthStr}, skipping...`);
            }
        }

        // Snapshot + Post Leaderboard Rewards
        const [existingPostSnapshot] = await db.query(
            `SELECT id FROM leaderboardSnapshot WHERE snapshot_month = ? AND type = 'post' LIMIT 1`,
            [lastMonthStr]
        );

        const [postTop20] = await db.query(`
            WITH monthly_posts AS (
                SELECT
                    p.postID,
                    p.userProfileID,
                    p.approved_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY p.userProfileID
                        ORDER BY p.approved_at ASC
                    ) AS row_num,
                    COUNT(*) OVER (PARTITION BY p.userProfileID) AS contributions
                FROM posts p
                JOIN userProfile up ON p.userProfileID = up.userProfileID
                JOIN user u ON up.userID = u.userID
                WHERE p.status = 'Approved'
                    AND MONTH(p.approved_at) = ?
                    AND YEAR(p.approved_at) = ?
                    AND u.role = 'member'
                    AND u.status != 'Suspended'
            ),
            user_tiebreaker AS (
                SELECT userProfileID, contributions, approved_at AS reached_at
                FROM monthly_posts
                WHERE row_num = contributions
            )
            SELECT
                ut.userProfileID,
                u.userID,
                u.firstname,
                ut.contributions,
                ut.reached_at
            FROM user_tiebreaker ut
            JOIN userProfile up ON ut.userProfileID = up.userProfileID
            JOIN user u ON up.userID = u.userID
            ORDER BY ut.contributions DESC, ut.reached_at ASC, ut.userProfileID ASC
            LIMIT 20
        `, [lastMonth, lastMonthYear]);

        // Save post snapshot if not already saved
        if (existingPostSnapshot.length === 0 && postTop20.length > 0) {
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();
                for (let i = 0; i < postTop20.length; i++) {
                    const user = postTop20[i];
                    await connection.query(
                        `INSERT INTO leaderboardSnapshot (snapshot_month, type, rank_position, userProfileID, contributions)
                         VALUES (?, 'post', ?, ?, ?)`,
                        [lastMonthStr, i + 1, user.userProfileID, user.contributions]
                    );
                }
                await connection.commit();
                console.log(`✅ Saved post leaderboard snapshot for ${lastMonthStr}`);
            } catch (snapshotError) {
                await connection.rollback();
                console.error(`❌ Failed to save post snapshot for ${lastMonthStr}:`, snapshotError.message);
            } finally {
                connection.release();
            }
        } else if (existingPostSnapshot.length > 0) {
            console.log(`⚠️ Post snapshot for ${lastMonthStr} already exists, skipping...`);
        }

        // Award XP to top 3, badge only to rank 1 post contributors
        const postTop3 = postTop20.slice(0, 3);
        for (let i = 0; i < postTop3.length; i++) {
            const user = postTop3[i];
            const rank = i + 1;
            const xp = POST_XP[rank];
            const actionType = `LEADERBOARD_POST_RANK_${rank}`;

            await awardXP(user.userProfileID, actionType, rank, xp);
            await createNotification(
                user.userID,
                "leaderboard_reward",
                `Congratulations! You ranked #${rank} on the Community Post Leaderboard for ${lastMonthStr} and earned ${xp} XP!`,
                db
            );
            console.log(`🔔 Notification sent to userID ${user.userID} for post rank ${rank}`);
        }

        // Badge for post rank 1
        if (postTop3.length > 0) {
            const rank1Post = postTop3[0];
            const [existingPostBadge] = await db.query(
                `SELECT id FROM badge 
                 WHERE userProfileID = ? AND badge_type = 'top_post' AND awarded_month = ?`,
                [rank1Post.userProfileID, lastMonthStr]
            );

            if (existingPostBadge.length === 0) {
                await db.query(
                    `INSERT INTO badge (userProfileID, badge_type, awarded_month)
                     VALUES (?, 'top_post', ?)`,
                    [rank1Post.userProfileID, lastMonthStr]
                );
                console.log(`✅ Awarded top_post badge to userProfileID ${rank1Post.userProfileID} for ${lastMonthStr}`);
            } else {
                console.log(`⚠️ top_post badge already awarded to userProfileID ${rank1Post.userProfileID} for ${lastMonthStr}, skipping...`);
            }
        }

        console.log("✅ Monthly leaderboard XP rewards complete.");
        
        console.log("✅ Status Cleanup Complete.");

    } catch (error) {
        console.error("❌ Error during status cleanup script:", error);
        throw error;
    }
}

// Run the script and exit
runDailyMaintenance()
    .then(async () => {
        await db.end();
        process.exit(0);
    })
    .catch(async (err) => {
        if (db) await db.end();
        process.exit(1);
    });