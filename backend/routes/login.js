const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db"); // promise pool

// ✅ POST /api/login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    console.log("📥 Login request body:", req.body);

    const [users] = await db.query(
      "SELECT * FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      console.warn(`⚠️ Login failed: No user found for email ${email}`);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn(`⚠️ Login failed: Wrong password for ${email}`);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Save session
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
