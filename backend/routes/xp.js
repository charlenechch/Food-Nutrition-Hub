// routes/xp.js
const express = require('express');
const router = express.Router();
// Import your database connection pool (adjust the path to match your setup)
const db = require('../config/db'); 

// GET /api/xp-logs?page=1
router.get('/xp-logs', async (req, res) => {
  try {
    // 1. Identify the User 
    // In a real app, you get this from your JWT auth middleware (e.g., req.user.userProfileID)
    // For testing right now, you might hardcode a valid userProfileID from your database
    const userProfileID = req.user ? req.user.userProfileID : 1; 

    // 2. Setup Pagination
    // This matches the logic in your XpLogsPage.jsx
    const page = parseInt(req.query.page) || 1;
    const limit = 5; 
    const offset = (page - 1) * limit;

    // 3. The Main Query
    // We use LEFT JOIN to grab the actual recipe description or post foodName
    // COALESCE picks the first one that isn't null, acting as your 'reference_title'
    const logsQuery = `
      SELECT 
        xl.id,
        xl.action_type,
        xl.reference_id,
        xl.xp_awarded,
        xl.created_at,
        COALESCE(r.description, p.foodName) AS reference_title 
      FROM xp_logs xl
      LEFT JOIN recipe r ON xl.reference_id = r.recipeID AND xl.action_type LIKE 'RECIPE%'
      LEFT JOIN posts p ON xl.reference_id = p.postID AND xl.action_type LIKE 'POST%'
      WHERE xl.userProfileID = ?
      ORDER BY xl.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // 4. The Count Query
    // Your React pagination needs to know how many total pages exist
    const countQuery = `
      SELECT COUNT(*) as totalCount 
      FROM xp_logs 
      WHERE userProfileID = ?
    `;

    // 5. Execute Queries (using mysql2 promise wrapper)
    const [logs] = await db.promise().query(logsQuery, [userProfileID, limit, offset]);
    const [countResult] = await db.promise().query(countQuery, [userProfileID]);

    const totalCount = countResult[0].totalCount;

    // 6. Send the Response back to React
    res.json({
      success: true,
      logs: logs,
      totalLogs: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error("Error fetching XP logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch XP logs" });
  }
});

module.exports = router;