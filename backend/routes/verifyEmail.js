const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

// Called by frontend after Firebase verifies email
router.post("/sync", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    // Update MySQL verified status
    const [result] = await db.query(
      "UPDATE user SET verified = 'True' WHERE email = ?",
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`Email verified and synced for: ${email}`);
    
    return res.json({ 
      success: true, 
      message: "Email verification synced successfully" 
    });

  } catch (err) {
    console.error("Verification sync error:", err);
    return res.status(500).json({ error: "Failed to sync verification status" });
  }
});

module.exports = router;