const express = require("express");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/mailer");
const { getVerificationEmailHTML, getVerificationEmailSubject } = require("../utils/emailTemplates");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const { pool: db } = require("../config/db"); // shared promise pool

// ✅ NEW IMPORTS for validation and sanitization
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

const saltRounds = 10;

// Store OTPs temporarily
// const otpStore = new Map();

// Generate 6-digit OTP
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
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

// ✅ NEW: Joi schema definition for strict backend validation
const registerSchema = Joi.object({
  firstname: Joi.string().max(50).required(),
  lastname: Joi.string().max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(64)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[^a-zA-Z0-9]/, "special character")
    .required()
    .messages({
      "string.pattern.name": "Password must include at least one {#name}",
    }),
  firebaseUID: Joi.string().allow(null, ""),

  pdpaconsent: Joi.boolean().valid(true).required().messages({
    "any.only": "You must agree to the PDPA Privacy Policy to register."
  }),
  tncconsent: Joi.boolean().valid(true).required().messages({
    "any.only": "You must agree to the Terms & Conditions to register."
  }),
});

// ✅ NEW: universal sanitize helper (safe HTML + trim)
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

// POST /api/register
router.post("/", async (req, res) => {
  // ✅ Step 1: Joi validation
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message).join(", ") });
  }

  // ✅ Step 2: sanitize all string fields
  const cleanData = Object.fromEntries(
    Object.entries(value).map(([key, val]) => [key, sanitizeInput(val)])
  );
  // AFTER
  const { firstname, lastname, email, password, firebaseUID, pdpaconsent, tncconsent } = cleanData;

  // ✅ Step 3: original required field checks remain for redundancy
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Email check (still preserved)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Password check (kept intact)
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query("SELECT 1 FROM user WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      console.log(`Backend: Email already exists in MySQL database: ${email}`);
      return res.status(400).json({
        error:
          "This email is already registered. Please use a different email or try logging in.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO user (firstname, lastname, email, password, role, firebase_uid, pdpa_consent, tnc_consent, consent_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [firstname, lastname, email, hashedPassword, "member", firebaseUID || null, pdpaconsent ? 1 : 0, tncconsent ? 1 : 0]
    );

    console.log(`User registered: ${email} (ID: ${result.insertId})`);
    const userID = result.insertId;

    // ✅ NEW: Automatically create userProfile record (preserved)
    try {
      await db.execute(
        `INSERT INTO userProfile 
         (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language, recipes, posts, likes) 
         VALUES (?, '[]', '[]', true, true, true, 'en', 0, 0, 0)`,
        [userID]
      );
      console.log(`✅ UserProfile automatically created for userID: ${userID}`);
    } catch (profileError) {
      console.error("❌ Failed to create userProfile:", profileError);
      // Don't fail the registration if profile creation fails
      // The ensureUserProfileExists in userProfile.js will handle it later
    }

    // Generate OTP
    // const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    // otpStore.set(email, {
    //   code: otp,
    //   expires: Date.now() + 5 * 60 * 1000,
    //   attempts: 0
    // });

    // console.log(`OTP generated for ${email}: ${otp}`);

    // Send verification email
    // const emailSubject = getVerificationEmailSubject(false); // false = not a resend
    // const emailHtml = getVerificationEmailHTML({
    //   otp: otp,
    //   firstName: firstname,
    //   isResend: false
    // });

    // try {
    //   const emailResult = await sendEmail({
    //     to: email,
    //     subject: emailSubject,
    //     html: emailHtml,
    //   });

    //   // Log email status but don't block registration
    //   if (emailResult && emailResult.success) {
    //     console.log("Verification email sent");
    //   } else {
    //     console.error("Email failed to send, but user can resend from OTP page");
    //   }
    // } catch (emailError) {
    //   console.error("Email error (non-blocking):", emailError.message);
    // }

    // Return success, Firebase will handle email
    return res.json({
      success: true,
      message: "Registration successful. Please verify your email.",
      email: email,
      userId: result.insertId, // Include this for Firebase linkage
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
// module.exports.otpStore = otpStore;
