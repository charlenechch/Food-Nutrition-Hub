const express = require("express");
const router = express.Router();
const db = require("../config/db");

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

/* ✅ 2. Login (Creates session + userProfile if missing) */
router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check user in database
    const [users] = await db.execute(
      `SELECT userID, firstname, lastname, email, role
       FROM user
       WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];

    // 2. Check if profile exists
    const [profiles] = await db.execute(
      `SELECT userProfileID FROM userProfile WHERE userID = ?`,
      [user.userID]
    );

    let userProfileID;
    if (profiles.length === 0) {
      // 3. If no profile → auto-create
      const [result] = await db.execute(
        `INSERT INTO userProfile (userID, firstname, lastname)
         VALUES (?, ?, ?)`,
        [user.userID, user.firstname || "", user.lastname || ""]
      );
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

module.exports = router;
