const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../config/mailer");
const { CURRENT_POLICY_VERSION, POLICY_LAST_UPDATED_EN, POLICY_LAST_UPDATED_MS } = require('../config/policyVersion');

// Parse JSON Bodies
router.use(express.json());

// Session Check (Supports Guests + Verifies Suspension + Grabs Fresh XP)
router.get("/session", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      authenticated: false,
      guest: true,
      message: "Not logged in",
    });
  }

  try {
    // ✅ THE FIX: Join userProfile to grab the fresh total_xp from the database!
    const [rows] = await db.execute(
      `SELECT u.userID, u.role, u.status, u.suspendedUntil, up.total_xp 
       FROM user u 
       LEFT JOIN userProfile up ON u.userID = up.userID 
       WHERE u.userID = ?`,
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
        return res.status(401).json({ 
          authenticated: false, 
          message: "Account suspended",
          suspended: true 
        });
      });
      return;
    }

    // ✅ THE FIX: Inject the fresh XP into the session before sending to React!
    req.session.user.total_xp = user.total_xp || 0;

    // If safe, return the session data
    return res.status(200).json({
      authenticated: true,
      user: req.session.user,
    });

  } catch (err) {
    console.error("Session validation error:", err);
    return res.status(500).json({ authenticated: false, message: "Server error" });
  }
});

// 3. Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
     return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const [users] = await db.execute(
      `SELECT userID, firstname, lastname, email, role, password, pdpa_consent, tnc_consent
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

    // Block Google SSO users from using email/password login
    if (user.password === null) {
      return res.status(403).json({
        success: false,
        googleUserBlocked: true,
        message: "You signed up with Google. Please use Google to sign in.",
      });
    }

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
      `SELECT userProfileID, total_xp FROM userProfile WHERE userID = ?`,
      [user.userID]
    );

    let userProfileID;
    let total_xp = 0;
    if (profiles.length === 0) {
      const [result] = await db.execute(
        `INSERT INTO userProfile (userID, firstname, lastname)
         VALUES (?, ?, ?)`,
        [user.userID, user.firstname || "", user.lastname || ""]
      );
      userProfileID = result.insertId;
    } else {
      userProfileID = profiles[0].userProfileID;
      total_xp = profiles[0].total_xp || 0;
    }

    await db.execute(
      "UPDATE user SET lastLogin = ?, deletion_warning_sent = 0 WHERE userID = ?",
      [new Date(), user.userID]
    );

    req.session.user = {
      userID: user.userID,
      userProfileID: userProfileID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      pdpa_consent: user.pdpa_consent,
      tnc_consent: user.tnc_consent,
      agreed_version: user.agreed_version ?? 0,
      total_xp: total_xp // Inject XP on login
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

// Google Login
router.post("/google-login", async (req, res) => {
  const { email, firstname, lastname, googlePhotoUrl, firebaseUID, rememberDevice } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    // 1. Check if user exists
    const [users] = await db.execute(
      "SELECT * FROM user WHERE email = ?", 
      [email]
    );

    let user;

    if (users.length > 0) {
      // Case A: Existing User
      console.log(`✅ Google Login: Found existing user ${email}`);
      user = users[0];

      // Check for active suspension
      if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
        const untilString = new Date(user.suspendedUntil).toISOString().slice(0, 10);
        console.warn(`🚫 Blocked Google login for suspended user: ${email}. Until: ${untilString}`);
        return res.status(403).json({
          success: false,
          suspended: true,
          message: `Your account is suspended until ${untilString}. Please try again after this date.`,
        });
      }

      // Auto-activate inactive users on login
      if (user.status === "Inactive") {
        await db.execute("UPDATE user SET status = 'Active' WHERE userID = ?", [user.userID]);
        user.status = "Active";
        console.log(`✅ Auto-activated inactive user: ${email}`);
      }

      // Update Firebase UID if it wasn't there before
      if (!user.firebase_uid && firebaseUID) {
        await db.execute("UPDATE user SET firebase_uid = ? WHERE userID = ?", [firebaseUID, user.userID]);
      }
      
      // Optional: If they were unverified, auto-verify them since Google trusts them
      if (user.verified === 'False' || user.verified === 0) {
         await db.execute("UPDATE user SET verified = 'True' WHERE userID = ?", [user.userID]);
         user.verified = 'True';
      }

      if (googlePhotoUrl) {
         await db.execute(
            `UPDATE userProfile 
             SET avatar = ? 
             WHERE userID = ? AND (avatar IS NULL OR avatar = '')`, 
            [googlePhotoUrl, user.userID]
         );
         console.log(`🖼️ Updated avatar for existing user ${user.userID}`);
      }

    } else {
      // Case B: New User (Auto-Register)
      console.log(`Google Login: Creating new user for ${email}`);

      // Insert new user with NULL password and Verified = True
      const [result] = await db.execute(
        `INSERT INTO user 
        (firstname, lastname, email, password, role, verified, firebase_uid, status, pdpa_consent, tnc_consent, agreed_version) 
        VALUES (?, ?, ?, NULL, 'member', 'True', ?, 'Active', 0, 0, 0)`,
        [firstname || "User", lastname || "", email, firebaseUID || ""]
      );

      const newUserID = result.insertId;

      // Create their UserProfile 
      await db.execute(
        `INSERT INTO userProfile 
         (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language, recipes, posts, likes, avatar, total_xp) 
         VALUES (?, '[]', '[]', true, true, true, 'en', 0, 0, 0, ?, 0)`,
        [newUserID, googlePhotoUrl || null]
      );

      // Fetch the full user object again to be safe
      const [newUsers] = await db.execute("SELECT * FROM user WHERE userID = ?", [newUserID]);
      user = newUsers[0];
    }

    // 2. Create Session (Same logic from login.js)
    req.session.regenerate(async (err) => {
      if (err) return res.status(500).json({ message: "Session error" });

      // Remember Me logic
      if (rememberDevice) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        req.session.cookie.maxAge = sevenDays;
        req.session.cookie.expires = new Date(Date.now() + sevenDays);
        req.session.rememberMe = true;
      } else {
        const oneDay = 24 * 60 * 60 * 1000;
        req.session.cookie.maxAge = oneDay;
        req.session.cookie.expires = new Date(Date.now() + oneDay);
        req.session.rememberMe = false;
      }

      // Fetch profile ID and XP for session
      const [profiles] = await db.execute("SELECT userProfileID, total_xp FROM userProfile WHERE userID = ?", [user.userID]);
      const userProfileID = profiles.length > 0 ? profiles[0].userProfileID : null;
      const total_xp = profiles.length > 0 ? profiles[0].total_xp || 0 : 0;

      req.session.user = {
        userID: user.userID,
        userProfileID: userProfileID,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        pdpa_consent: user.pdpa_consent,
        tnc_consent: user.tnc_consent,
        agreed_version: user.agreed_version ?? 0,
        loginMethod: "google",
        total_xp: total_xp
      };

      // Save session
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Session save error" });
        
        // Update Last Login
        db.execute("UPDATE user SET lastLogin = ?, deletion_warning_sent = 0 WHERE userID = ?", [new Date(), user.userID]);

        return res.json({
          success: true,
          message: "Google Login Successful",
          user: req.session.user
        });
      });
    });

  } catch (err) {
    console.error("Google Login Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Logout
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

// Update Password (from Firebase Reset)

router.post("/updatePassword", async (req, res) => {
  // 1️⃣ Define variables first
  const email = req.body.email?.trim();
  const newPassword = req.body.newPassword?.trim();

  // 2️⃣ Log after defining
  console.log("📩 /updatePassword route hit for user:", email);

  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email and newPassword are required",
    });
  }

  try {
    // 🔍 STEP 1: Fetch the CURRENT password hash first
    const [users] = await db.execute(
      "SELECT password FROM user WHERE email = ?",
      [email]
    );

    // If user exists, check if new password == old password
    if (users.length > 0) {
      const currentHash = users[0].password;
      
      // Only compare if a hash actually exists
      if (currentHash) {
        const isSame = await bcrypt.compare(newPassword, currentHash);
        
        // 🛑 STEP 2: Block if passwords are the same
        if (isSame) {
          console.warn(`⚠️ User ${email} tried to use the same password.`);
          return res.status(400).json({
            success: false,
            message: "New password cannot be the same as your current password.",
          });
        }
      }
    }

    console.log(`🔑 Hashing new password for: ${email}`);
    const hashed = await bcrypt.hash(newPassword, 10);

    console.log(`💾 Updating password in MySQL for: ${email}`);
    const [result] = await db.execute(
      `UPDATE user SET password = ? WHERE email = ?`,
      [hashed, email]
    );

    if (result.affectedRows === 0) {
      console.log(`ℹ️ No user found in MySQL for: ${email}. Skipping update.`);
      return res.json({
        success: true,
        message: "No matching MySQL user; skipped update",
      });
    }

    console.log(`✅ Password successfully updated in MySQL for: ${email}`);
    return res.json({ success: true, message: "Password updated in MySQL" });

  } catch (err) {
    console.error(`💥 /updatePassword error for ${email}:`, err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during password update" 
    });
  }
});

// Verify Password (for Account Deletion)
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

// Sync Email Verification
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

          <p><a href="https://sarawakeats.site/home">Start exploring SarawakEats</a></p>
          
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

// Role Toggle
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

// Check if an email belongs to a Google SSO user (for Forgot Password gate)
router.post("/checkLoginMethod", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const [users] = await db.execute(
      "SELECT password FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    // If no user found, return isGoogleUser: false so the forgot password flow continues normally
    if (users.length === 0) {
      return res.json({ isGoogleUser: false });
    }

    const isGoogleUser = users[0].password === null;
    return res.json({ isGoogleUser });

  } catch (err) {
    console.error("checkLoginMethod error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get('/policyversion', (req, res) => {
  res.json({ version: CURRENT_POLICY_VERSION, lastUpdatedEN: POLICY_LAST_UPDATED_EN, lastUpdatedMS: POLICY_LAST_UPDATED_MS });
});

// Verify OTP for account deletion (Google SSO users)
router.post("/verifyDeletionOTP", async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { code } = req.body;
  const userID = req.session.user.userID;

  if (!code) {
    return res.status(400).json({ error: "Verification code is required." });
  }

  try {
    const [rows] = await db.execute(
      "SELECT * FROM otp WHERE userID = ? AND code = ? AND expires_at > NOW()",
      [userID, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    await db.execute("DELETE FROM otp WHERE userID = ?", [userID]);

    return res.json({ success: true, message: "Code verified." });

  } catch (err) {
    console.error("❌ Deletion OTP verify error:", err);
    return res.status(500).json({ error: "Verification failed." });
  }
});

module.exports = router;