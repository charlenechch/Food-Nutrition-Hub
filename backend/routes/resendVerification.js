const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

// Store last resend times in memory (key: email, value: timestamp)
// In production, use Redis or database for persistence across restarts
const resendTimestamps = new Map();

// Cooldown period: 120 seconds (2 minutes)
const COOLDOWN_MS = 120 * 1000;

router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      error: "Email is required" 
    });
  }

  try {
    // Check if user exists and is not verified
    const [users] = await db.query(
      "SELECT verified FROM user WHERE email = ? LIMIT 1", 
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    if (users[0].verified === 'True') {
      return res.status(400).json({ 
        success: false, 
        error: "Email is already verified" 
      });
    }

    // Check rate limiting
    const lastSent = resendTimestamps.get(email) || 0;
    const now = Date.now();
    const timeSinceLastSend = now - lastSent;

    if (timeSinceLastSend < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastSend) / 1000);
      return res.status(429).json({ 
        success: false, 
        error: "Please wait before requesting another email",
        remainingSeconds: remainingSeconds,
        cooldownSeconds: 120
      });
    }

    // Record this resend time
    resendTimestamps.set(email, now);

    // Clean up old entries (older than 5 minutes) to prevent memory leak
    for (const [storedEmail, timestamp] of resendTimestamps.entries()) {
      if (now - timestamp > 5 * 60 * 1000) {
        resendTimestamps.delete(storedEmail);
      }
    }

    console.log(`Verification email resend approved for: ${email}`);
    
    // Return success - Frontend will trigger Firebase resend
    return res.json({ 
      success: true, 
      message: "Ready to resend verification email",
      cooldownSeconds: 120
    });

  } catch (err) {
    console.error("Resend verification error:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to process resend request" 
    });
  }
});

// Optional: Endpoint to check remaining cooldown time
router.get("/cooldown/:email", (req, res) => {
  const { email } = req.params;
  const lastSent = resendTimestamps.get(email) || 0;
  const now = Date.now();
  const timeSinceLastSend = now - lastSent;

  if (timeSinceLastSend >= COOLDOWN_MS) {
    return res.json({ 
      canResend: true, 
      remainingSeconds: 0 
    });
  }

  const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastSend) / 1000);
  return res.json({ 
    canResend: false, 
    remainingSeconds: remainingSeconds 
  });
});

module.exports = router;