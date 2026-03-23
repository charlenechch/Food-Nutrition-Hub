const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { requireAdmin } = require("../middleware/auth");

// Helper: called by other route files to insert a log entry
async function logActivity(db, adminID, adminName, actionType, description) {
  try {
    await db.execute(
      `INSERT INTO adminActivityLog (adminID, adminName, actionType, description)
       VALUES (?, ?, ?, ?)`,
      [adminID, adminName, actionType, description]
    );
  } catch (err) {
    console.error("⚠️ Failed to write activity log:", err.message);
  }
}

// GET /api/admin/activityLog
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { actionType, startDate, endDate, search, page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;

    const conditions = [];
    const values = [];

    if (actionType && actionType !== "all") {
      conditions.push("actionType = ?");
      values.push(actionType);
    }

    if (startDate) {
      conditions.push("DATE(createdAt) >= ?");
      values.push(startDate);
    }

    if (endDate) {
      conditions.push("DATE(createdAt) <= ?");
      values.push(endDate);
    }

    if (search) {
      conditions.push("(adminName LIKE ? OR description LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT logID, adminID, adminName, actionType, description, createdAt
       FROM adminActivityLog
       ${whereClause}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM adminActivityLog ${whereClause}`,
      values
    );

    res.json({
      success: true,
      logs: rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("❌ Failed to fetch activity log:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch activity log." });
  }
});

module.exports = { router, logActivity };