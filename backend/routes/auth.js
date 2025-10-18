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

// Session check
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

module.exports = router;
