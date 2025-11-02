const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth"); // ✅ using your existing RBAC

// ✅ Middleware: attach DB connection (since req.db isn’t auto-added in your server.js)
const mysql = require("mysql2/promise");
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
});

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
    // ✅ Proper MySQL query using our db pool
    const [users] = await db.execute(`
      SELECT userID, firstname, lastname, email, role
      FROM user
      ORDER BY userID ASC
    `);

    // ✅ Return consistent JSON format
    return res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
