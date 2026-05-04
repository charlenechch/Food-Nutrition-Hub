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

    // The Main Query: Mapped perfectly to recipe, food, posts, and discussion tables!
    const logsQuery = `
      SELECT 
        xl.id,
        xl.action_type,
        xl.reference_id,
        xl.xp_awarded,
        xl.created_at,
        CASE 
          WHEN xl.action_type LIKE '%RECIPE%' THEN f.name
          WHEN xl.action_type LIKE '%POST%' THEN p.title
          WHEN xl.action_type LIKE '%DISCUSSION%' OR xl.action_type LIKE '%COMMENT%' THEN CONCAT('"', SUBSTRING(d.content, 1, 30), '..."')
          ELSE NULL
        END AS reference_title 
      FROM xp_logs xl
      -- Recipes need to hop through the food table to get the actual dish name
      LEFT JOIN recipe r ON xl.reference_id = r.recipeID AND xl.action_type LIKE '%RECIPE%'
      LEFT JOIN food f ON r.foodID = f.foodID
      -- Posts map to the 'posts' table using the 'title' column
      LEFT JOIN posts p ON xl.reference_id = p.postID AND xl.action_type LIKE '%POST%'
      -- Discussions/Comments map to the 'discussion' table using the 'content' column
      LEFT JOIN discussion d ON xl.reference_id = d.discussionID AND (xl.action_type LIKE '%DISCUSSION%' OR xl.action_type LIKE '%COMMENT%')
      WHERE xl.userProfileID = ?
      ORDER BY xl.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // The Count Query
    const countQuery = `
      SELECT COUNT(*) as totalCount 
      FROM xp_logs 
      WHERE userProfileID = ?
    `;

    // Execute queries using db.query directly
    const [logs] = await db.query(logsQuery, [userProfileID, limit, offset]);
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