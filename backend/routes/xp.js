// routes/xp.js
const express = require('express');
const router = express.Router();
const { pool: db } = require('../config/db'); 

// GET /api/xp/logs?page=1
router.get('/logs', async (req, res) => {
  try {
    // Reads the real user session
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const userID = req.session.user.userID;

    // Convert userID into userProfileID
    const [profileRows] = await db.query(
      "SELECT userProfileID FROM userProfile WHERE userID = ?", 
      [userID]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    const userProfileID = profileRows[0].userProfileID;

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 5; 
    const offset = (page - 1) * limit;

    // THE FIXED QUERY: 
    // 1. Properly targets the `posts` table (not community_post).
    // 2. Uses template literals for LIMIT/OFFSET to prevent MySQL parameter parsing crashes.
    const logsQuery = `
      SELECT 
        x.id,
        x.action_type,
        x.reference_id,
        x.xp_awarded,
        x.created_at,
        CASE 
          WHEN x.action_type LIKE '%RECIPE%' THEN f.name
          WHEN x.action_type LIKE '%POST%' THEN p.title
          WHEN x.action_type LIKE '%DISCUSSION%' OR x.action_type LIKE '%COMMENT%' THEN CONCAT('"', SUBSTRING(d.content, 1, 30), '..."')
          ELSE NULL
        END AS reference_title 
      FROM xp_logs x
      -- Recipes hop through the food table to get the actual dish name
      LEFT JOIN recipe r ON x.reference_id = r.recipeID AND x.action_type LIKE '%RECIPE%'
      LEFT JOIN food f ON r.foodID = f.foodID
      -- Fixed: Targets the 'posts' table correctly
      LEFT JOIN posts p ON x.reference_id = p.postID AND x.action_type LIKE '%POST%'
      -- Targets 'discussion' table for comments/discussions
      LEFT JOIN discussion d ON x.reference_id = d.discussionID AND (x.action_type LIKE '%DISCUSSION%' OR x.action_type LIKE '%COMMENT%')
      WHERE x.userProfileID = ?
      ORDER BY x.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    // The Count Query
    const countQuery = `
      SELECT COUNT(*) as totalCount 
      FROM xp_logs 
      WHERE userProfileID = ?
    `;

    // Execute queries using db.query directly
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