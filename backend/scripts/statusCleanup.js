const RAILWAY_INTERNAL_HOST = 'mysql.railway.internal';
process.env.DB_HOST = process.env.DB_HOST || RAILWAY_INTERNAL_HOST;

const { pool: db } = require("../config/db");
const { sendEmail } = require("../config/mailer");
const { deleteUser } = require("../routes/userProfile");
const { createNotification, isEmailNotificationsEnabled } = require("../routes/notifications");

// Finds and updates user statuses based on expired suspensions and inactivity.
async function updateStaleAndExpiredUsers() {
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
        
        console.log("✅ Status Cleanup Complete.");

    } catch (error) {
        console.error("❌ Error during status cleanup script:", error);
        throw error;
    }
}

// Run the script and exit
updateStaleAndExpiredUsers()
    .then(async () => {
        await db.end();
        process.exit(0);
    })
    .catch(async (err) => {
        if (db) await db.end();
        process.exit(1);
    });