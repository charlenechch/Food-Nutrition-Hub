const express = require("express");
const router = express.Router();

// Logout route
router.post("/", (req, res) => {
  if (req.session) {

    // Wrap session.destroy in a new Promise
    new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return reject(err); // Rejects the promise if destroy fails
        }
        // Resolve the promise ONLY when destroy is complete
        resolve();
      });
    })
    .then(() => {
      // Runs the session is fully destroyed
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
    })
    .catch((err) => {
      return res.status(500).json({ error: "Failed to logout" });
    });

  } else {
    // as no session is still a successful "logout"
    return res.json({
      success: true, 
      message: "No active session" 
    });
  }
});

module.exports = router