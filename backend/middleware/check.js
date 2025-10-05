// ✅ Middleware to check admin access
function checkAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
}

// ✅ Middleware to check general user role
function checkUser(req, res, next) {
  if (req.user && req.user.role === "user") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Users only." });
  }
}

module.exports = { checkAdmin, checkUser };
