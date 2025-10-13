const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const db = require("../config/db");

// Store OTPs temporarily
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
router.post("/send", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000
    });

    // TODO: Send email with OTP
    // For now, just log it (you'll need to set up email service)
    console.log(`OTP for ${email}: ${otp}`);
    
    // In development, you can return the OTP (remove in production!)
    res.json({ 
      success: true, 
      message: "OTP sent",
      // Remove this in production!
      devOTP: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify", async (req, res) => {
  console.log("OTP VERIFY ROUTE HIT!");
  console.log("OTP VERIFY ROUTE HIT!");
  console.log("Request body:", req.body);
  console.log("Session:", req.session);
  console.log("OTP Store:", Array.from(otpStore.entries()))

  const { email, otp, rememberDevice } = req.body;

  if (!email || !otp) {
    console.log("Missing email or OTP");
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    const stored = otpStore.get(email);
    console.log("Stored OTP for", email, ":", stored);

    if (!stored) {
      console.log("OTP not found in store");
      return res.status(401).json({ error: "OTP not found or expired" });
    }

    if (Date.now() > stored.expires) {
      console.log("OTP expired");
      otpStore.delete(email);
      return res.status(401).json({ error: "OTP expired" });
    }

    if (stored.code !== otp) {
      console.log("Invalid OTP. Expected:", stored.code, "Got:", otp);
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // OTP is valid. Clears it
    console.log("OTP is valid!");
    otpStore.delete(email);

    // Get temp user from session (stored during login)
    const tempUser = req.session.tempUser;
    console.log("Temp user:", tempUser)

    if (!tempUser) {
      console.log("No temp user in session");
      return res.status(400).json({ error: "Session expired. Please login again." });
    }

    // Complete the login. Move tempUser to user
    req.session.user = tempUser;
    delete req.session.tempUser;
    
    // If "Remember Device" is checked, mark session as trusted
    if (rememberDevice) {
      req.session.trustedDevice = true;
      req.session.trustedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      console.log(`Device trusted for 7 days for ${email}`);
    } else {
      // Session expires when browser closes
      req.session.cookie.maxAge = null;
      console.log(`OTP verified for ${email} - session only`);
    }
    
    res.json({ 
      success: true, 
      message: "OTP verified successfully",
      trustedDevice: rememberDevice,
      user: req.session.user
    });

  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;