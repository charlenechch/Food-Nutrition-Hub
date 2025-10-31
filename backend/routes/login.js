const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db"); // shared promise pool

// ✅ NEW: Validation + sanitization imports
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

// ✅ NEW: Joi schema for login input
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().min(8).max(64).required().messages({
    "string.min": "Password must be at least 8 characters.",
    "any.required": "Password is required.",
  }),
  rememberDevice: Joi.boolean().optional(),
});

// ✅ NEW: sanitize helper (safe HTML + trim)
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

router.post("/", async (req, res) => {
  // ✅ Step 1: Validate with Joi
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }

  // ✅ Step 2: Sanitize fields
  const cleanData = Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)])
  );

  const { email, password, rememberDevice } = cleanData;

  // ✅ Step 3: Retain your original logic & comments
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
      const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days
      req.session.cookie.maxAge = sevenDays;
      req.session.cookie.expires = new Date(Date.now() + sevenDays);
      req.session.rememberMe = true;
      req.session.loginTime = Date.now();
      console.log("Session 'Remember Me' set. Expires in 7 days.");
    } else {
      req.session.cookie.maxAge = null;
      req.session.cookie.expires = false;
      req.session.rememberMe = false;
      req.session.loginTime = Date.now();
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
