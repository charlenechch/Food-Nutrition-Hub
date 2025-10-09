const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db");

// Login route
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Get user
    const [users] = await db.promise().query(
      "SELECT * FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      console.warn(`❌ Login failed: No user found for ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn(`❌ Login failed: Wrong password for ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Save session
    req.session.user = {
      userID: user.userID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    };

    console.log(`✅ Login successful for ${email}`);

    return res.json({
      success: true,
      message: "Login successful",
      user: req.session.user,
    });
  } catch (err) {
    console.error("❌ Login route error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
