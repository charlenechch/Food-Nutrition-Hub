const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth"); // ✅ using your existing RBAC

// ✅ Example Admin API – only admins can access
router.get("/dashboard", requireAdmin, (req, res) => {
  return res.json({
    success: true,
    message: `Welcome Admin ${req.session.user.firstname}!`,
  });
});

// ✅ Example: Admin fetch user list
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const [users] = await req.db.execute("SELECT userID, firstname, lastname, email, role FROM user");
    return res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
