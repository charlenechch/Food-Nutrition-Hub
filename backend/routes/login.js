const express = require("express");
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt'); // ✅ add bcrypt

// Login route
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Check User table (no password in query here)
    const [users] = await db.promise().query(
      'SELECT * FROM user WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length > 0) {
      const user = users[0];

      // ✅ Compare entered password with hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Store user in session
      req.session.user = {
        userID: user.userID,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      };

      return res.json({
        success: true,
        message: 'Login successful',
        user: req.session.user
      });
    }

    // If no matches
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
});

module.exports = router;
