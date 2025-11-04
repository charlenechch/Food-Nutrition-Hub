const express = require("express");
const router = express.Router();
const sendEmail = require("../config/mailer");
const { getVerificationEmailHTML, getVerificationEmailSubject } = require("../utils/emailTemplates");
const { pool: db } = require("../config/db");

// Store OTPs temporarily
const { otpStore } = require("./register");

// ✅ NEW: Validation and sanitization setup (added globally)
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

const sendOTPSchema = Joi.object({ email: Joi.string().email().required() });
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send registration OTP
router.post("/send", async (req, res) => {
  const { email } = req.body;

  // ✅ Validate and sanitize
  const { error, value } = sendOTPSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
  const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
  Object.assign(req.body, cleanData);

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    // Check if user exists and is not verified
    const [users] = await db.query(
      "SELECT verified FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (users[0].verified === 'True') {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration and attempts
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    console.log(`OTP resent: ${otp}`);

    // Use shared email template
    const emailSubject = getVerificationEmailSubject(true); // true = resend
    const emailHtml = getVerificationEmailHTML({
      otp: otp,
      firstName: '',
      isResend: true
    });

    // Send the email
    const emailResult = await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });

    // Response handling
    if (emailResult.success) {
      console.log("Email sent");
      return res.json({
        success: true,
        message: "OTP sent to your email",
        devOTP: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    console.error("Failed to send email", emailResult.error);

    return res.status(500).json({
      error: "Failed to send verification email. Please try again.",
      canRetry: true,
      devOTP: process.env.NODE_ENV !== 'production' ? otp : undefined
    });

  } catch (err) {
    console.error("OTP send error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP for email verification after registration
router.post("/verify", async (req, res) => {
  const { email, otp } = req.body;

  // ✅ Validate and sanitize
  const { error, value } = verifyOTPSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
  const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
  Object.assign(req.body, cleanData);

  if (!email || !otp) {
    console.log("Missing email or OTP");
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    const stored = otpStore.get(email);

    // Check if OTP exists
    if (!stored) {
      console.log("No OTP found");
      return res.status(401).json({ error: "OTP not found or expired" });
    }

    // Check if OTP expired
    if (Date.now() > stored.expires) {
      console.log("OTP expired");
      otpStore.delete(email);
      return res.status(401).json({ error: "OTP expired. Please request a new code." });
    }

    // Check attempts to prevent brute force
    if (stored.attempts >= 5) {
      console.log("Too many attempts");
      otpStore.delete(email);
      return res.status(429).json({ error: "Too many attempts. Please request a new code." });
    }

    // Verify OTP
    if (stored.code !== otp) {
      stored.attempts += 1;
      otpStore.set(email, stored);
      console.log(`Invalid OTP (attempt ${stored.attempts}/5)`);
      return res.status(401).json({
        error: "Invalid OTP",
        attemptsRemaining: 5 - stored.attempts
      });
    }

    // OTP is valid, clear it from memory
    console.log(`OTP verified!`);
    otpStore.delete(email);

    // Update user's verified status in database
    await db.query("UPDATE user SET verified = 'True' WHERE email = ?", [email]);

    console.log(`Email verified successfully`);

    return res.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
      redirectTo: "/loginregister"
    });

  } catch (err) {
    console.error("OTP verify error:", err);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

// Send login OTP
router.post("/sendLogin", async (req, res) => {
  const { email } = req.body;

  // ✅ Validate and sanitize
  const { error, value } = sendOTPSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
  const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
  Object.assign(req.body, cleanData);

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    // Check if user exists and is verified
    const [users] = await db.query(
      "SELECT verified FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (users[0].verified !== 'True') {
      return res.status(400).json({ error: "Please verify your email first." });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration
    otpStore.set(`login_${email}`, {
      code: otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    console.log(`Login OTP sent: ${otp}`);

    // Create email content
    const emailSubject = "Your Login Verification Code";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Food-Nutrition Knowledge Hub</h2>
        <p>Hello,</p>
        <p>Your login verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    // Send the email
    const emailResult = await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResult.success) {
      return res.json({
        success: true,
        message: "Login code sent to your email",
        devOTP: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    return res.status(500).json({
      error: "Failed to send verification email",
      devOTP: process.env.NODE_ENV !== 'production' ? otp : undefined
    });

  } catch (err) {
    console.error("Login OTP send error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});


// Verify login OTP
router.post("/verifyLogin", async (req, res) => {
  const { email, otp } = req.body;

  // ✅ Validate and sanitize
  const { error, value } = verifyOTPSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
  const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
  Object.assign(req.body, cleanData);

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    const stored = otpStore.get(`login_${email}`);

    if (!stored) {
      return res.status(401).json({ error: "OTP not found or expired" });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(`login_${email}`);
      return res.status(401).json({ error: "OTP expired. Please request a new code." });
    }

    if (stored.attempts >= 5) {
      otpStore.delete(`login_${email}`);
      return res.status(429).json({ error: "Too many attempts. Please request a new code." });
    }

    if (stored.code !== otp) {
      stored.attempts += 1;
      otpStore.set(`login_${email}`, stored);
      return res.status(401).json({
        error: "Invalid OTP",
        attemptsRemaining: 5 - stored.attempts
      });
    }

    // OTP is valid
    otpStore.delete(`login_${email}`);

    // Get user info for login
    const [users] = await db.query(
      "SELECT user_id, email, first_name, last_name, role FROM user WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Create session
    req.session.user = {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    };

    return res.json({
      success: true,
      message: "Login successful",
      user: req.session.user
    });

  } catch (err) {
    console.error("Login OTP verify error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;
