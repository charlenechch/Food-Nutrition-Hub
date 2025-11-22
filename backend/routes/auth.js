const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../config/mailer");

// ✅ 1. PARSE JSON BODIES
// This middleware *must* come before your routes to parse req.body
router.use(express.json());

/* ✅ 2. Session Check (Supports Guests + Verifies Suspension)
  - Path: GET /session
*/
router.get("/session", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      authenticated: false,
      guest: true,
      message: "Not logged in",
    });
  }

  try {
    // Query DB to ensure user isn't suspended/deleted
    // Query the 'user' table using the ID stored in the session
    const [rows] = await db.execute(
      "SELECT userID, role, status, suspendedUntil FROM user WHERE userID = ?",
      [req.session.user.userID]
    );

    // Case A: User was deleted from database
    if (rows.length === 0) {
      req.session.destroy();
      return res.status(401).json({ authenticated: false, message: "User not found" });
    }

    const user = rows[0];

    // Case B: User is Suspended (Current time < suspendedUntil)
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      console.log(`⛔ Blocked suspended user session: ${req.session.user.email}`);
      
      // Kill the session immediately
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        // Return 401 so the frontend interceptor catches it
        return res.status(401).json({ 
          authenticated: false, 
          message: "Account suspended",
          suspended: true 
        });
      });
      return;
    }

    // If safe, return the session data
    return res.status(200).json({
      authenticated: true,
      user: req.session.user,
    });

  } catch (err) {
    console.error("Session validation error:", err);
    // If DB fails, returning 500 is safer than letting them stay logged in
    return res.status(500).json({ authenticated: false, message: "Server error" });
  }
});

/* ✅ 3. Login
  - Path: POST /login
*/
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
     return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const [users] = await db.execute(
      `SELECT userID, firstname, lastname, email, role, password
       FROM user
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];
    const stored = user.password || "";
    const looksHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
    let valid = false;

    if (looksHashed) {
      valid = await bcrypt.compare(password, stored);
    } else {
      if (password === stored) {
        valid = true;
        try {
          const hashed = await bcrypt.hash(password, 10);
          await db.execute(
            `UPDATE user SET password = ? WHERE userID = ?`,
            [hashed, user.userID]
          );
          console.log(`🔐 Migrated plaintext password → bcrypt for userID=${user.userID}`);
        } catch (mErr) {
          console.error("Password migration error:", mErr);
        }
      } else {
        valid = false;
      }
    }

    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const [profiles] = await db.execute(
      `SELECT userProfileID FROM userProfile WHERE userID = ?`,
      [user.userID]
    );

    let userProfileID;
    if (profiles.length === 0) {
      const [result] = await db.execute(
        `INSERT INTO userProfile (userID, firstname, lastname)
         VALUES (?, ?, ?)`,
        [user.userID, user.firstname || "", user.lastname || ""]
      );
      userProfileID = result.insertId;
    } else {
      userProfileID = profiles[0].userProfileID;
    }

    req.session.user = {
      userID: user.userID,
      userProfileID: userProfileID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    };

    return res.json({
      success: true,
      user: req.session.user,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ✅ 4. Logout
  - Path: POST /logout
*/
router.post("/logout", (req, res) => {
  try {
    req.session.destroy(() => {
      return res.json({ success: true, message: "Logged out" });
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

/* ✅ 5. Update Password (from Firebase Reset)
  - Path: POST /updatePassword
*/
router.post("/updatePassword", async (req, res) => {
  console.log("📩 /updatePassword route hit for user:", email);

  // Use string trimming for safety
  const email = req.body.email?.trim();
  const newPassword = req.body.newPassword?.trim();

  // Robust check for undefined, null, or empty strings
  if (!email || !newPassword) {
    console.warn("⚠️ Validation failed. Email or newPassword missing.", { email, newPassword });
    return res.status(400).json({
      success: false,
      message: "Email and newPassword are required",
    });
  }

  try {
    console.log(`🔑 Hashing password for: ${email}`);
    const hashed = await bcrypt.hash(newPassword, 10);

    console.log(`💾 Updating password in MySQL for: ${email}`);
    const [result] = await db.execute(
      `UPDATE user SET password = ? WHERE email = ?`,
      [hashed, email]
    );

    if (result.affectedRows === 0) {
      console.log(`ℹ️ No user found in MySQL for: ${email}. Skipping update.`);
      // This is still a "success" because Firebase updated.
      return res.json({
        success: true,
        message: "No matching MySQL user; skipped update",
      });
    }

    console.log(`✅ Password successfully updated in MySQL for: ${email}`);
    return res.json({ success: true, message: "Password updated in MySQL" });

  } catch (err) {
    console.error(`💥 /updatePassword error for ${email}:`, err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during password update" });
  }
});

/* ✅ 6. Verify Password (for Account Deletion)
  - Path: POST /verifyAccountDeletion
*/
router.post("/verifyAccountDeletion", async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { password } = req.body;
  const userEmail = req.session.user.email;

  if (!password) {
     return res.status(400).json({ error: "Password is required" });
  }

  try {
    const [users] = await db.execute(
      "SELECT password FROM user WHERE email = ?",
      [userEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare(password, users[0].password);

    if (!isValid) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.json({ success: true, message: "Password verified" });
  } catch (error) {
    console.error("Password verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* ✅ 7. Sync Email Verification
  - Path: POST /syncEmailVerification
*/
router.post("/syncEmailVerification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Fetch user first
    const [users] = await db.execute(
      "SELECT userID, firstname, verified FROM user WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // If the database says "True", we stop
    if (user.verified === 'True') {
      return res.json({ success: true, message: "User already verified" });
    }

    await db.execute(
      "UPDATE user SET verified = 'True' WHERE email = ?",
      [email]
    );

    console.log(`✅ Email verified for: ${email}`);

    // Send Email Notification
    const successHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #28a745; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Account Verified!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2 style="color: #28a745;">You're all set, ${user.firstname}!</h2>
          <p>Thank you for verifying your email address.</p>
          
          <div style="background-color: #f0fff4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #28a745;">
            <p style="margin: 0;"><strong>Your account is now fully active.</strong> You can now submit recipes, post stories, and save your favorite foods.</p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://food-nutrition-hub.vercel.app/home" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Exploring</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
            Best regards,<br>The SarawakEats Team
          </p>
        </div>
      </div>
    `;

    sendEmail({
      to: email,
      subject: "Account Verified! Welcome to SarawakEats",
      html: successHTML,
      text: "Your account has been verified! You can now access all features."
    });

    return res.json({ 
      success: true, 
      message: "Email verification synced and notification sent" 
    });

  } catch (error) {
    console.error("Error syncing email verification:", error);
    return res.status(500).json({ error: "Failed to sync verification status" });
  }
});

/* ✅ 8. Role Toggle
  - Path: POST /toggle-role
*/
router.post("/toggle-role", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const currentRole = req.session.user.role;
    const newRole = currentRole === "admin" ? "member" : "admin";

    req.session.user.role = newRole;

    await db.execute(
      "UPDATE user SET role = ? WHERE userID = ?",
      [newRole, req.session.user.userID]
    );

    console.log(`🔁 Role toggled for userID=${req.session.user.userID} → ${newRole}`);
    return res.json({ newRole });
  } catch (error) {
    console.error("Role toggle error:", error);
    return res.status(500).json({ message: "Failed to toggle role" });
  }
});

module.exports = router;

