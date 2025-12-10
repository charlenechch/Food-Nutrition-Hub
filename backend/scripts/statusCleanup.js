const { pool: db } = require("../config/db");
const { sendEmail } = require("../config/mailer");

// Finds and updates user statuses based on expired suspensions and inactivity.
async function updateStaleAndExpiredUsers() {
    console.log("🕒 Starting Status Cleanup...");
    
    try {
        const now = new Date();
        const nowString = now.toISOString().slice(0, 19).replace("T", " "); // Current timestamp
        
        // Calculate the cutoff date (7 days ago)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().slice(0, 19).replace("T", " "); // 7 days ago timestamp
        
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

                      <div style="text-align: center; margin-top: 25px;">
                        <a href="https://food-nutrition-hub.vercel.app/loginregister" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
                      </div>
                      
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
        }
        
        console.log("✅ Status Cleanup Complete.");

    } catch (error) {
        console.error("❌ Error during status cleanup script:", error);
    }
}

// Force exit after 30 seconds if script doesn't complete
const forceExitTimer = setTimeout(() => {
    console.log("⚠️ Force exiting after timeout");
    process.exit(1);
}, 30000);

// Run the script and exit
updateStaleAndExpiredUsers()
    .then(() => {
        clearTimeout(forceExitTimer);
        setTimeout(() => process.exit(0), 100); 
    })
    .catch(() => {
        clearTimeout(forceExitTimer);
        process.exit(1);
    });