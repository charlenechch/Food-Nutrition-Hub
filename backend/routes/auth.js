const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ✅ Ensure this is your MySQL pool/connection

// ✅ LOGIN Route — stores full user data into session
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('🟡 Login attempt:', email);

  try {
    // ✅ Join user + userProfile to get userProfileID
    const [results] = await db.execute(`
      SELECT u.userID, u.email, u.role, 
             up.userProfileID, up.firstname, up.lastname
      FROM user u
      INNER JOIN userProfile up ON u.userID = up.userID
      WHERE u.email = ? AND u.password = ?
    `, [email, password]);

    if (results.length === 0) {
      console.log('❌ Invalid login for:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];
    console.log('✅ Login success:', user);

    // ✅ Store clean user object in session
    req.session.user = {
      userID: user.userID,
      userProfileID: user.userProfileID, // ✅ CRUCIAL FOR COMMUNITY POSTS
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || 'member'
    };

    console.log('✅ Session stored:', req.session.user);

    return res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user
    });

  } catch (err) {
    console.error('❌ Error in /login:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ LOGOUT Route
router.post('/logout', (req, res) => {
  console.log('🚪 Logging out user:', req.session.user);
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Error destroying session:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // ✅ Remove session cookie
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

// ✅ SESSION CHECK Route (Already correct)
router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    console.log('✅ Active session:', req.session.user);
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
