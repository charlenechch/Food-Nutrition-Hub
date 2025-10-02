const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Register route
router.post('/', async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;

  // Input validation
  if (!firstname || !lastname || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if username or email already exists
    const [existing] = await db.promise().query(
      'SELECT * FROM user WHERE email = ? LIMIT 1',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Insert into user table
    const sql = `
      INSERT INTO user (firstname, lastname, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [firstname, lastname, email, password, role];

    const [result] = await db.promise().query(sql, values);

    return res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.insertId,
        firstname,
        lastname,
        email,
        role
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
