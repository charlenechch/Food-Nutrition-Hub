const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db"); // shared promise pool

router.post("/", async (req, res) => {
  const { email, password, rememberDevice } = req.body;

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

    // Verify password first
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check if email is verified
    if (user.verified === 'False') {
      console.log("Login blocked for unverified user");
      return res.status(403).json({ 
        success: false, 
        notVerified: true,  // Special flag for frontend
        email: user.email,
        message: "Please verify your email first"
      });
    }

    // If user is verified, proceed with login
    console.log("Password verified, proceeding with login");

    // Check if "Remember account" was checked
    if (rememberDevice) {
      const twoMinutes = 2 * 60 * 1000;
      req.session.cookie.maxAge = twoMinutes;
      req.session.cookie.expires = new Date(Date.now() + twoMinutes);
      req.session.rememberMe = true;
      req.session.loginTime = Date.now();
      console.log("Account trusted for 2 minutes");
    } else {
      // TEST: 30 seconds idle timeout (instead of null)
      const thirtySeconds = 30 * 1000; // ⏱️ TEST ONLY
      req.session.cookie.maxAge = thirtySeconds;
      req.session.cookie.expires = new Date(Date.now() + thirtySeconds);
      req.session.rememberMe = false;
      req.session.loginTime = Date.now();
      console.log("TEST MODE: 30-second idle timeout");
    }

    // Complete login, set user in session
    req.session.user = {
      userID: user.userID,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role
    };

    // Force session save
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

    console.log("Login successful!");

    return res.json({
      success: true,
      message: "Login successful!",
      user: req.session.user
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;
