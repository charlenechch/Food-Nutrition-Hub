const ROLES = require('./roles');
const rolePermissions = require('./rolePermissions');

/**
 * Middleware: Require the user to be authenticated.
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  next();
};

/**
 * Middleware: Allow access based on specified roles.
 * Example: allowRoles(ROLES.ADMIN) or allowRoles(ROLES.ADMIN, ROLES.MEMBER)
 */
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    if (!allowedRoles.includes(user.role)) {
      console.warn(`[RBAC] Access denied for user ${user.id} (${user.role}) → ${req.originalUrl}`);
      return res.status(403).json({
        error: 'Access denied',
        message: `Your role (${user.role}) does not have permission to access this resource`
      });
    }

    next();
  };
};

/**
 * Middleware: Check if user owns the resource OR is admin.
 */
const allowSelfOrAdmin = (getTargetUserId) => {
  return (req, res, next) => {
    const user = req.session?.user;
    const targetId = String(getTargetUserId(req));

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to continue'
      });
    }

    const isAdmin = user.role === ROLES.ADMIN;
    const isSelf = String(user.id) === targetId;

    if (isAdmin || isSelf) {
      return next();
    }

    console.warn(`[Ownership] User ${user.id} (${user.role}) attempted to access user ${targetId}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access or modify your own profile'
    });
  };
};

/**
 * Middleware: Attach the logged-in user to req.user
 */
const attachUser = (req, res, next) => {
  req.user = req.session?.user || null;
  next();
};

/**
 * Middleware: Check feature/page access based on rolePermissions
 */
const allowPageAccess = (page) => {
  return (req, res, next) => {
    const user = req.session?.user || { role: ROLES.GUEST };
    const allowedPages = rolePermissions[user.role] || [];

    if (!allowedPages.includes(page)) {
      console.warn(`[Access Control] ${user.role} attempted to access restricted page: ${page}`);
      return res.status(403).json({
        error: 'Access denied',
        message: `Your role (${user.role}) does not have permission to access the ${page} page`
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  allowRoles,
  allowSelfOrAdmin,
  attachUser,
  allowPageAccess
};


const express = require('express');
const router = express.Router();
const {
  requireAuth,
  allowRoles,
  allowSelfOrAdmin,
  attachUser,
  allowPageAccess
} = require('../authMiddleware');
const ROLES = require('../roles');

// -------------------------
// ADMIN DASHBOARD
// -------------------------
router.get('/admin/dashboard',
  requireAuth,
  allowRoles(ROLES.ADMIN),
  (req, res) => res.send('Welcome, Admin!')
);

// -------------------------
// MEMBER DASHBOARD
// -------------------------
router.get('/member/home',
  requireAuth,
  allowRoles(ROLES.MEMBER),
  (req, res) => res.send('Welcome, Member!')
);

// -------------------------
// GUEST & MEMBER ACCESS (Explore + Recipe)
// -------------------------
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

// -------------------------
// MEMBER ONLY (Analyser + Community)
// -------------------------
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

// -------------------------
// PROFILE OWNERSHIP (View/Edit/Delete)
// -------------------------
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
