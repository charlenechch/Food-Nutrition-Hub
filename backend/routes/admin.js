const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { pool: db } = require("../config/db");
const userProfileRoutes = require("../routes/userProfile");
const deleteUser = userProfileRoutes.deleteUser;
const { updateFirebaseEmail, createFirebaseUser } = userProfileRoutes;

// ✅ Example Admin API – only admins can access
router.get("/dashboard", requireAdmin, (req, res) => {
  return res.json({
    success: true,
    message: `Welcome Admin ${req.session.user.firstname}!`,
  });
});

// Admin fetch user list
router.get("/users", requireAdmin, async (req, res) => {
  try {
    // It joins 'user' and 'userProfile' to get all the data in one go.
    const sql = `
      SELECT 
        u.userID, u.firstname, u.lastname, u.email, u.role, u.status, u.lastLogin, u.suspendedUntil,
        up.location, up.recipes, up.posts, up.totalSubmissions
      FROM user u
      LEFT JOIN userProfile up ON u.userID = up.userID
      ORDER BY u.userID ASC;
    `;

    // Use the imported 'db' object
    const [rows] = await db.query(sql);

    // Transform the database data to match the frontend's expected format
    // This makes your frontend component work with almost no changes.
    const users = rows.map(u => {
      // Your userProfile.js logic stores approved counts in 'recipes' and 'posts'
      const approvedCount = (u.recipes || 0) + (u.posts || 0);
      const totalSubmissions = (u.totalSubmissions || 0);

      let formattedLastLogin = "—";
      if (u.lastLogin) {
        try {
          formattedLastLogin = new Date(u.lastLogin).toLocaleString('en-GB', {
             timeZone: "Asia/Kuala_Lumpur",
             day: '2-digit', 
             month: '2-digit', 
             year: 'numeric', 
             hour: '2-digit', 
             minute: '2-digit',
             hour12: true 
          }).replace(',', '');
        } catch (e) {
          console.warn(`Invalid date format for user ${u.userID}: ${u.lastLogin}`);
        }
      }

      return {
        id: u.userID,
        name: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
        email: u.email,
        city: u.location || "N/A",
        role: u.role === 'admin' ? 'Admin' : 'User',
        status: u.status,
        suspendedUntil: u.suspendedUntil ? new Date(u.suspendedUntil).toISOString().slice(0,10) : null,
        submissions: totalSubmissions,
        approved: approvedCount,
        lastLogin: formattedLastLogin
      };
    });

    return res.json({ success: true, users: users });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error while fetching users" });
  }
});

// Admin delete user by ID
router.delete("/users/:id", requireAdmin, async (req, res) => {
  console.log("Admin user deletion request received");
  try {
    const targetUserID = parseInt(req.params.id, 10);
    
    if (!targetUserID || isNaN(targetUserID)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid user ID" 
      });
    }

    // Prevent admin from deleting themselves
    if (req.session.user.userID === targetUserID) {
      return res.status(400).json({ 
        success: false, 
        message: "You cannot delete your own account from here. Use profile settings." 
      });
    }

    // Get Firebase UID from database
    const [userRows] = await db.execute(
      'SELECT firebase_uid, firstname, lastname FROM user WHERE userID = ?',
      [targetUserID]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const firebaseUID = userRows[0]?.firebase_uid || null;
    const userName = `${userRows[0].firstname} ${userRows[0].lastname}`;
    console.log(`Admin deleting user ${targetUserID} (${userName}) with Firebase UID: ${firebaseUID}`);

    // Call the helper function
    const result = await deleteUser(targetUserID, firebaseUID);

    return res.status(200).json({
      success: true,
      message: `User ${userName} deleted successfully`,
      ...result
    });

  } catch (error) {
    console.error("Admin user deletion error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to delete user",
      error: error.message 
    });
  }
});

// Admin update user by ID
router.put("/users/:id", requireAdmin, async (req, res) => {
  console.log("Admin user update request received");
  try {
    const targetUserID = parseInt(req.params.id, 10);
    
    if (!targetUserID || isNaN(targetUserID)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid user ID" 
      });
    }

    const { name, email, city, role, status, suspendedUntil, suspensionReason } = req.body;

    // This catches the 'undefined' parameter error.
    if ((name !== undefined || email !== undefined || role !== undefined) && (!name || !email || !role)) {
      console.warn("❌ Admin update validation failed. Missing data:", { name, email, role });
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed. When updating info, Name, email, and role are required." 
      });
    }

    // Validate email format
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid email format" 
        });
      }
    }

    // Check if user exists
    const [existingUser] = await db.execute(
      'SELECT * FROM user WHERE userID = ?',
      [targetUserID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const currentUser = existingUser[0];
    const currentEmail = existingUser[0].email;
    const firebaseUID = existingUser[0].firebase_uid;
    let shouldResetVerification = false;

    // Calculate final suspendedUntil date.
    // The frontend will send a date-string or null.
    let finalsuspendedUntil = currentUser.suspendedUntil;

     // Check if 'suspendedUntil' was in the request (even if null)
    if (suspendedUntil !== undefined) {
        const dateObj = new Date(suspendedUntil);
        if (suspendedUntil === null) {
            finalsuspendedUntil = null;
        } else if (!isNaN(dateObj) && dateObj.getTime()) {
            finalsuspendedUntil = dateObj.toISOString().slice(0, 10);
        }
    }

    // If status is provided, use it. If not, calculate it based on suspension date.
    let finalStatus = status || currentUser.status;
    
    if (!finalsuspendedUntil && currentUser.status === 'Active') {
      finalStatus = 'Active';
    }

    // Synchronize Email with Firebase Auth
    if (email && email !== currentEmail) {
      // Check if email is being changed to one that already exists
      const [emailCheck] = await db.execute(
        'SELECT userID FROM user WHERE email = ? AND userID != ?',
        [email, targetUserID]
      );

          if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists for another user"
        });
      }

      // Update Firebase Auth first
      if (firebaseUID) {
          try {
              await updateFirebaseEmail(firebaseUID, email);
              shouldResetVerification = true;
          } catch (firebaseError) {
              // If Firebase update fails, stop the MySQL update too
              console.error("❌ Failed to update email in Firebase Auth:", firebaseError.message);
              return res.status(500).json({ 
                  success: false, 
                  message: "Failed to update user email (Authentication sync failed)." 
              });
          }
      }
    }

    // Split name into firstname and lastname
    const nameToSplit = name || `${currentUser.firstname || ''} ${currentUser.lastname || ''}`;
    const nameParts = nameToSplit.trim().split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';

    const newVerificationStatus = shouldResetVerification ? 'False' : currentUser.verified;
    
    // Update user table
    const userRole = role ? (role === 'Admin' ? 'admin' : 'member') : currentUser.role;
    const finalEmail = email || currentUser.email;
    await db.execute(
      'UPDATE user SET firstname = ?, lastname = ?, email = ?, verified = ?, role = ?, status = ?, suspendedUntil = ? WHERE userID = ?',
      [firstname, lastname, finalEmail, newVerificationStatus, userRole, finalStatus, finalsuspendedUntil, targetUserID]
    );

    // Update or create userProfile
    const [profileCheck] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [targetUserID]
    );

    if (profileCheck.length === 0) {
      // Create profile if it doesn't exist
      await db.execute(
        `INSERT INTO userProfile 
         (userID, location, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language, recipes, posts, likes) 
         VALUES (?, ?, '[]', '[]', true, true, true, 'en', 0, 0, 0)`,
        [targetUserID, city || null]
      );
    } else {
      // Update existing profile
      if (city !== undefined) {
        await db.execute(
          'UPDATE userProfile SET location = ? WHERE userID = ?',
          [city || null, targetUserID]
        );
      }
    }

    console.log(`✅ Admin updated user: ${email} (ID: ${targetUserID})`);

    if (finalsuspendedUntil && new Date(finalsuspendedUntil) > new Date()) {
      console.log(`🔒 Suspending user ${targetUserID}: Invalidating active sessions.`);
      try {
          await db.query(`DELETE FROM sessions WHERE data LIKE ?`, [`%\"userID\":${targetUserID}%`]);
          console.log(`✅ Sessions invalidated for user ${targetUserID}`);
      } catch (sessionErr) {
          console.error("⚠️ Failed to invalidate user sessions (table might not exist or differ):", sessionErr.message);
      }
    }

    // Get updated user stats
    const [updatedUser] = await db.execute(
      `SELECT 
        u.userID, u.firstname, u.lastname, u.email, u.role, u.lastLogin, u.status, u.suspendedUntil,
        up.location, up.recipes, up.posts, up.totalSubmissions
      FROM user u
      LEFT JOIN userProfile up ON u.userID = up.userID
      WHERE u.userID = ?`,
      [targetUserID]
    );

    const user = updatedUser[0];
    const approvedCount = (user.recipes || 0) + (user.posts || 0);

    let formattedLastLogin = "—";
    if (user.lastLogin) {
      try {
        formattedLastLogin = new Date(user.lastLogin).toLocaleString('en-GB', {
            timeZone: "Asia/Kuala_Lumpur",
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        }).replace(',', '');
      } catch (e) {
        console.warn(`Invalid date format for user ${user.userID}: ${user.lastLogin}`);
      }
    }

    // Return updated user in the format expected by frontend
    const updatedUserData = {
      id: user.userID,
      name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      email: user.email,
      city: user.location || "N/A",
      role: user.role === 'admin' ? 'Admin' : 'User',
      status: user.status,
      suspendedUntil: user.suspendedUntil ? new Date(user.suspendedUntil).toISOString().slice(0,10) : null,
      submissions: user.totalSubmissions,
      approved: approvedCount,
      lastLogin: formattedLastLogin
    };

    return res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUserData
    });

  } catch (error) {
    console.error("Admin user update error:", error);

    // Check if we attempted a Firebase email change that needs to be reverted
    // 'shouldResetVerification' is the flag that Firebase was successfully changed
    
    if (shouldResetVerification === true && firebaseUID && currentEmail) {
        
        console.warn(`MySQL update failed. Attempting to roll back Firebase email change for UID: ${firebaseUID}`);
        
        try {
            // Revert Firebase email to the original
            await updateFirebaseEmail(firebaseUID, currentEmail);
            
            console.warn(`✅ Firebase email successfully rolled back to: ${currentEmail}`);
        
        } catch (rollbackError) {
            console.error(`❌ CRITICAL: Firebase rollback FAILED for UID: ${firebaseUID}.`, rollbackError);
            
            // This is the worst-case scenario: data is now inconsistent
            return res.status(500).json({ 
                success: false, 
                message: "Failed to update user in database AND Firebase rollback failed. Data is inconsistent.",
                error: error.message 
            });
        }
    }

    return res.status(500).json({ 
      success: false, 
      message: "Failed to update user",
      error: error.message 
    });
  }
});

// Admin create new user
router.post("/users", requireAdmin, async (req, res) => {
    console.log("Admin user creation request received");
    const connection = await db.getConnection();

    try {
        const { name, email, city, role, status, suspendedUntil } = req.body;
        
        // Validation and Data Prep
        if (!name || !email || !role || !status) {
            return res.status(400).json({ success: false, message: "Validation failed. Name, email, role, and status are required." });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }
        
        // Conflict Check in MySQL
        const [emailCheck] = await connection.execute('SELECT userID FROM user WHERE email = ?', [email]);
        if (emailCheck.length > 0) {
            connection.release();
            return res.status(400).json({ success: false, message: "Email already exists in the database." });
        }

        // Start Transaction and Create Firebase User
        await connection.beginTransaction();
        
        let firebaseUID;
        let tempPassword; // Used for logging feedback, not sent to user
        try {
            const result = await createFirebaseUser(email, name, role); 
            firebaseUID = result.uid;
            tempPassword = result.tempPassword;
        } catch (firebaseError) {
            console.error("❌ Fatal Firebase Auth creation error:", firebaseError.message);
            await connection.rollback();
            connection.release();
            return res.status(500).json({ success: false, message: "Failed to create authentication account." });
        }
        
        // Prepare MySQL Data
        const nameParts = name.trim().split(' ');
        const firstname = nameParts[0] || '';
        const lastname = nameParts.slice(1).join(' ') || '';
        const userRole = role === 'Admin' ? 'admin' : 'member';
        
        let finalsuspendedUntil = null;
        if (status === 'Suspended' && suspendedUntil) {
            finalsuspendedUntil = new Date(suspendedUntil).toISOString().slice(0, 10);
        }

        // Insert into MySQL 'user' table
        // Password field is empty/placeholder because Firebase handles authentication.
        // Verified is 'False' and lastLogin is NULL for a new user.
        const [userResult] = await connection.execute(
            `INSERT INTO user 
             (firstname, lastname, email, password, verified, role, status, suspendedUntil, firebase_uid, lastLogin)
             VALUES (?, ?, ?, '', 'False', ?, ?, ?, ?, NULL)`, 
            [firstname, lastname, email, userRole, status, finalsuspendedUntil, firebaseUID]
        );

        const newUserID = userResult.insertId;

        // Insert into MySQL 'userProfile' table
        await connection.execute(
            `INSERT INTO userProfile (userID, location, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language) 
             VALUES (?, ?, '[]', '[]', true, true, true, 'en')`,
            [newUserID, city || null]
        );

        await connection.commit();
        console.log(`✅ User ${email} created successfully with ID: ${newUserID}. Temp password: ${tempPassword}`);

        // Format and Return New User Data
        const newUserData = {
            id: newUserID,
            name: `${firstname} ${lastname}`.trim(),
            email: email,
            city: city || "N/A",
            role: role,
            status: status,
            suspendedUntil: finalsuspendedUntil,
            submissions: 0,
            approved: 0,
            lastLogin: "—"
        };

        return res.status(201).json({
            success: true,
            message: "User created successfully. User must use 'Forgot Password' to set initial password.",
            user: newUserData,
        });

    } catch (error) {
        console.error("❌ Admin user creation error:", error);
        await connection.rollback();
        return res.status(500).json({ success: false, message: "Failed to create user (Database error)", error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
