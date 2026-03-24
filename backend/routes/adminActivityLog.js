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
      [...values, Number(limit), Number(offset)]
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

// Clear logs older than a cutoff date
router.delete("/", requireAdmin, async (req, res) => {
  try {
    const { cutoffDate } = req.body;

    if (!cutoffDate) {
      return res.status(400).json({ success: false, message: "cutoffDate is required." });
    }

    const [result] = await db.execute(
      "DELETE FROM adminActivityLog WHERE DATE(createdAt) < ?",
      [cutoffDate]
    );

    const deletedCount = result.affectedRows;

    const adminID = req.session.user.userID;
    const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
    const today = new Date();
    const cutoff = new Date(cutoffDate);
    const diffDays = Math.round((today - cutoff) / (1000 * 60 * 60 * 24));
    const periodLabel = diffDays === 30 ? "30 days" 
                      : diffDays === 60 ? "60 days" 
                      : diffDays === 90 ? "90 days" 
                      : diffDays === 365 ? "1 year" 
                      : `custom date`;

    await logActivity(
      db, adminID, adminName, "logs_cleared",
      `Deleted ${deletedCount} activity log ${deletedCount === 1 ? "entry" : "entries"} older than ${periodLabel} (before ${cutoffDate}).`
    );

    res.json({ success: true, message: `Deleted ${deletedCount} log ${deletedCount === 1 ? "entry" : "entries"}.`, deletedCount });
  } catch (err) {
    console.error("❌ Failed to clear activity log:", err.message);
    res.status(500).json({ success: false, message: "Failed to clear logs." });
  }
});

module.exports = { router, logActivity };