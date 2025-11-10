const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { pool: db } = require("../config/db");
const userProfileRoutes = require("../routes/userProfile");
const deleteUser = userProfileRoutes.deleteUser;
const { updateFirebaseEmail } = userProfileRoutes;

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

    const { name, email, city, role, status, suspendedUntil } = req.body;

    // This catches the 'undefined' parameter error.
    if (!name || !email || !role || !status) {
      console.warn("❌ Admin update validation failed. Missing data:", { name, email, role, status });
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed. Name, email, role, and status are required." 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    // Check if user exists
    const [existingUser] = await db.execute(
      'SELECT userID, email, status, firebase_uid FROM user WHERE userID = ?',
      [targetUserID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const currentStatus = existingUser[0].status;
    const currentEmail = existingUser[0].email;
    const firebaseUID = existingUser[0].firebase_uid;

    let finalStatus = currentStatus; // Default to current status in DB

    // Rule: Admin can only change status IF the action involves suspension (set or clear).
    const isSuspensionAction = (status === 'Suspended') || (suspendedUntil === null);

    if (isSuspensionAction) {
        // Allow the status change calculated by the frontend (Suspending or Unsuspecting)
        finalStatus = status; 
    } else {
        // If the admin tried to manually set 'Active' or 'Inactive', block the change.
        if (status && status !== currentStatus) {
            console.warn(`⚠️ Admin attempted to manually change status from ${currentStatus} to ${status}. Change blocked, status retained.`);
        }
        finalStatus = currentStatus; 
    }
    
    // Calculate final suspendedUntil date based on the *finalStatus*.
    // Only set a date if the final calculated status is 'Suspended'.
    const finalsuspendedUntil = (finalStatus === 'Suspended')
      ? (suspendedUntil ? new Date(suspendedUntil) : null) 
      : null; 

    // Synchronize Email with Firebase Auth
    if (email !== currentEmail) {
      // Check if email is being changed to one that already exists
      const [emailCheck] = await db.execute(
        'SELECT userID FROM user WHERE email = ? AND userID != ?',
        [email, targetUserID]
      );
    }

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
          } catch (firebaseError) {
              // If Firebase update fails, stop the MySQL update too
              console.error("❌ Failed to update email in Firebase Auth:", firebaseError.message);
              return res.status(500).json({ 
                  success: false, 
                  message: "Failed to update user email (Authentication sync failed)." 
              });
          }
      }

    // Split name into firstname and lastname
    const nameParts = name.trim().split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';
    
    // Update user table
    const userRole = role === 'Admin' ? 'admin' : 'member';
    await db.execute(
      'UPDATE user SET firstname = ?, lastname = ?, email = ?, role = ?, status = ?, suspendedUntil = ? WHERE userID = ?',
      [firstname, lastname, email, userRole, status, finalsuspendedUntil, targetUserID]
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
      await db.execute(
        'UPDATE userProfile SET location = ? WHERE userID = ?',
        [city || null, targetUserID]
      );
    }

    console.log(`✅ Admin updated user: ${email} (ID: ${targetUserID})`);

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
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update user",
      error: error.message 
    });
  }
});

module.exports = router;
