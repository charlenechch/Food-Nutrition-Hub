const express = require('express');
const router = express.Router();

// Check if session is valid
router.get('/check-session', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  }
  return res.json({ authenticated: false });
});

module.exports = router;