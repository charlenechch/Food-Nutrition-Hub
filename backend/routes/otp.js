const express = require("express");
const router = express.Router();
const { getVerificationEmailHTML, getVerificationEmailSubject } = require("../utils/emailTemplates");
const { pool: db } = require("../config/db");
const { sendEmail } = require("../config/mailer");

// Store OTPs temporarily
const { otpStore } = require("./register");

// Validation and sanitization setup (added globally)
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

const sendLoginSchema = Joi.object({
  userID: Joi.number().integer().required()
});

const verifyLoginSchema = Joi.object({
  userID: Joi.number().integer().required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  rememberDevice: Joi.boolean().optional()
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Resend Login OTP
router.post("/sendLogin", async (req, res) => {
  const { error, value } = sendLoginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
  
  const { userID } = value; 

  // Validate Input
  if (!userID) {
    return res.status(400).json({ error: "User ID required" });
  }

  try {
    // Fetch user email from Database
    const [users] = await db.execute("SELECT email, verified FROM user WHERE userID = ?", [userID]);
    
    if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    
    const user = users[0];

    // Check verification status
    if (user.verified !== 'True' && user.verified !== 1) {
      return res.status(400).json({ error: "Please verify your email first." });
    }

    // Generate 6-digit OTP
    const crypto = require("crypto"); 
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB (Clear old codes first to prevent duplicates)
    await db.execute('DELETE FROM otp WHERE userID = ?', [userID]);
    
    await db.execute(
        'INSERT INTO otp (userID, code, expires_at) VALUES (?, ?, ?)',
        [userID, otpCode, expiresAt]
    );

    console.log(`🔄 OTP resent for ${user.email}`);

    // Send Email
    const otpHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Login Verification</h2>
        <p>Here is your new verification code:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #8B4513;">${otpCode}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
        to: user.email,
        subject: "Your Login Verification Code",
        html: otpHTML,
        text: `Your new code is ${otpCode}`
    });

    return res.json({ 
        success: true, 
        message: "New code sent to your email" 
    });

  } catch (err) {
    console.error("OTP Resend Error:", err);
    return res.status(500).json({ error: "Failed to resend OTP" });
  }
});

// Verify Login OTP
router.post("/verifyLogin", async (req, res) => {
  // Frontend sends 'userID' and 'code' (Step 2 of login)
  const { error, value } = verifyLoginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });

  const { userID, code, rememberDevice } = value;

  if (!userID || !code) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  try {
    // Check DB for valid code (Using table 'otp')
    const [rows] = await db.execute(
        `SELECT * FROM otp 
         WHERE userID = ? AND code = ? AND expires_at > NOW()`,
        [userID, code]
    );

    if (rows.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }

    // If code is valid, clean up used OTP
    await db.execute('DELETE FROM otp WHERE userID = ?', [userID]);

    // Fetch user details to create session
    const [users] = await db.execute('SELECT * FROM user WHERE userID = ?', [userID]);
    
    if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    
    const user = users[0];

    // --- CRITICAL FIX START: REGENERATE SESSION ---
    // This creates a brand new session ID and ensures a fresh database write.
    req.session.regenerate(async (regenErr) => {
        if (regenErr) {
            console.error("❌ Session regeneration failed:", regenErr);
            return res.status(500).json({ error: "Login failed (Session Error)" });
        }

        // Now inside the new session, set the user data
        req.session.user = {
            userID: user.userID,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            pdpa_consent: user.pdpa_consent,
            tnc_consent: user.tnc_consent,
            agreed_version: user.agreed_version ?? 0,
        };

        // Apply Remember Me Logic
        if (rememberDevice) {
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            req.session.cookie.maxAge = sevenDays;
            req.session.cookie.expires = new Date(Date.now() + sevenDays);
            req.session.rememberMe = true;
            console.log("🕒 OTP Login: Remember Me active → 7 Days");
        } else {
            req.session.cookie.maxAge = null;
            req.session.cookie.expires = false;
            req.session.rememberMe = false;
        }

        // Update Last Login in DB
        await db.query("UPDATE user SET lastLogin = ? WHERE userID = ?", [new Date(), user.userID]);

        console.log(`✅ 2FA Verification successful for user: ${user.email}`);

        // --- FORCE SAVE ---
        // Ensure the new session is written to DB before replying to the user
        req.session.save((saveErr) => {
            if (saveErr) {
                console.error("❌ Session save error in OTP:", saveErr);
                return res.status(500).json({ error: "Session save failed" });
            }
            
            // Only send response after everything is secure and saved
            return res.json({
                success: true,
                message: "Login successful",
                user: req.session.user
            });
        });
    });
    // --- CRITICAL FIX END ---

  } catch (err) {
    console.error("Login OTP verify error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;