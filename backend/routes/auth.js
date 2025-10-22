const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Session check
router.get("/session", async (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user
    });
  }
  return res.json({ authenticated: false, user: null });
});

// ✅ Login route — FIXED to auto-create userProfile
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check user table
    const [users] = await db.execute(`
      SELECT userID, firstname, lastname, email, role
      FROM user
      WHERE email = ? AND password = ?
    `, [email, password]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const user = users[0];

    // 2. Check if userProfile exists
    const [profiles] = await db.execute(`
      SELECT userProfileID FROM userProfile
      WHERE userID = ?
    `, [user.userID]);

    let userProfileID;
    if (profiles.length === 0) {
      // 3. Auto-create userProfile if missing
      const [result] = await db.execute(`
        INSERT INTO userProfile (userID, firstname, lastname)
        VALUES (?, ?, ?)
      `, [user.userID, user.firstname || "", user.lastname || ""]);
      userProfileID = result.insertId;
    } else {
      userProfileID = profiles[0].userProfileID;
    }

    // 4. Save to session
    req.session.user = {
      userID: user.userID,
      userProfileID: userProfileID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    };

    return res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
