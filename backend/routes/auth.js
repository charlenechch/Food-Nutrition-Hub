const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");

/* ✅ 1. Session Check (Supports Guests)
   - If user is logged in → return session user
   - If user is not logged in (guest) → return 401 with { guest: true }
*/
router.get("/session", async (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      authenticated: true,
      user: req.session.user
    });
  }

  // ✅ Return guest instead of logging out or forcing null
  return res.status(401).json({
    authenticated: false,
    guest: true,
    message: "Not logged in"
  });
});

/* ✅ 2. Login (Creates session + userProfile if missing)
   ⚠ CHANGED: secure password verification with bcrypt, plus one-time migration
*/
router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) Look up by email ONLY (we need the stored hash/plaintext to verify)
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

    // 2) Decide if stored password is bcrypt hash or legacy plaintext
    const stored = user.password || "";
    const looksHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");

    let valid = false;

    if (looksHashed) {
      // ✅ Normal path: compare against bcrypt hash
      valid = await bcrypt.compare(password, stored);
    } else {
      // ⚠ Legacy path: DB still has plaintext; compare once…
      if (password === stored) {
        valid = true;
        // …then immediately rehash + upgrade in DB (one-time migration)
        try {
          const hashed = await bcrypt.hash(password, 10);
          await db.execute(
            `UPDATE user SET password = ? WHERE userID = ?`,
            [hashed, user.userID]
          );
          console.log(`🔐 Migrated plaintext password → bcrypt for userID=${user.userID}`);
        } catch (mErr) {
          console.error("Password migration error:", mErr);
          // proceed with login; migration can retry next login if needed
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

    // 3) Check if profile exists
    const [profiles] = await db.execute(
      `SELECT userProfileID FROM userProfile WHERE userID = ?`,
      [user.userID]
    );

    let userProfileID;
    if (profiles.length === 0) {
      // 4) If no profile → auto-create
      const [result] = await db.execute(
        `INSERT INTO userProfile (userID, firstname, lastname)
         VALUES (?, ?, ?)`,
        [user.userID, user.firstname || "", user.lastname || ""]
      );
      userProfileID = result.insertId;
    } else {
      userProfileID = profiles[0].userProfileID;
    }

    // 5) Save to session
    req.session.user = {
      userID: user.userID,
      userProfileID: userProfileID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    };

    return res.json({
      success: true,
      user: req.session.user
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ✅ 3. Logout (Clears session) */
router.post("/api/logout", (req, res) => {
  try {
    req.session.destroy(() => {
      return res.json({ success: true, message: "Logged out" });
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

/* ➕ NEW: 4. Update password after Firebase reset (MySQL sync)
   - Mounted by server as: POST /api/auth/updatePassword
   - Body: { email, newPassword }
   - Hashes the new password before storing
*/
router.post("/updatePassword", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: "Email and newPassword are required" });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await db.execute(
      `UPDATE user SET password = ? WHERE email = ?`,
      [hashed, email]
    );

    if (result.affectedRows === 0) {
      // Not an error; some accounts may be Firebase-only without a local row.
      return res.json({ success: true, message: "No matching MySQL user; skipped update" });
    }

    return res.json({ success: true, message: "Password updated in MySQL" });
  } catch (err) {
    console.error("UpdatePassword error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Verify user's password for account deletion
router.post("/verifyAccountDeletion", async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { password } = req.body;
  const userEmail = req.session.user.email;

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

// Sync email verification status from Firebase to MySQL
router.post("/syncEmailVerification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Update verified status in MySQL
    const [result] = await db.execute(
      "UPDATE user SET verified = 1 WHERE email = ?",
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`Email verification synced for: ${email}`);
    
    return res.json({ 
      success: true, 
      message: "Email verification synced successfully" 
    });

  } catch (error) {
    console.error("Error syncing email verification:", error);
    return res.status(500).json({ error: "Failed to sync verification status" });
  }
});

module.exports = router;
