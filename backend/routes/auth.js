const express = require('express');
const router = express.Router();

// ✅ Session check
router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user
    });
  }
  return res.status(401).json({ authenticated: false });
});

// ✅ Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("❌ Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // important
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
