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
    // Fetch user
    const [users] = await db.query("SELECT * FROM user WHERE email = ? LIMIT 1", [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check if device is trusted (remembered)
    if (req.session.trustedDevice && req.session.trustedUntil > Date.now()) {
      console.log("Trusted device detected, skipping OTP.");
      
      // Complete login immediately
      req.session.user = {
        userID: user.userID,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      };

      return res.json({
        success: true,
        message: "Login successful",
        skipOTP: true,
        user: req.session.user
      });
    }

    // Device not trusted, store user temporarily and require OTP
    console.log("Password verified, OTP required.");

    req.session.tempUser = {
      userID: user.userID,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role
    };

    // Force immediate session save
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.json({
      success: true,
      message: "Password verified. OTP required.",
      requiresOTP: true
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;
