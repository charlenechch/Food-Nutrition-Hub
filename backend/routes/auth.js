// ✅ backend/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ✅ Make sure database is connected here

// ✅ Check if session exists and return full user details including profileID
router.get('/session', async (req, res) => {
  try {
    // No active session? → Not logged in
    if (!req.session || !req.session.user) {
      return res.json({
        authenticated: false,
        user: null
      });
    }

    // Get logged-in user ID from session object
    const userId = req.session.user.userID || req.session.user.id;

    // ✅ Fetch user + userProfileID from DB
    const [rows] = await db.query(`
      SELECT 
        u.userID,
        u.email,
        u.role,
        up.userProfileID AS profileID   -- ✅ Important: This is the missing value!
      FROM user u
      LEFT JOIN userProfile up ON u.userID = up.userID
      WHERE u.userID = ?
    `, [userId]);

    if (!rows || rows.length === 0) {
      return res.json({ authenticated: false, user: null });
    }

    // ✅ Return full user object to frontend
    return res.json({
      authenticated: true,
      user: rows[0] // Contains: userID, email, role, profileID
    });

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return res.status(500).json({
      authenticated: false,
      user: null,
      message: "Failed to fetch session data"
    });
  }
});

module.exports = router;
