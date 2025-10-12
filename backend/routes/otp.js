const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer"); // You'll need to install this

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
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(401).json({ error: "OTP not found or expired" });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(401).json({ error: "OTP expired" });
    }

    if (stored.code !== otp) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // OTP is valid
    otpStore.delete(email);
    
    res.json({ 
      success: true, 
      message: "OTP verified successfully" 
    });

  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;