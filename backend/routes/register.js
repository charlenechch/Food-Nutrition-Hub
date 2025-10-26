const express = require("express");
const bcrypt = require("bcrypt");
// const sendEmail = require("../config/mailer");
// const { getVerificationEmailHTML, getVerificationEmailSubject } = require("../utils/emailTemplates");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const db = require("../config/db"); // shared promise pool

const saltRounds = 10;

// Store OTPs temporarily
// const otpStore = new Map();

// Generate 6-digit OTP
// function generateOTP() {
  // return Math.floor(100000 + Math.random() * 900000).toString();
// }

// Password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) return `Password must be at least ${minLength} characters long`;
  if (!hasUpperCase) return "Password must contain at least one uppercase letter";
  if (!hasLowerCase) return "Password must contain at least one lowercase letter";
  if (!hasNumber) return "Password must contain at least one number";
  if (!hasSpecialChar) return "Password must contain at least one special character";
  return null;
};

// POST /api/register
router.post("/", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Email check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Password check
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query("SELECT 1 FROM user WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO user (firstname, lastname, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [firstname, lastname, email, hashedPassword, "member"]
    );

    console.log(`User registered: ${email} (ID: ${result.insertId})`);
    const userID = result.insertId;

    // ✅ NEW: Automatically create userProfile record
    try {
      await db.execute(
        `INSERT INTO userProfile 
         (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language, recipes, posts, likes) 
         VALUES (?, '[]', '[]', true, true, true, 'en', 0, 0, 0)`,
        [userID]
      );
      console.log(`✅ UserProfile automatically created for userID: ${userID}`);
    } catch (profileError) {
      console.error('❌ Failed to create userProfile:', profileError);
      // Don't fail the registration if profile creation fails
      // The ensureUserProfileExists in userProfile.js will handle it later
    }

    // Generate OTP
    // const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    // otpStore.set(email, {
      // code: otp,
      // expires: Date.now() + 5 * 60 * 1000,
      // attempts: 0
    // });

    // console.log(`OTP generated for ${email}: ${otp}`);

    // Send verification email
    // const emailSubject = getVerificationEmailSubject(false); // false = not a resend
    // const emailHtml = getVerificationEmailHTML({
      // otp: otp,
      // firstName: firstname,
      // isResend: false
    // });

    // try {
      // const emailResult = await sendEmail({
        // to: email,
        // subject: emailSubject,
        // html: emailHtml,
      // });

      // Log email status but don't block registration
      // if (emailResult && emailResult.success) {
        // console.log("Verification email sent");
      // } else {
        // console.error("Email failed to send, but user can resend from OTP page");
      // }
    // } catch (emailError) {
      // console.error("Email error (non-blocking):", emailError.message);
    // }

    // Return success, Firebase will handle email
    return res.json({
      success: true,
      message: "Registration successful. Please verify your email.",
      email: email,
      userId: result.insertId // Include this for Firebase linkage
    });

  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
// module.exports.otpStore = otpStore;
