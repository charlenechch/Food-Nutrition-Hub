const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { pool: db } = require("../config/db");
const userProfileRoutes = require("../routes/userProfile");
const deleteUser = userProfileRoutes.deleteUser;
const { updateFirebaseEmail, createFirebaseUser } = userProfileRoutes;
const { sendEmail } = require("../config/mailer");
const { createNotification, isEmailNotificationsEnabled } = require("./notifications");
const { logActivity } = require("./adminActivityLog");
const { embedFood, embedFoodS1, embedFoodS3, embedFoodS4 } = require("../utils/embeddings");

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
             hour12: false 
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
      'SELECT firebase_uid, firstname, lastname, email FROM user WHERE userID = ?',
      [targetUserID]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const targetUser = userRows[0];
    const firebaseUID = targetUser.firebase_uid || null;
    const userEmail = targetUser.email;
    const userName = `${targetUser.firstname} ${targetUser.lastname}`;
    console.log(`Admin deleting user ${targetUserID} (${userName}) with Firebase UID: ${firebaseUID}`);

    // Send "Account Removed" Email Notification
    if (userEmail) {
        const deletionHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #dc3545; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">Account Removed</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #dc3545;">Hello ${targetUser.firstname},</h2>
              <p>This email is to inform you that your SarawakEats account (<strong>${userEmail}</strong>) has been removed by an administrator.</p>
              
              <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; color: #721c24; border-left: 5px solid #dc3545;">
                <p style="margin: 5px 0 0; font-size: 0.9em;">If you believe this is a mistake, please contact us at <a href="mailto:info@sarawakeats.com">info@sarawakeats.com</a> immediately.</p>
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;

        sendEmail({
            to: userEmail,
            subject: "Important: Your Account Has Been Removed",
            html: deletionHTML,
            text: "Your account has been removed by an administrator."
        });
        console.log(`📩 Deletion notification sent to ${userEmail}`);
    }

    // Call the helper function
    const result = await deleteUser(targetUserID, firebaseUID);

    const adminID = req.session.user.userID;
    const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
    await logActivity(db, adminID, adminName, "user_deleted", `Deleted user "${userName}" (ID: ${targetUserID}).`);

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

    const { role, status, suspendedUntil, suspensionReason } = req.body;

    if (role !== undefined && !role) {
      return res.status(400).json({ 
        success: false,
        message: "Role is required." 
      });
    }

    // Fetch User and Profile to compare old values
    const [existingUser] = await db.execute(
      `SELECT u.*, up.location 
      FROM user u 
      LEFT JOIN userProfile up ON u.userID = up.userID 
      WHERE u.userID = ?`,
      [targetUserID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const currentUser = existingUser[0];

    // Detect changes for email content
    const changes = [];

    // Check role (Standardize and Compare)
    const currentDbRole = currentUser.role; // Database value: 'admin' or 'member'
    const requestedUiRole = role;           // UI value: 'Admin' or 'User'

    // Convert the current DB role to its Title Case UI equivalent for comparison:
    const currentUiRole = currentDbRole === 'admin' ? 'Admin' : 'User'; 

    // Compare the requested UI role against the current UI role:
    if (requestedUiRole && requestedUiRole !== currentUiRole) {
        // Only push the change if the role alias is genuinely different (e.g., Member -> Admin).
        changes.push(`Account role changed to ${requestedUiRole}`);
    }
    
    // If nothing specific found (or only internal fields changed), default message
    if (changes.length === 0) {
        changes.push("Profile details updated");
    }

    // Generate HTML list for email
    const changesListHTML = changes.map(change => `<li>${change}</li>`).join('');

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
    
    // Update user table
    const userRole = role ? (role === 'Admin' ? 'admin' : 'member') : currentUser.role;
    await db.execute(
      'UPDATE user SET role = ?, status = ?, suspendedUntil = ? WHERE userID = ?',
      [userRole, finalStatus, finalsuspendedUntil, targetUserID]
    );

    console.log(`✅ Admin updated user ID: ${targetUserID}`);

    // Invalidate sessions if suspended OR role changed OR email changed if the user is currently logged in
    const roleChanged = (role && (role === 'Admin' ? 'admin' : 'member') !== currentUser.role);
    const isSuspended = (finalsuspendedUntil && new Date(finalsuspendedUntil) > new Date());

    if (isSuspended || roleChanged) {
      console.log(`🔒 Security Update for user ${targetUserID} (Suspended: ${isSuspended}, Role Changed: ${roleChanged})`);
      console.log(`🚫 Invalidating active sessions to enforce new permissions.`);
      try {
          // This deletes their session file, forcing a logout
          await db.query(`DELETE FROM sessions WHERE data LIKE ?`, [`%\"userID\":${targetUserID}%`]);
          console.log(`✅ Sessions invalidated for user ${targetUserID}`);
      } catch (sessionErr) {
          console.error("⚠️ Failed to invalidate sessions:", sessionErr.message);
      }
    }

    const wasSuspended = currentUser.suspendedUntil && new Date(currentUser.suspendedUntil) > new Date();
    const isNowSuspended = finalsuspendedUntil && new Date(finalsuspendedUntil) > new Date();

    // Case A: Account Suspended
    if (!wasSuspended && isNowSuspended) {
        const suspendHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #dc3545; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">Account Suspended</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #dc3545;">Hello ${currentUser.firstname},</h2>
              <p>Your account has been suspended by an administrator.</p>
              
              <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #dc3545;">
                <p><strong>Reason:</strong> ${suspensionReason || "No specific reason provided"}</p>
                <p><strong>Suspended Until:</strong> ${finalsuspendedUntil}</p>
              </div>

              <p>You will not be able to log in or post content until the suspension period expires.</p>

              <p style="margin-top: 15px; font-size: 0.95em;">
                If you believe this suspension is an error or would like to request an early unsuspension, 
                please contact us at <a href="mailto:info@sarawakeats.com">info@sarawakeats.com</a> for an appeal.
              </p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;

        sendEmail({
            to: currentUser.email,
            subject: "Important: Your Account Has Been Suspended",
            html: suspendHTML,
            text: `Your account has been suspended until ${finalsuspendedUntil}. Reason: ${suspensionReason}`
        });
        console.log(`📩 Suspension email sent to ${currentUser.email}`);
        await createNotification(targetUserID, "suspended", `Your account has been suspended until ${finalsuspendedUntil}. Reason: ${suspensionReason || "No specific reason provided."}`, db);
        console.log(`🔔 Suspension notification created for userID: ${targetUserID}`);

        const adminID = req.session.user.userID;
        const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
        await logActivity(db, adminID, adminName, "user_suspended", `Suspended user "${`${currentUser.firstname} ${currentUser.lastname}`.trim()}" (ID: ${targetUserID}) until ${finalsuspendedUntil}. Reason: ${suspensionReason || "No reason provided."}`);
    }

    // Case B: Account Unsuspended (Manually)
    else if (wasSuspended && !isNowSuspended) {
        const unsuspendHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #28a745; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">Account Reactivated</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #28a745;">Welcome back, ${currentUser.firstname}!</h2>
              <p>Your account suspension has been lifted.</p>
              
              <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #28a745;">
                <p>You can now log in to SarawakEats and access your account.</p>
              </div>

              <p><a href="https://sarawakeats.site/loginregister">Log in to SarawakEats</a></p>

              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;

        sendEmail({
            to: currentUser.email,
            subject: "Important: Your Account Suspension Has Been Lifted By An Admin",
            html: unsuspendHTML,
            text: "Your account suspension has been lifted by an admin. You can now log in."
        });
        console.log(`📩 Unsuspension email sent to ${currentUser.email}`);
        await createNotification(targetUserID, "unsuspended", "Your account suspension has been lifted. You can now log in.", db);
        console.log(`🔔 Unsuspension notification created for userID: ${targetUserID}`);

        const adminID = req.session.user.userID;
        const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
        await logActivity(db, adminID, adminName, "user_unsuspended", `Lifted suspension for user "${`${currentUser.firstname} ${currentUser.lastname}`.trim()}" (ID: ${targetUserID}).`);
    }

    const statusEmailSent = (!wasSuspended && isNowSuspended) || (wasSuspended && !isNowSuspended);

    if (!statusEmailSent) {
      // Send "Account Updated" Email Notification when user details is edited
      const updateHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #17a2b8; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Account Details Updated</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #17a2b8;">Hello ${currentUser.firstname},</h2>
            <p>Your SarawakEats account details have been updated by an administrator.</p>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #17a2b8;">
              <p style="margin: 0;"><strong>What changed?</strong></p>
              <ul style="margin: 5px 0 0 20px; padding: 0;">
                ${changesListHTML} 
              </ul>
            </div>

            <p>If you did not request this change, please contact us at <a href="mailto:info@sarawakeats.com">info@sarawakeats.com</a> immediately.</p>
            
            <p><a href="https://sarawakeats.site/profile">View your profile</a></p>

            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              Best regards,<br>The SarawakEats Team
            </p>
          </div>
        </div>
      `;

      // Role change emails bypass notification toggle
      sendEmail({
          to: currentUser.email, 
          subject: "Important: Your Account Details Have Been Updated",
          html: updateHTML,
          text: "Your account details have been updated by an administrator."
      });
      console.log(`📩 Account update email sent to ${currentUser.email}`);
      await createNotification(targetUserID, "account_updated", `Your account details have been updated by an administrator. Changes: ${changes.join(", ")}.`, db);
      console.log(`🔔 Account update notification created for userID: ${targetUserID}`);
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
            hour12: false 
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

    if (!wasSuspended && !isNowSuspended && !(!wasSuspended && isNowSuspended) && !(wasSuspended && !isNowSuspended)) {
      const adminID = req.session.user.userID;
      const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
      await logActivity(db, adminID, adminName, "user_updated", `Updated user "${`${currentUser.firstname} ${currentUser.lastname}`.trim()}" (ID: ${targetUserID}). Changes: ${changes.join(", ")}.`);
    }

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
        let tempPassword;
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
        console.log(`✅ User ${email} created successfully with ID: ${newUserID}.`);
        console.log(`💡 User must use 'Forgot Password' flow to set their initial password.`);

        const welcomeHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #8B4513; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">Welcome to SarawakEats</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #8B4513;">Hello ${firstname},</h2>
              <p>Your account has been successfully created by our admin team.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
              </div>

              <h3 style="color: #8B4513; margin-bottom: 10px;">How to Activate Your Account:</h3>
              <ol style="line-height: 1.6;">
                <li>Go to the login page and click <strong>"Forgot Password"</strong> to set your initial password.</li>
                <li>Log in with your new password.</li>
                <li>Look for the notification saying "Email not verified" and click the <strong>"Resend Verification Email"</strong> button.</li>
                <li>Check your inbox for the verification link to fully activate your account.</li>
              </ol>
              <p style="background-color: #fff8f0; padding: 12px; border-left: 4px solid #8B4513; border-radius: 4px; font-size: 13px;">
                <strong>Note:</strong> Some email apps automatically scan links in emails for security, which can cause the verification link to appear expired. If this happens, try logging in anyway. It may still work.
              </p>
              
              <p><a href="https://sarawakeats.site/loginregister">Go to the login page</a></p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;

        // Send async (don't await it, so the admin dashboard doesn't lag)
        sendEmail({
            to: email,
            subject: "Welcome to SarawakEats! Account Created",
            text: `Welcome ${firstname}! Your account has been created. Please use Forgot Password to log in.`,
            html: welcomeHTML
        });

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

        const adminID = req.session.user.userID;
        const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
        await logActivity(db, adminID, adminName, "user_created", `Created new user "${name}" (${email}) with ${role} role.`);

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

// Send System Announcement
router.post("/announcement", requireAdmin, async (req, res) => {
    try {
        const { userIds: rawUserIds, emails: rawEmails, subject, message, sendEmail: shouldSendEmail } = req.body;

        // Ensure userIds and emails are always arrays
        const userIds = rawUserIds ? String(rawUserIds).split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];
        const emails = rawEmails ? String(rawEmails).split(",").filter(e => e.trim()) : [];

        if (!subject?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "Subject and message are required." });
        }

        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ success: false, message: "No recipients selected." });
        }

        // Always create in-app notifications for all selected users
        const notifPromises = userIds.map(userID =>
            createNotification(userID, "announcement", `${subject}: ${message}`, db)
        );
        await Promise.all(notifPromises);
        console.log(`🔔 Announcement notifications created for ${userIds.length} users.`);

        // Return success immediately after notifications are created
        res.json({
            success: true,
            count: userIds.length
        });

        const adminID = req.session.user.userID;
        const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
        await logActivity(db, adminID, adminName, "announcement_sent", `Sent announcement to ${userIds.length} user(s). Subject: "${subject}".`);

        // Optionally send emails if "Also send as email" is checked
        if (shouldSendEmail && emails && emails.length > 0) {
            const announcementHTML = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #8B4513; padding: 20px; text-align: center;">
                  <h1 style="color: #fff; margin: 0;">SarawakEats Announcement</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                  <h2 style="color: #8B4513;">${subject}</h2>
                  <p style="white-space: pre-line;">${message}</p>
                  <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                    Best regards,<br>The SarawakEats Team
                  </p>
                </div>
              </div>
            `;

            let emailsSent = 0;
            for (const email of emails) {
                try {
                    await sendEmail({
                        to: email,
                        subject: subject,
                        html: announcementHTML,
                        text: message
                    });
                    emailsSent++;
                    console.log(`📩 Announcement email sent to ${email} (${emailsSent}/${emails.length})`);
                } catch (emailErr) {
                    console.error(`❌ Failed to send announcement email to ${email}:`, emailErr.message);
                }
                // Known limitation: Resend free tier allows max 5 requests/second.
                // We throttle to ~3 emails/second (300ms delay) to stay safely under the limit.
                // Upgrade Resend plan to remove this limitation.
                if (emailsSent < emails.length) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            console.log(`📩 Announcement emails completed. Sent ${emailsSent}/${emails.length} successfully.`);
        }
    } catch (error) {
        console.error("❌ Announcement error:", error);
        return res.status(500).json({ success: false, message: "Failed to send announcement." });
    }
});

// embed
router.get("/embed-all", async (req, res) => {
  try {
    // only embed foods that have real nutrition data
    const [rows] = await db.execute(
      `SELECT foodID, name, description, commonIngredients, culturalSignificance, traditionalPreparation 
      FROM food 
      WHERE Energy_kcal > 0 
      AND Protein_g > 0
      AND Fat_g > 0
      AND Carbohydrates_g > 0
      AND description IS NOT NULL
      AND description != ''
      AND LENGTH(description) > 20
      AND name NOT LIKE '%test%'
      AND name NOT LIKE '%ddd%'`
    );

    // Respond immediately so request doesn't timeout
    res.json({ ok: true, message: `Started embedding ${rows.length} foods. Check Railway logs.` });

    // Run in background
    for (const row of rows) {
      try {
        await embedFoodS1(row.foodID, row.name, row.description || "");
        await new Promise(r => setTimeout(r, 200));
        await embedFood(row.foodID, row.name, row.description || "", row.commonIngredients || "");
        await new Promise(r => setTimeout(r, 200));
        await embedFoodS3(row.foodID, row.name, row.description || "", row.commonIngredients || "", row.traditionalPreparation || "");
        await new Promise(r => setTimeout(r, 200));
        console.log(`✅ Done: ${row.name}`);
      } catch (err) {
        console.error(`❌ Failed: ${row.name}`, err.message);
      }
    }
    console.log("✅ All embeddings done!");
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;