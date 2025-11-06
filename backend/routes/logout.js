const express = require("express");
const router = express.Router();

// Logout route
router.post("/", (req, res) => {
  if (req.session) {

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      
      // Clear session cookie
      res.clearCookie('sid', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      }); 

      console.log("Logout successful: Session has been destroyed.");
      
      return res.json({ 
        success: true, 
        message: "Logged out successfully" 
      });
    });
  } else {
    return res.status(400).json({ error: "No active session" });
  }
});

module.exports = router;