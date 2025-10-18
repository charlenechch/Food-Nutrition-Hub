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
      // Set longer session (7 days)
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      req.session.cookie.maxAge = sevenDays;
      req.session.cookie.expires = new Date(Date.now() + sevenDays);
      console.log("Account trusted for 7 days");
    } else {
      // Session expires when browser closes
      req.session.cookie.maxAge = null;
      req.session.cookie.expires = false;
      console.log("Session-only cookie set");
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
