const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db"); // promise pool

// ✅ POST /api/login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  // 🔒 Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // 🔎 Fetch user from DB
    const [users] = await db.query(
      "SELECT * FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      console.warn(`⚠️ Login failed: No user found for email ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // 🔑 Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`⚠️ Login failed: Wrong password for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 📝 Store user in session
    req.session.user = {
      id: user.userID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || "member",
    };

    console.log(`✅ Login successful: ${user.email} (${req.session.user.role})`);

    return res.json({
      success: true,
      message: "Login successful",
      user: req.session.user,
    });

  } catch (err) {
    console.error("❌ Login error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Authentication error. Please try again later.",
    });
  }
});

module.exports = router;
