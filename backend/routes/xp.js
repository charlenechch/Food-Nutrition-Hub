// routes/xp.js
const express = require('express');
const router = express.Router();
const { pool: db } = require('../config/db'); 

// GET /api/xp/logs?page=1
router.get('/logs', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const userID = req.session.user.userID;

    const [profileRows] = await db.query(
      "SELECT userProfileID FROM userProfile WHERE userID = ?", 
      [userID]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    const userProfileID = profileRows[0].userProfileID;
    const page = parseInt(req.query.page) || 1;
    const limit = 5; 
    const offset = (page - 1) * limit;

    // THE BULLETPROOF QUERY:
    // We use subqueries here so we don't have to worry about old logs using foodID instead of recipeID.
    // It directly scans the relevant table and pulls the title.
    const logsQuery = `
      SELECT 
        x.id,
        x.action_type,
        x.reference_id,
        x.xp_awarded,
        x.created_at,
        CASE 
          WHEN x.action_type LIKE '%RECIPE%' THEN (
            SELECT COALESCE(f.name, r.recipeName) 
            FROM recipe r 
            LEFT JOIN food f ON r.foodID = f.foodID 
            WHERE r.recipeID = x.reference_id OR r.foodID = x.reference_id 
            LIMIT 1
          )
          WHEN x.action_type LIKE '%POST%' THEN (
            SELECT foodName FROM posts WHERE postID = x.reference_id LIMIT 1
          )
          WHEN x.action_type LIKE '%DISCUSSION%' OR x.action_type LIKE '%COMMENT%' THEN (
            SELECT CONCAT('"', SUBSTRING(content, 1, 30), '..."') FROM discussion WHERE discussionID = x.reference_id LIMIT 1
          )
          ELSE NULL
        END AS reference_title 
      FROM xp_logs x
      WHERE x.userProfileID = ?
      ORDER BY x.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const countQuery = `
      SELECT COUNT(*) as totalCount 
      FROM xp_logs 
      WHERE userProfileID = ?
    `;

    const [logs] = await db.query(logsQuery, [userProfileID]);
    const [countResult] = await db.query(countQuery, [userProfileID]);

    const totalCount = countResult[0].totalCount;

    res.json({
      success: true,
      logs: logs,
      totalLogs: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error("❌ Error fetching XP logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch XP logs", error: error.message });
  }
});

module.exports = router;