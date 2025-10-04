const express = require("express");
const router = express.Router();
const db = require('../config/db');

// Login route
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Check User table
    const [users] = await db.promise().query(
      'SELECT * FROM user WHERE email = ? AND password = ? LIMIT 1',
      [email, password]
    );

    if (users.length > 0) {
      const user = users[0];

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
