const express = require('express');
const router = express.Router();
const {
  requireAuth,
  allowRoles,
  allowSelfOrAdmin,
  attachUser,
  allowPageAccess
} = require('../middleware/auth');
const ROLES = require('../config/roles');

// Admin dashboard
router.get('/admin/dashboard',
  requireAuth,
  allowRoles(ROLES.ADMIN),
  (req, res) => res.send('Welcome, Admin!')
);

// Member dashboard

router.get('/member/home',
  requireAuth,
  allowRoles(ROLES.MEMBER),
  (req, res) => res.send('Welcome, Member!')
);

// Guest & member access (Explore + Recipe)

router.get('/explore',
  attachUser,
  allowPageAccess('explore'),
  (req, res) => res.send('Explore Food Page')
);

router.get('/recipe',
  attachUser,
  allowPageAccess('recipe'),
  (req, res) => res.send('Recipe Page')
);

// Member only (Analyser + Community)
router.get('/analyser',
  requireAuth,
  allowPageAccess('analyser'),
  (req, res) => res.send('Nutrition Analyser Page')
);

router.get('/community',
  requireAuth,
  allowPageAccess('community'),
  (req, res) => res.send('Community Page')
);

// Profile ownership (View/Edit/Delete)
router.get('/users/:id',
  requireAuth,
  attachUser,
  allowSelfOrAdmin(req => req.params.id),
  (req, res) => res.send(`Viewing profile for user ${req.params.id}`)
);

router.put('/users/:id',
  requireAuth,
  attachUser,
  allowSelfOrAdmin(req => req.params.id),
  (req, res) => {
    if (req.user.role !== ROLES.ADMIN) {
      delete req.body.role;
      delete req.body.id;
    }
    res.send(`Profile for user ${req.params.id} updated`);
  }
);

router.delete('/users/:id',
  requireAuth,
  attachUser,
  allowSelfOrAdmin(req => req.params.id),
  (req, res) => res.send(`User ${req.params.id} deleted`)
);

module.exports = router;
