const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db");

// Login route
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Get user by email
    const [users] = await db.promise().query(
      "SELECT * FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 bcrypt.compare result:", isMatch); // debug log

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Store session
    req.session.user = {
      userID: user.userID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    };

    return res.json({
      success: true,
      message: "Login successful",
      user: req.session.user
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;
