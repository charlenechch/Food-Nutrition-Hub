const express = require('express');
const router = express.Router();

// ✅ Session check
// router.get('/session', (req, res) => {
//   if (req.session && req.session.user) {
//     return res.json({
//       authenticated: true,
//       user: req.session.user
//     });
//   }
//   return res.status(401).json({ authenticated: false });
// });

router.get('/session', (req, res) => {
  
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user
    });
  }
  
  return res.json({
    authenticated: false,
    user: null 
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    
    // Clear cookie with same options as when it was created
    res.clearCookie("sid", {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    
    console.log("Logout successful");
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
