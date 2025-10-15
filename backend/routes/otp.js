const express = require("express");
const router = express.Router();
const sendEmail = require("../config/mailer");
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
    
    // Create the content for your email
    const emailSubject = "Your SarawakEats Verification Code";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 36px; letter-spacing: 8px; margin: 20px; font-weight: bold;">
          ${otp}
        </p>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `;

    // 3. Send the email!
    await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });

    res.json({ 
      success: true, 
      message: "OTP sent to your email",
      devOTP: process.env.NODE_ENV !== 'production' ? otp : undefined
    });

  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify", async (req, res) => {
  const { email, otp, rememberDevice } = req.body;

  if (!email || !otp) {
    console.log("Missing email or OTP");
    return res.status(400).json({ error: "Email and OTP required" });
  }

  try {
    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(401).json({ error: "OTP not found or expired" });
    }

    if (Date.now() > stored.expires) {
      console.log("OTP expired");
      otpStore.delete(email);
      return res.status(401).json({ error: "OTP expired" });
    }

    if (stored.code !== otp) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // OTP is valid. Clears it
    console.log("OTP is valid!");
    otpStore.delete(email);

    // Get temp user from session (stored during login)
    const tempUser = req.session.tempUser;

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
      console.log("Device trusted for 7 days");
    } else {
      // Session expires when browser closes
      req.session.cookie.maxAge = null;
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