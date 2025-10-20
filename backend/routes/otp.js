/* const express = require("express");
const router = express.Router();
const sendEmail = require("../config/mailer");
const { getVerificationEmailHTML, getVerificationEmailSubject } = require("../utils/emailTemplates");
const db = require("../config/db");

// Store OTPs temporarily
const { otpStore } = require("./register");

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/send", async (req, res) => {
  const { email } = req.body;

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
      // Increment attempts
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
    await db.query(
      "UPDATE user SET verified = 'True' WHERE email = ?",
      [email]
    );

    console.log(`Email verified successfully`);
    
    // Return response
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

module.exports = router;
*/