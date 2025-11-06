const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { pool: db } = require("../config/db");

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
  console.log("🔹 Incoming login payload:", req.body); // ✅ helps confirm HPP behavior

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
  console.log("🧼 Sanitized input:", cleanData);

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

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("❌ Incorrect password for:", email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
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

    // Check account status
    if (user.status === "Suspended") {
        
        // Check if a suspension date exists in the database
        if (user.suspendedUntil) { 
            
            const suspendedUntilDate = new Date(user.suspendedUntil);
            
            // Set the suspension date to the end of the day (23:59:59) for accurate comparison
            suspendedUntilDate.setHours(23, 59, 59, 999); 
            
            const now = new Date();

            // 1. Check if the suspension period has EXPIRED
            if (now <= suspendedUntilDate) {
                // 🚫 Suspension is still active: Block login and show the date
                const untilString = suspendedUntilDate.toISOString().slice(0, 10);
                console.warn(`🚫 Blocked login for Suspended user: ${email}. Active until: ${untilString}`);
                
                return res.status(403).json({
                    success: false,
                    message: `Your account is suspended until ${untilString}. Please try again after this date.`,
                });
            }
            
            // 2. Suspension has expired, but the database status is not updated yet.
            // We allow login (and the background cleanup will set status to Active/Inactive later).
            console.log(`✅ Suspension has expired for user: ${email}. Allowing login.`);
            
        } else {
            // No suspension date was set (permanent/indefinite suspension).
            console.warn(`🚫 Blocked login for ${email} (indefinite suspension)`);
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended. Please contact support.",
            });
        }
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
        console.log("🕒 Remember Me active → 7-day session lifespan");
      } else {
        req.session.cookie.maxAge = null;
        req.session.cookie.expires = false;
        req.session.rememberMe = false;
        console.log("🕒 Standard session (browser-close expiry)");
      }

      // Attach user to session
      req.session.user = {
        userID: user.userID,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      };

      // Save session
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
    // Catch-all for backend or DB errors
    console.error("💥 Login error:", err);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
});

module.exports = router;
