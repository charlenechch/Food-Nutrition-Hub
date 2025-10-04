// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }
  
  next();
};

// Middleware to check if user is an admin
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  
  next();
};

// Middleware to check if user is a member (admin or regular member)
const requireMember = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }
  
  const validRoles = ['admin', 'member'];
  if (!validRoles.includes(req.session.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Valid member account required'
    });
  }
  
  next();
};

// Middleware to attach user info to request
const attachUser = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  } else {
    req.user = null;
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireMember,
  attachUser
};