// routes/xp.js
const express = require('express');
const router = express.Router();

// Correctly imports your database pool from db.js
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

    // The Main Query: Uses f.name for recipes and p.foodName for community posts
    const logsQuery = `
      SELECT 
        xl.id,
        xl.action_type,
        xl.reference_id,
        xl.xp_awarded,
        xl.created_at,
        COALESCE(f.name, p.foodName) AS reference_title 
      FROM xp_logs xl
      LEFT JOIN recipe r ON xl.reference_id = r.recipeID AND xl.action_type LIKE 'RECIPE%'
      LEFT JOIN food f ON r.foodID = f.foodID
      LEFT JOIN posts p ON xl.reference_id = p.postID AND xl.action_type LIKE 'POST%'
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

// GET /api/xp/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const type = req.query.type;
    const limit = Math.min(parseInt(req.query.limit) || 20, 20);

    if (!['recipe', 'post', 'level'].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid leaderboard type. Use: recipe, post, or level" });
    }

    let rows = [];

    if (type === 'recipe') {
      [rows] = await db.query(`
        WITH monthly_recipes AS (
          -- Step 1: Get all approved recipes this month with row number per user
          SELECT
            r.recipeID,
            r.userProfileID,
            r.approved_at,
            ROW_NUMBER() OVER (
              PARTITION BY r.userProfileID 
              ORDER BY r.approved_at ASC
            ) AS row_num,
            COUNT(*) OVER (PARTITION BY r.userProfileID) AS contributions
          FROM recipe r
          JOIN userProfile up ON r.userProfileID = up.userProfileID
          JOIN user u ON up.userID = u.userID
          WHERE r.status = 'Approved'
            AND MONTH(r.approved_at) = MONTH(CURRENT_DATE)
            AND YEAR(r.approved_at) = YEAR(CURRENT_DATE)
            AND u.role = 'member'
            AND u.status != 'Suspended'
        ),
        user_tiebreaker AS (
          -- Step 2: Get the timestamp when each user reached their final count
          SELECT
            userProfileID,
            contributions,
            approved_at AS reached_at
          FROM monthly_recipes
          WHERE row_num = contributions
        )
        -- Step 3: Join back to get user details and sort
        SELECT
          up.userProfileID AS id,
          u.firstname AS firstName,
          u.lastname AS lastName,
          up.avatar,
          ut.contributions,
          ut.reached_at
        FROM user_tiebreaker ut
        JOIN userProfile up ON ut.userProfileID = up.userProfileID
        JOIN user u ON up.userID = u.userID
        ORDER BY ut.contributions DESC, ut.reached_at ASC
        LIMIT ?
      `, [limit]);

    } else if (type === 'post') {
      [rows] = await db.query(`
        WITH monthly_posts AS (
          -- Step 1: Get all approved posts this month with row number per user
          SELECT
            p.postID,
            p.userProfileID,
            p.approved_at,
            ROW_NUMBER() OVER (
              PARTITION BY p.userProfileID 
              ORDER BY p.approved_at ASC
            ) AS row_num,
            COUNT(*) OVER (PARTITION BY p.userProfileID) AS contributions
          FROM posts p
          JOIN userProfile up ON p.userProfileID = up.userProfileID
          JOIN user u ON up.userID = u.userID
          WHERE p.status = 'Approved'
            AND MONTH(p.approved_at) = MONTH(CURRENT_DATE)
            AND YEAR(p.approved_at) = YEAR(CURRENT_DATE)
            AND u.role = 'member'
            AND u.status != 'Suspended'
        ),
        user_tiebreaker AS (
          -- Step 2: Get the timestamp when each user reached their final count
          SELECT
            userProfileID,
            contributions,
            approved_at AS reached_at
          FROM monthly_posts
          WHERE row_num = contributions
        )
        -- Step 3: Join back to get user details and sort
        SELECT
          up.userProfileID AS id,
          u.firstname AS firstName,
          u.lastname AS lastName,
          up.avatar,
          ut.contributions,
          ut.reached_at
        FROM user_tiebreaker ut
        JOIN userProfile up ON ut.userProfileID = up.userProfileID
        JOIN user u ON up.userID = u.userID
        ORDER BY ut.contributions DESC, ut.reached_at ASC
        LIMIT ?
      `, [limit]);

    } else if (type === 'level') {
      // Tiers ordered highest first
      const TIERS = [
        { id: "culinary_legend",      minLevel: 50, title: "Culinary Legend" },
        { id: "culinary_master",      minLevel: 40, title: "Culinary Master" },
        { id: "nutrition_expert",     minLevel: 30, title: "Nutrition Expert" },
        { id: "nutrition_scholar",    minLevel: 20, title: "Nutrition Scholar" },
        { id: "nutrition_enthusiast", minLevel: 10, title: "Nutrition Enthusiast" },
        { id: "foodie",               minLevel: 5,  title: "Foodie" },
        { id: "novice",               minLevel: 1,  title: "Novice" },
      ];

      const getTier = (level) => {
        return TIERS.find(t => level >= t.minLevel) || TIERS[TIERS.length - 1];
      };

      const [levelRows] = await db.query(`
        SELECT
          up.userProfileID AS id,
          u.firstname AS firstName,
          u.lastname AS lastName,
          up.avatar,
          up.total_xp AS xp,
          FLOOR(1 + POW(GREATEST(up.total_xp, 0) / 100, 2/3) + 0.0001) AS level
        FROM userProfile up
        JOIN user u ON up.userID = u.userID
        WHERE u.role = 'member'
          AND u.status != 'Suspended'
        ORDER BY up.total_xp DESC, up.userProfileID ASC
        LIMIT ?
      `, [limit]);

      rows = levelRows.map(row => {
        const tier = getTier(row.level);
        return {
          ...row,
          tier_id: tier.id,
          tier_title: tier.title
        };
      });
    }

    return res.json({ success: true, leaderboard: rows });

  } catch (error) {
    console.error("❌ Error fetching leaderboard:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leaderboard", error: error.message });
  }
});

module.exports = router;