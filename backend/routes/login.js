const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db"); // this is the pool now

// ✅ POST /api/login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  // ✅ Input validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    // ✅ Query DB for user
    const [users] = await db.promise().query(
      "SELECT * FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];

    // ✅ Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 bcrypt.compare result:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Save user into session
    req.session.user = {
      id: user.userID,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || "member",
    };

    console.log(`✅ User logged in: ${user.email} (${req.session.user.role})`);

    return res.json({
      success: true,
      message: "Login successful",
      user: req.session.user,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;
