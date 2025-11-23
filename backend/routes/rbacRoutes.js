// backend/routes/rbacRoutes.js
const express = require("express");
const router = express.Router();
const {
  requireAuth,
  allowRoles,
  allowSelfOrAdmin,
  attachUser,
  allowPageAccess,
} = require("../middleware/auth");
const ROLES = require("../config/roles");

// 🧩 Admin Dashboard
router.get(
  "/admin/dashboard",
  requireAuth,
  allowRoles(ROLES.ADMIN),
  (req, res) => {
    res.status(200).json({
      message: "✅ Welcome, Admin!",
      user: req.session.user,
      access: "Full control granted",
    });
  }
);

// 🧩 Member Dashboard
router.get(
  "/member/home",
  requireAuth,
  allowRoles(ROLES.MEMBER),
  (req, res) => {
    res.status(200).json({
      message: "👋 Welcome, Member!",
      user: req.session.user,
      access: "Analyser and community enabled",
    });
  }
);

// 🧩 Public Pages — Accessible by guests & members
router.get(
  "/foods",
  attachUser,
  allowPageAccess("explore"),
  (req, res) => {
    res.status(200).json({
      message: "🍽️ Explore Food Page — Public access",
      role: req.user?.role || "guest",
    });
  }
);

router.get(
  "/recipe",
  attachUser,
  allowPageAccess("recipe"),
  (req, res) => {
    res.status(200).json({
      message: "🥗 Recipe Page — Public access",
      role: req.user?.role || "guest",
    });
  }
);

// 🧩 Member-only features (Analyser + Community)
router.get(
  "/analyser",
  attachUser,
  allowPageAccess("analyser"),
  (req, res) => {
    res.status(200).json({
      message: "🥦 Nutrition Analyser Page — Members/Admins only",
      role: req.session.user.role,
    });
  }
);

router.get(
  "/community",
  requireAuth,
  allowPageAccess("community"),
  (req, res) => {
    res.status(200).json({
      message: "💬 Community Page — Members/Admins only",
      role: req.session.user.role,
    });
  }
);

// 🧩 Profile (Self or Admin only)
router.get(
  "/users/:id",
  requireAuth,
  attachUser,
  allowSelfOrAdmin((req) => req.params.id),
  (req, res) => {
    res.status(200).json({
      message: `👤 Viewing profile for user ${req.params.id}`,
      viewedBy: req.session.user.id,
    });
  }
);

router.put(
  "/users/:id",
  requireAuth,
  attachUser,
  allowSelfOrAdmin((req) => req.params.id),
  (req, res) => {
    if (req.user.role !== ROLES.ADMIN) {
      delete req.body.role;
      delete req.body.id;
    }
    res.status(200).json({
      message: `✅ Profile for user ${req.params.id} updated`,
    });
  }
);

router.delete(
  "/users/:id",
  requireAuth,
  attachUser,
  allowSelfOrAdmin((req) => req.params.id),
  (req, res) => {
    res.status(200).json({
      message: `🗑️ User ${req.params.id} deleted`,
      performedBy: req.session.user.id,
    });
  }
);

module.exports = router;
