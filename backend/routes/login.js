const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { pool: db } = require("../config/db");
const crypto = require("crypto");
const { sendEmail } = require("../config/mailer");

// Validation & sanitization imports
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

// Joi schema for login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().min(8).max(64).required().messages({
    "string.min": "Password must be at least 8 characters.",
    "any.required": "Password is required.",
  }),
  rememberDevice: Joi.boolean().optional().default(false),
});

// Sanitize helper
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

router.post("/", async (req, res) => {

  // Validate input
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    console.warn("❌ Joi validation failed:", error.details.map(d => d.message));
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(", "),
    });
  }

  // Sanitize fields
  const cleanData = Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)])
  );

  const { email, password, rememberDevice } = cleanData;

  // ✔ SAFER LOG — password hidden
  const safeLog = { ...cleanData, password: "••••••••" };
  console.log("🧼 Sanitized input:", safeLog);

  try {
    // Query user
    const [users] = await db.query(
      "SELECT * FROM user WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      console.warn("❌ No user found for email:", email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];

    // ---------------------------------------------------------
    // 🔒 SECURITY LOCKOUT CHECK (New Logic)
    // ---------------------------------------------------------
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
        const remainingMs = new Date(user.lockout_until) - new Date();
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        
        console.warn(`⛔ Locked out user ${email} attempted login. Remaining: ${remainingSeconds}s`);

        return res.status(429).json({ 
            success: false, 
            message: "Account is temporarily locked due to too many failed attempts.", 
            lockoutRemaining: remainingSeconds 
        });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    // ---------------------------------------------------------
    // ❌ HANDLE FAILED PASSWORD & INCREMENT LOCKOUT (New Logic)
    // ---------------------------------------------------------
    if (!isMatch) {
      console.warn("❌ Incorrect password for:", email);

      let newAttempts = (user.failed_attempts || 0) + 1;
      let newLockoutTime = null;
      let lockDurationMinutes = 0;

      // Lockout Rules
      // 5 attempts -> 2 mins
      // 6 attempts -> 5 mins
      // 7+ attempts -> 10 mins
      if (newAttempts === 5) lockDurationMinutes = 2;
      else if (newAttempts === 6) lockDurationMinutes = 5;
      else if (newAttempts >= 7) lockDurationMinutes = 10;

      if (lockDurationMinutes > 0) {
           const lockDate = new Date();
           lockDate.setMinutes(lockDate.getMinutes() + lockDurationMinutes);
           newLockoutTime = lockDate;
      }

      // Update the user record with new attempt count and potential lockout time
      await db.query(
          "UPDATE user SET failed_attempts = ?, lockout_until = ? WHERE userID = ?", 
          [newAttempts, newLockoutTime, user.userID]
      );

      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // ---------------------------------------------------------
    // ✅ SUCCESS: RESET LOCKOUT COUNTERS (New Logic)
    // ---------------------------------------------------------
    if (user.failed_attempts > 0 || user.lockout_until !== null) {
        await db.query(
            "UPDATE user SET failed_attempts = 0, lockout_until = NULL WHERE userID = ?", 
            [user.userID]
        );
    }

    // Email verification check
    if (user.verified === "False" || user.verified === 0) {
      console.warn("🚫 Unverified user blocked:", email);
      return res.status(403).json({
        success: false,
        notVerified: true,
        email: user.email,
        message: "Please verify your email first",
      });
    }

    // Check for active suspension (Admin/Manual Ban)
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
        
        const suspendedUntilDate = new Date(user.suspendedUntil);
        suspendedUntilDate.setHours(23, 59, 59, 999); // Set to end of day
        const untilString = suspendedUntilDate.toISOString().slice(0, 10);

        console.warn(`🚫 Blocked login for Suspended user: ${email}. Active until: ${untilString}`);
        
        return res.status(403).json({
            success: false,
            message: `Your account is suspended until ${untilString}. Please try again after this date.`,
        });
    }

    // Check account status for INACTIVE users
    if (user.status === "Inactive") {
      console.log(`✅ Inactive user ${email} is logging in. Auto-activating...`);
      
      try {
        // Update database: set status = "Active"
        await db.query(
            "UPDATE user SET status = 'Active' WHERE userID = ?",
            [user.userID]
        );
        // Update local object used for session data
        user.status = "Active"; 
        console.log(`✅ Status updated to Active for user: ${user.email}`);

      } catch (updateError) {
        console.error("❌ Failed to auto-activate INACTIVE user:", updateError);
        // Log the error but continue login
      }
    }

    // Set to false to disable 2FA globally
    const requires2FA = true;

    if (requires2FA) {
        // Check for existing recent OTP (Throttling)
        const [existingOtps] = await db.query(
            'SELECT created_at FROM otp WHERE userID = ? ORDER BY created_at DESC LIMIT 1',
            [user.userID]
        );

        if (existingOtps.length > 0) {
            const lastOtpTime = new Date(existingOtps[0].created_at).getTime();
            const now = Date.now();
            const timeDiff = (now - lastOtpTime) / 1000; // seconds

            // If an OTP was sent less than 60 seconds ago, STOP.
            if (timeDiff < 60) {
                console.warn(`⏳ OTP request throttled for ${email}`);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${Math.ceil(60 - timeDiff)} seconds before requesting a new code.`
                });
            }
        }

        // Generate 6-digit code
        const otpCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save to DB (Clear old codes first)
        await db.query('DELETE FROM otp WHERE userID = ?', [user.userID]);
        
        await db.query(
            'INSERT INTO otp (userID, code, expires_at) VALUES (?, ?, ?)',
            [user.userID, otpCode, expiresAt]
        );

        console.log(`🔐 2FA Triggered for ${email}.`);

        // Send Email
        const otpHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Login Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #8B4513;">${otpCode}</h1>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `;

        // Note: wrapped in try-catch so email failure doesn't crash server
        try {
            await sendEmail({
                to: user.email,
                subject: "Your Login Verification Code",
                html: otpHTML,
                text: `Your code is ${otpCode}`
            });
        } catch (emailErr) {
            console.error("❌ Failed to send OTP email:", emailErr);
            return res.status(500).json({ success: false, message: "Failed to send verification email." });
        }

        return res.json({
            success: true,
            requires2FA: true,
            tempUserId: user.userID, 
            rememberDevice: rememberDevice,
            message: "Verification code sent to email"
        });
    }
    
    // Regenerate session (prevent fixation)
    console.log("🔐 Regenerating session...");
    req.session.regenerate(async (err) => {
      if (err) {
        console.error("❌ Session regeneration failed:", err);
        return res
          .status(500)
          .json({ success: false, message: "Session regeneration error" });
      }

      // Remember Me logic
      if (rememberDevice) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        req.session.cookie.maxAge = sevenDays;
        req.session.cookie.expires = new Date(Date.now() + sevenDays);
        req.session.rememberMe = true;
        console.log("🕒 Remember Me active → 7 Days session lifespan");
      } else {
        req.session.cookie.maxAge = null;
        req.session.cookie.expires = false;
        req.session.rememberMe = false;
        console.log("🕒 Standard session (browser-close expiry)");
      }

      req.session.user = {
        userID: user.userID,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      };

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("❌ Session save error:", err);
            reject(err);
          } else resolve();
        });
      });

      try {
        await db.query("UPDATE user SET lastLogin = ? WHERE userID = ?", [new Date(), user.userID]);
        console.log(`✅ Updated lastLogin for user: ${user.email}`);
      } catch (updateError) {
        console.error("❌ Failed to update lastLogin:", updateError);
      }

      console.log("✅ Login success for:", email);
      console.log("🧾 Session ID:", req.sessionID);

      return res.json({
        success: true,
        message: "Login successful!",
        user: req.session.user,
      });
    });
  } catch (err) {
    console.error("💥 Login error:", err);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;