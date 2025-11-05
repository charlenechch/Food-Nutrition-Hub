const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { pool: db } = require("../config/db");

// ✅ Validation & sanitization imports
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

// ✅ Joi schema for login
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

// ✅ Sanitize helper
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

router.post("/", async (req, res) => {
  console.log("🔹 Incoming login payload:", req.body); // ✅ helps confirm HPP behavior

  // ✅ Step 1: Validate input
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

  // ✅ Step 2: Sanitize fields
  const cleanData = Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)])
  );

  const { email, password, rememberDevice } = cleanData;
  console.log("🧼 Sanitized input:", cleanData);

  try {
    // ✅ Step 3: Query user
    // FIXED: changed from db.query → db.pool.query to match your db.js exports
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

    // ✅ Step 4: Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("❌ Incorrect password for:", email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Step 5: Email verification check
    if (user.verified === "False" || user.verified === 0) {
      console.warn("🚫 Unverified user blocked:", email);
      return res.status(403).json({
        success: false,
        notVerified: true,
        email: user.email,
        message: "Please verify your email first",
      });
    }

    // ✅ Step 6: Check account status
    if (user.status === "Suspended") {
      
      // Check if a suspension date exists in the database
      if (user.suspendedOn) {
        const today = new Date();
        const suspendedUntil = new Date(user.suspendedOn);

        // Compare date strings (e.g., "2025-11-07") to avoid timezone issues.
        // This checks if today is *on or before* the suspension date.
        const todayString = today.toISOString().slice(0, 10);
        const suspendedUntilString = suspendedUntil.toISOString().slice(0, 10);

        if (todayString <= suspendedUntilString) {
          // If today is 07-Nov and suspension is until 07-Nov, block login.
          console.warn(`🚫 Blocked login for ${email}. Suspension active until: ${suspendedUntilString}`);
          
          return res.status(403).json({
            success: false,
            message: `Your account is suspended until ${suspendedUntilString}. Please try again after this date.`,
          });
        }
        
        // If we are here, the suspension date has passed.
        // e.g., Today is 08-Nov, suspension ended on 07-Nov.
        console.log(`✅ Suspension has ended for user: ${email}. Allowing login.`);
        
      } else {
        // No suspension date was set, so treat it as an indefinite suspension.
        console.warn(`🚫 Blocked login for ${email} (indefinite suspension)`);
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended. Please contact support.",
        });
      }
    }
    
    // ✅ Step 7: Regenerate session (prevent fixation)
    console.log("🔐 Regenerating session...");
    req.session.regenerate(async (err) => {
      if (err) {
        console.error("❌ Session regeneration failed:", err);
        return res
          .status(500)
          .json({ success: false, message: "Session regeneration error" });
      }

      // ✅ Step 8: Remember Me logic
      if (rememberDevice) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        req.session.cookie.maxAge = sevenDays;
        req.session.cookie.expires = new Date(Date.now() + sevenDays);
        req.session.rememberMe = true;
        console.log("🕒 Remember Me active → 7-day session lifespan");
      } else {
        req.session.cookie.maxAge = null;
        req.session.cookie.expires = false;
        req.session.rememberMe = false;
        console.log("🕒 Standard session (browser-close expiry)");
      }

      // ✅ Step 9: Attach user to session
      req.session.user = {
        userID: user.userID,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      };

      // ✅ Step 10: Save session
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("❌ Session save error:", err);
            reject(err);
          } else resolve();
        });
      });

      // Update lastLogin timestamp
      try {
        await db.query("UPDATE user SET lastLogin = ? WHERE userID = ?", [new Date(), user.userID]);
        console.log(`✅ Updated lastLogin for user: ${user.email}`);
      } catch (updateError) {
        console.error("❌ Failed to update lastLogin:", updateError);
        // Don't stop the login, just log the error
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
    // ✅ Step 10: Catch-all for backend or DB errors
    console.error("💥 Login error:", err);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;
