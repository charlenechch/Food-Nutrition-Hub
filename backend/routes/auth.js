const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ✅ Ensure your DB connection is here

//---------------------------------------------
// ✅ LOGIN ROUTE – FIXED & IMPROVED
//---------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ 1. Check if user exists in `user` + join `userProfile` if available
    const [users] = await db.execute(`
      SELECT u.userID, u.email, u.role, 
             up.userProfileID, up.firstname, up.lastname
      FROM user u
      LEFT JOIN userProfile up ON u.userID = up.userID
      WHERE u.email = ? AND u.password = ?
    `, [email, password]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    let user = users[0];
    let userProfileID = user.userProfileID;

    // ✅ 2. If no userProfile exists → auto-create it
    if (!userProfileID) {
      const [result] = await db.execute(
        `INSERT INTO userProfile (userID, firstname, lastname) VALUES (?, ?, ?)`,
        [user.userID, user.firstname || '', user.lastname || '']
      );
      userProfileID = result.insertId;
    }

    // ✅ 3. Save session
    req.session.user = {
      userID: user.userID,
      userProfileID: userProfileID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || 'member'
    };

    console.log('✅ Session saved:', req.session.user);

    return res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user
    });

  } catch (err) {
    console.error('❌ Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

//---------------------------------------------
// ✅ LOGOUT ROUTE
//---------------------------------------------
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

//---------------------------------------------
// ✅ CHECK SESSION ROUTE (FRONTEND USES THIS)
//---------------------------------------------
router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user
    });
  }
  return res.json({
    authenticated: false,
    user: null
  });
});

module.exports = router;
