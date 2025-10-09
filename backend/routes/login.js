const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db"); // shared promise pool

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    // ✅ Fetch user
    const [users] = await db.query("SELECT * FROM user WHERE email = ? LIMIT 1", [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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

    console.log(`✅ Login success: ${user.email}`);

    res.json({
      success: true,
      message: "Login successful",
      user: req.session.user,
    });

  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;
