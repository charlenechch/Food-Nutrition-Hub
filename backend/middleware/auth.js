// backend/middleware/auth.js
const ROLES = require("../config/roles");
const rolePermissions = require("../config/rolespermission");

// ✅ Require authentication (Session-based)
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to access this resource",
    });
  }
  next();
};

// ✅ Allow specific roles only
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to access this resource",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      console.warn(`[RBAC] ❌ Access denied for user ${user.id} (${user.role}) → ${req.originalUrl}`);
      return res.status(403).json({
        error: "Access denied",
        message: `Your role (${user.role}) does not have permission to access this resource`,
      });
    }

    next();
  };
};

// ✅ Allow only self or admin
const allowSelfOrAdmin = (getTargetUserId) => {
  return (req, res, next) => {
    const user = req.session?.user;
    const targetId = String(getTargetUserId(req));

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to continue",
      });
    }

    const isAdmin = user.role === ROLES.ADMIN;
    const isSelf = String(user.userID) === targetId;

    if (isAdmin || isSelf) return next();

    console.warn(`[Ownership] ❌ User ${user.id} (${user.role}) attempted to access user ${targetId}`);
    return res.status(403).json({
      error: "Access denied",
      message: "You can only access or modify your own profile",
    });
  };
};

// ✅ Attach user to req.user
const attachUser = (req, res, next) => {
  req.user = req.session?.user || null;
  next();
};

// ✅ Page-based access control
const allowPageAccess = (page) => {
  return (req, res, next) => {
    const user = req.session?.user || { role: ROLES.GUEST };
    const allowedPages = rolePermissions[user.role] || [];

    if (!allowedPages.includes(page)) {
      console.warn(`[Access Control] ❌ ${user.role} attempted to access restricted page: ${page}`);
      return res.status(403).json({
        error: "Access denied",
        message: `Your role (${user.role}) does not have permission to access the ${page} page`,
      });
    }

    next();
  };
};

// ✅ Require admin only
const requireAdmin = (req, res, next) => {
  const user = req.session?.user;

  if (!user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to continue",
    });
  }

  if (user.role !== ROLES.ADMIN) {
    console.warn(`[Admin Only] ❌ Access denied for user ${user.id} (${user.role})`);
    return res.status(403).json({
      error: "Access denied",
      message: "Admin privileges required",
    });
  }

  next();
};

module.exports = {
  requireAuth,
  allowRoles,
  allowSelfOrAdmin,
  attachUser,
  allowPageAccess,
  requireAdmin,
};
