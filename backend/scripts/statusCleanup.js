const { pool: db } = require("../config/db");

// Finds and updates user statuses based on expired suspensions and inactivity.
async function updateStaleAndExpiredUsers() {
    console.log("🕒 Starting Status Cleanup...");
    
    try {
        const now = new Date();
        const nowString = now.toISOString().slice(0, 19).replace("T", " "); // Current timestamp
        
        // Calculate the cutoff date (7 days ago)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setMinutes(sevenDaysAgo.getMinutes() - 2); //TEST 2 MINUTES
        const cutoffDate = sevenDaysAgo.toISOString().slice(0, 19).replace("T", " "); // 7 days ago timestamp
        
        // Find users whose status is "Suspended" but whose suspendedUntil date is in the past.
        const [expiredSuspensions] = await db.execute(
            `SELECT userID, lastLogin FROM \`user\`
             WHERE \`status\` = 'Suspended' 
               AND \`suspendedUntil\` < ?`, // Check if the expiration date is older than now
            [nowString]
        );

        if (expiredSuspensions.length > 0) {
            console.log(`Found ${expiredSuspensions.length} expired suspensions to process.`);
            
            const toActivate = [];
            const toInactivate = [];

            expiredSuspensions.forEach(user => {
                // Determine if their lastLogin date is older than 7 days
                // The comparison is between the user's lastLogin timestamp and the cutoffDate string.
                const isInactive = user.lastLogin === null || new Date(user.lastLogin).getTime() < sevenDaysAgo.getTime();
                
                if (isInactive) {
                    toInactivate.push(user.userID); // Suspended + Inactive for 7+ days = INACTIVE status
                } else {
                    toActivate.push(user.userID);   // Suspended + Active recently = ACTIVE status
                }
            });

            // 1a. Set users to 'Inactive' (Suspension expired AND inactive)
            if (toInactivate.length > 0) {
                const placeholders = toInactivate.map(() => '?').join(',');
                await db.execute(
                    `UPDATE \`user\` SET \`status\` = 'Inactive', \`suspendedUntil\` = NULL
                     WHERE userID IN (${placeholders})`,
                    toInactivate
                );
                console.log(`✅ ${toInactivate.length} users auto-inactivated after suspension expired.`);
            }

            // 1b. Set users to 'Active' (Suspension expired AND recently active)
            if (toActivate.length > 0) {
                const placeholders = toActivate.map(() => '?').join(',');
                await db.execute(
                    `UPDATE \`user\` SET \`status\` = 'Active', \`suspendedUntil\` = NULL
                     WHERE userID IN (${placeholders})`,
                    toActivate
                );
                console.log(`✅ ${toActivate.length} users auto-activated after suspension expired.`);
            }
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

// Run the script and exit
updateStaleAndExpiredUsers()
    .then(() => {
        // Log success and exit immediately.
        console.log("✅ Script finished execution.");
        process.exit(0); 
    })
    .catch((err) => {
        console.error("❌ Top-level script failed and crashed:", err);
        process.exit(1);
    });