const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

// Helper function to get month name
function getMonthName(monthNumber) {  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNumber - 1] || '';
}

// Get available years from database
router.get('/available-years', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT YEAR(updatedAt) as year 
      FROM (
        SELECT updatedAt FROM recipe WHERE status = 'Approved'
        UNION ALL
        SELECT updated_at as updatedAt FROM posts WHERE status = 'Approved'
      ) AS contributions
      ORDER BY year DESC
    `;
    
    const [results] = await db.execute(query);
    const years = results.map(row => row.year);
    
    res.json({
      success: true,
      data: years
    });
    
  } catch (error) {
    console.error('❌ Error fetching available years:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available years'
    });
  }
});

// Get available months for a selected year
router.get('/available-months', async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year || isNaN(year)) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const query = `
      SELECT DISTINCT MONTH(updatedAt) as month 
      FROM (
        SELECT updatedAt FROM recipe WHERE status = 'Approved'
        UNION ALL
        SELECT updated_at as updatedAt FROM posts WHERE status = 'Approved'
      ) AS contributions
      WHERE YEAR(updatedAt) = ?
      ORDER BY month
    `;
    
    const [results] = await db.execute(query, [parseInt(year)]);
    
    const months = results.map(row => ({
      value: row.month,
      name: getMonthName(row.month)
    }));
    
    res.json({
      success: true,
      data: months
    });
    
  } catch (error) {
    console.error('❌ Error fetching available months:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available months'
    });
  }
});

// Get metrics data for the cards
router.get('/metrics', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Parse parameters
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : null;
    
    console.log(`📊 Metrics request: year=${currentYear}, month=${currentMonth || 'all'}`);
    
    // Build queries
    let recipeWhere = "WHERE status = 'Approved'";
    let recipeParams = [];
    
    let storyWhere = "WHERE status = 'Approved'";
    let storyParams = [];
    
    if (year && month) {
      recipeWhere += " AND YEAR(updatedAt) = ? AND MONTH(updatedAt) = ?";
      recipeParams.push(currentYear, currentMonth);
      
      storyWhere += " AND YEAR(updated_at) = ? AND MONTH(updated_at) = ?";
      storyParams.push(currentYear, currentMonth);
    } else if (year) {
      recipeWhere += " AND YEAR(updatedAt) = ?";
      recipeParams.push(currentYear);
      
      storyWhere += " AND YEAR(updated_at) = ?";
      storyParams.push(currentYear);
    }

    console.log('📊 Recipe query:', recipeWhere, 'Params:', recipeParams);
    
    // Query for total approved recipes
    const recipeQuery = `SELECT COUNT(*) as count FROM recipe ${recipeWhere}`;
    const [totalRecipesResult] = await db.execute(recipeQuery, recipeParams);
    const totalRecipes = totalRecipesResult[0].count || 0;

    // Query for total approved stories (posts)
    const storyQuery = `SELECT COUNT(*) as count FROM posts ${storyWhere}`;
    const [totalStoriesResult] = await db.execute(storyQuery, storyParams);
    const totalStories = totalStoriesResult[0].count || 0;

    // Query for pending recipe reviews (always total, not filtered by date)
    const [pendingRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM recipe 
      WHERE status = 'Pending'
    `);
    const pendingRecipes = pendingRecipesResult[0].count || 0;

    // Query for pending story reviews (always total, not filtered by date)
    const [pendingStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Pending'
    `);
    const pendingStories = pendingStoriesResult[0].count || 0;

    let recipesPercentage = 0;
    let storiesPercentage = 0;
    
    if (month) {
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Query for current month approved recipes
      const [currentMonthRecipesResult] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM recipe 
        WHERE status = 'Approved' 
          AND MONTH(updatedAt) = ? 
          AND YEAR(updatedAt) = ?
      `, [currentMonth, currentYear]);
      const currentMonthRecipes = currentMonthRecipesResult[0].count || 0;

      // Query for previous month approved recipes
      const [previousMonthRecipesResult] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM recipe 
        WHERE status = 'Approved' 
          AND MONTH(updatedAt) = ? 
          AND YEAR(updatedAt) = ?
      `, [previousMonth, previousYear]);
      const previousMonthRecipes = previousMonthRecipesResult[0].count || 0;

      // Query for current month approved stories
      const [currentMonthStoriesResult] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM posts 
        WHERE status = 'Approved' 
          AND MONTH(updated_at) = ? 
          AND YEAR(updated_at) = ?
      `, [currentMonth, currentYear]);
      const currentMonthStories = currentMonthStoriesResult[0].count || 0;

      // Query for previous month approved stories
      const [previousMonthStoriesResult] = await db.execute(`
        SELECT COUNT(*) as count 
        FROM posts 
        WHERE status = 'Approved' 
          AND MONTH(updated_at) = ? 
          AND YEAR(updated_at) = ?
      `, [previousMonth, previousYear]);
      const previousMonthStories = previousMonthStoriesResult[0].count || 0;

      // Calculate percentages safely
      recipesPercentage = previousMonthRecipes > 0 
        ? Math.round(((currentMonthRecipes - previousMonthRecipes) / previousMonthRecipes) * 100)
        : currentMonthRecipes > 0 ? 100 : 0;

      storiesPercentage = previousMonthStories > 0 
        ? Math.round(((currentMonthStories - previousMonthStories) / previousMonthStories) * 100)
        : currentMonthStories > 0 ? 100 : 0;
    }

    res.json({
      success: true,
      data: {
        totalRecipes,
        totalStories,
        pendingRecipes,
        pendingStories,
        percentages: {
          recipes: recipesPercentage,
          stories: storiesPercentage
        },
        timeframe: {
          year: currentYear,
          month: currentMonth
        }
      }
    });
  } catch (error) {
    console.error('Error fetching metrics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics data',
      message: error.message
    });
  }
});

// Cultural origin endpoint
router.get('/cultural-origin', async (req, res) => {
  try {
    const { year, month } = req.query;

    let whereConditions = "WHERE f.origin IS NOT NULL AND f.origin != '' AND r.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(r.updatedAt) = ? AND MONTH(r.updatedAt) = ?";
      params.push(parseInt(year), parseInt(month));
    } else if (year) {
      whereConditions += " AND YEAR(r.updatedAt) = ?";
      params.push(parseInt(year));
    }

    const query = `
      SELECT 
        f.origin as name,
        COUNT(f.foodID) as count
      FROM food f
      INNER JOIN recipe r ON f.foodID = r.foodID
      ${whereConditions}
      GROUP BY f.origin
      ORDER BY count DESC
    `;

    const [results] = await db.execute(query, params);
    
    if (results.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        totalCount: 0
      });
    }
    
    const total = results.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    const data = results.map(item => ({
      name: item.name,
      value: total > 0 ? Math.round((item.count / total) * 100) : 0,
      count: item.count
    }));
    
    res.json({ 
      success: true, 
      data,
      totalCount: total
    });
  } catch (error) {
    console.error('Error fetching cultural origin data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cultural origin data',
      message: error.message 
    });
  }
});

// Posts and recipes by month endpoint
router.get('/posts-recipes-by-month', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : null;
    
    console.log(`📊 Fetching data for year: ${year}, month: ${month || 'all months'}`);
    
    if (month) {
      // Validate month
      if (month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          error: 'Invalid month parameter'
        });
      }
      
      const monthName = getMonthName(month);
      
      const query = `
        SELECT 
          'Posts' as type,
          status,
          COUNT(*) as count
        FROM posts 
        WHERE YEAR(updated_at) = ?
          AND MONTH(updated_at) = ?
        GROUP BY status
        
        UNION ALL
        
        SELECT 
          'Recipes' as type,
          status,
          COUNT(*) as count
        FROM recipe 
        WHERE YEAR(updatedAt) = ?
          AND MONTH(updatedAt) = ?
        GROUP BY status
        
        ORDER BY type, status
      `;
      
      const params = [year, month, year, month];
      const [results] = await db.execute(query, params);
      
      // Initialize counters
      const monthlyData = {
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 0
      };
      
      // Process query results - combine posts and recipes
      results.forEach(item => {
        const status = item.status.toLowerCase();
        if (['approved', 'pending', 'rejected'].includes(status)) {
          monthlyData[status] += item.count;
        }
        monthlyData.total += item.count;
      });
      
      // Create single data point for the selected month
      const data = [{
        month: monthName,
        posts: {
          approved: results.filter(r => r.type === 'Posts' && r.status === 'Approved')[0]?.count || 0,
          pending: results.filter(r => r.type === 'Posts' && r.status === 'Pending')[0]?.count || 0,
          rejected: results.filter(r => r.type === 'Posts' && r.status === 'Rejected')[0]?.count || 0,
          total: results.filter(r => r.type === 'Posts').reduce((sum, r) => sum + (r.count || 0), 0)
        },
        recipes: {
          approved: results.filter(r => r.type === 'Recipes' && r.status === 'Approved')[0]?.count || 0,
          pending: results.filter(r => r.type === 'Recipes' && r.status === 'Pending')[0]?.count || 0,
          rejected: results.filter(r => r.type === 'Recipes' && r.status === 'Rejected')[0]?.count || 0,
          total: results.filter(r => r.type === 'Recipes').reduce((sum, r) => sum + (r.count || 0), 0)
        },
        approved: monthlyData.approved,
        pending: monthlyData.pending,
        rejected: monthlyData.rejected,
        total: monthlyData.total
      }];
      
      res.json({ 
        success: true, 
        data,
        viewType: 'single-month',
        timeframe: {
          year: year,
          month: month,
          monthName: monthName
        }
      });
      
    } else {
      // Original monthly view (when no specific month is selected)
      const query = `
        SELECT 
          'Posts' as type,
          status,
          MONTH(updated_at) as month,
          COUNT(*) as count
        FROM posts 
        WHERE YEAR(updated_at) = ?
        GROUP BY MONTH(updated_at), status
        
        UNION ALL
        
        SELECT 
          'Recipes' as type,
          status,
          MONTH(updatedAt) as month,
          COUNT(*) as count
        FROM recipe 
        WHERE YEAR(updatedAt) = ?
        GROUP BY MONTH(updatedAt), status
        
        ORDER BY month, type, status
      `;
      
      const [results] = await db.execute(query, [year, year]);
      
      const monthlyData = {};
      const allMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
      ];
      
      allMonths.forEach((monthName, index) => {
        monthlyData[monthName] = {
          month: monthName,
          posts: { approved: 0, pending: 0, rejected: 0, total: 0 },
          recipes: { approved: 0, pending: 0, rejected: 0, total: 0 },
          approved: 0,
          pending: 0,
          rejected: 0,
          total: 0
        };
      });
      
      results.forEach(item => {
        const monthName = getMonthName(item.month);  
        const status = item.status.toLowerCase();
        
        if (item.type === 'Posts') {
          if (['approved', 'pending', 'rejected'].includes(status)) {
            monthlyData[monthName].posts[status] = item.count;
            monthlyData[monthName][status] += item.count;
          }
          monthlyData[monthName].posts.total += item.count;
        } else if (item.type === 'Recipes') {
          if (['approved', 'pending', 'rejected'].includes(status)) {
            monthlyData[monthName].recipes[status] = item.count;
            monthlyData[monthName][status] += item.count;
          }
          monthlyData[monthName].recipes.total += item.count;
        }
        
        monthlyData[monthName].total = monthlyData[monthName].posts.total + monthlyData[monthName].recipes.total;
      });
      
      const data = allMonths.map(monthName => monthlyData[monthName]);
      
      res.json({ 
        success: true, 
        data,
        viewType: 'monthly',
        timeframe: {
          year: year
        }
      });
    }
    
  } catch (error) {
    console.error('Error fetching posts and recipes data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch posts and recipes data',
      message: error.message 
    });
  }
});

// Popular categories endpoint
// router.get('/popular-categories', async (req, res) => {
//   try {
//     const { year, month } = req.query;

//     let whereConditions = "WHERE f.category IS NOT NULL AND f.category != '' AND r.status = 'Approved'";
//     const params = [];
    
//     if (year && month) {
//       whereConditions += " AND YEAR(r.updatedAt) = ? AND MONTH(r.updatedAt) = ?";
//       params.push(parseInt(year), parseInt(month));
//     } else if (year) {
//       whereConditions += " AND YEAR(r.updatedAt) = ?";
//       params.push(parseInt(year));
//     }

//     const query = `
//       SELECT 
//         f.category as name,
//         COUNT(f.foodID) as submissions
//       FROM food f
//       INNER JOIN recipe r ON f.foodID = r.foodID
//       ${whereConditions}
//       GROUP BY f.category
//       ORDER BY submissions DESC
//     `;

//     const [results] = await db.execute(query, params);
    
//     const data = results.map(item => ({
//       name: item.name,
//       submissions: parseInt(item.submissions) || 0
//     }));
    
//     res.json({ 
//       success: true, 
//       data,
//       totalCategories: results.length
//     });
//   } catch (error) {
//     console.error('Error fetching popular categories data:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to fetch popular categories data',
//       message: error.message 
//     });
//   }
// });

// Popular categories endpoint
router.get('/popular-categories', async (req, res) => {
  try {
    const { year, month } = req.query;

    let whereConditions = "WHERE f.category IS NOT NULL AND f.category != '' AND r.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(r.updatedAt) = ? AND MONTH(r.updatedAt) = ?";
      params.push(parseInt(year), parseInt(month));
    } else if (year) {
      whereConditions += " AND YEAR(r.updatedAt) = ?";
      params.push(parseInt(year));
    }

    const query = `
      SELECT 
        f.category,
        COUNT(f.foodID) as food_count
      FROM food f
      INNER JOIN recipe r ON f.foodID = r.foodID
      ${whereConditions}
      GROUP BY f.foodID, f.category
    `;

    const [results] = await db.execute(query, params);
    
    // Create a map to store category counts
    const categoryCounts = new Map();
    
    // Process each row and split the categories
    results.forEach(row => {
      if (row.category) {
        // Split by comma and trim whitespace
        const categories = row.category.split(',').map(cat => cat.trim());
        
        // Count each category
        categories.forEach(category => {
          if (category) { 
            const currentCount = categoryCounts.get(category) || 0;
            categoryCounts.set(category, currentCount + 1);
          }
        });
      }
    });
    
    // Convert the map to an array and sort by submissions
    const data = Array.from(categoryCounts, ([name, submissions]) => ({
      name,
      submissions
    })).sort((a, b) => b.submissions - a.submissions);
    
    res.json({ 
      success: true, 
      data,
      totalCategories: data.length
    });
  } catch (error) {
    console.error('Error fetching popular categories data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch popular categories data',
      message: error.message 
    });
  }
});

// Top contributors endpoints
router.get('/top-contributors-recipes', async (req, res) => {
  try {
    const { year, month } = req.query;

    let whereConditions = "WHERE r.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(r.updatedAt) = ? AND MONTH(r.updatedAt) = ?";
      params.push(parseInt(year), parseInt(month));
    } else if (year) {
      whereConditions += " AND YEAR(r.updatedAt) = ?";
      params.push(parseInt(year));
    }

    const query = `
      SELECT 
        u.firstname,
        u.lastname,
        up.userProfileID,
        COUNT(r.recipeID) as recipes
      FROM user u
      INNER JOIN userProfile up ON u.userID = up.userID
      LEFT JOIN recipe r ON up.userProfileID = r.userProfileID 
      ${whereConditions}
      GROUP BY u.userID, u.firstname, u.lastname, up.userProfileID
      HAVING COUNT(r.recipeID) > 0
      ORDER BY recipes DESC
      LIMIT 5
    `;
   
    const [results] = await db.execute(query, params);
    
    const formattedResults = results.map(item => ({
      firstname: item.firstname,
      lastname: item.lastname,
      userProfileID: item.userProfileID,
      recipes: item.recipes || 0,
      stories: 0
    }));
    
    res.json({
      success: true,
      data: formattedResults
    });
    
  } catch (error) {
    console.error('❌ Error fetching recipe contributors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipe contributors',
      message: error.message
    });
  }
});

router.get('/top-contributors-stories', async (req, res) => {
  try {
    const { year, month } = req.query;

    let whereConditions = "WHERE p.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(p.updated_at) = ? AND MONTH(p.updated_at) = ?";
      params.push(parseInt(year), parseInt(month));
    } else if (year) {
      whereConditions += " AND YEAR(p.updated_at) = ?";
      params.push(parseInt(year));
    }

    const query = `
      SELECT 
        u.firstname,
        u.lastname,
        up.userProfileID,
        COUNT(p.postID) as stories
      FROM user u
      INNER JOIN userProfile up ON u.userID = up.userID
      LEFT JOIN posts p ON up.userProfileID = p.userProfileID 
      ${whereConditions}
      GROUP BY u.userID, u.firstname, u.lastname, up.userProfileID
      HAVING COUNT(p.postID) > 0
      ORDER BY stories DESC
      LIMIT 5
    `;

    const [results] = await db.execute(query, params);
    
    const formattedResults = results.map(item => ({
      firstname: item.firstname,
      lastname: item.lastname,
      userProfileID: item.userProfileID,
      recipes: 0,
      stories: item.stories || 0
    }));
    
    res.json({
      success: true,
      data: formattedResults
    });
    
  } catch (error) {
    console.error('❌ Error fetching story contributors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch story contributors',
      message: error.message
    });
  }
});

module.exports = router;