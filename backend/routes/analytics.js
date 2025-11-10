const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

// Helper function to get month name
function getMonthName(monthNumber) {  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNumber - 1];
}

// Get metrics data for the cards
router.get('/metrics', async (req, res) => {
  try {
    // Get current month and previous month for percentage calculations
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Query for total approved recipes
    const [totalRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM recipe 
      WHERE status = 'Approved'
    `);

    // Query for total approved stories (posts)
    const [totalStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Approved'
    `);

    // Query for pending recipe reviews
    const [pendingRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM recipe 
      WHERE status = 'Pending'
    `);

    // Query for pending story reviews
    const [pendingStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Pending'
    `);

    // Query for current month approved recipes (for percentage calculation)
    const [currentMonthRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM recipe 
      WHERE status = 'Approved' 
        AND MONTH(createdAt) = ? 
        AND YEAR(createdAt) = ?
    `, [currentMonth, currentYear]);

    // Query for previous month approved recipes
    const [previousMonthRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM recipe 
      WHERE status = 'Approved' 
        AND MONTH(createdAt) = ? 
        AND YEAR(createdAt) = ?
    `, [previousMonth, previousYear]);

    // Query for current month approved stories
    const [currentMonthStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Approved' 
        AND MONTH(created_at) = ? 
        AND YEAR(created_at) = ?
    `, [currentMonth, currentYear]);

    // Query for previous month approved stories
    const [previousMonthStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Approved' 
        AND MONTH(created_at) = ? 
        AND YEAR(created_at) = ?
    `, [previousMonth, previousYear]);

    // Calculate percentages
    const currentMonthRecipes = currentMonthRecipesResult[0].count;
    const previousMonthRecipes = previousMonthRecipesResult[0].count;
    const recipesPercentage = previousMonthRecipes > 0 
      ? Math.round(((currentMonthRecipes - previousMonthRecipes) / previousMonthRecipes) * 100)
      : currentMonthRecipes > 0 ? 100 : 0;

    const currentMonthStories = currentMonthStoriesResult[0].count;
    const previousMonthStories = previousMonthStoriesResult[0].count;
    const storiesPercentage = previousMonthStories > 0 
      ? Math.round(((currentMonthStories - previousMonthStories) / previousMonthStories) * 100)
      : currentMonthStories > 0 ? 100 : 0;

    // Calculate pending percentages (you can modify this logic as needed)
    const pendingRecipesPercentage = 15; // Static for now, can be calculated similarly

    res.json({
      success: true,
      data: {
        totalRecipes: totalRecipesResult[0].count,
        totalStories: totalStoriesResult[0].count,
        pendingRecipes: pendingRecipesResult[0].count,
        pendingStories: pendingStoriesResult[0].count,
        percentages: {
          recipes: recipesPercentage,
          stories: storiesPercentage,
          pendingRecipes: pendingRecipesPercentage
        },
        currentMonth: {
          recipes: currentMonthRecipes,
          stories: currentMonthStories
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

router.get('/cultural-origin', async (req, res) => {
  try {
    const query = `
      SELECT 
        origin as name,
        COUNT(foodID) as count
      FROM food
      WHERE origin IS NOT NULL AND origin != ''
      GROUP BY origin
      ORDER BY count DESC
    `;
    
    const [results] = await db.execute(query);
    
    console.log('Cultural Origin Raw Results:', results);
    
    // Get the actual total count (should be 10)
    const total = results.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    console.log('Total Recipes in Database:', total);
    
    // Calculate percentages based on actual counts
    const data = results.map(item => ({
      name: item.name,
      value: Math.round((item.count / total) * 100),
      count: item.count // Include actual count
    }));
    
    res.json({ 
      success: true, 
      data,
      totalCount: total,
      rawData: results
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

// Get available years from database
router.get('/available-years', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT YEAR(created_at) as year 
      FROM (
        SELECT created_at FROM recipe WHERE status = 'Approved'
        UNION ALL
        SELECT created_at FROM posts WHERE status = 'Approved'
      ) AS contributions
      ORDER BY year DESC
    `;
    
    const [results] = await db.execute(query);
    const years = results.map(row => row.year);
    
    console.log('📅 Available years from database:', years);
    
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

router.get('/posts-recipes-by-month', async (req, res) => {
  try {
    // Allow year parameter or use current year
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    const query = `
      -- Get posts with all statuses
      SELECT 
        'Posts' as type,
        status,
        MONTH(created_at) as month,
        COUNT(*) as count
      FROM posts 
      WHERE YEAR(created_at) = ?
      GROUP BY MONTH(created_at), status
      
      UNION ALL
      
      -- Get recipes with all statuses
      SELECT 
        'Recipes' as type,
        status,
        MONTH(createdAt) as month,
        COUNT(*) as count
      FROM recipe 
      WHERE YEAR(createdAt) = ?
      GROUP BY MONTH(createdAt), status
      
      ORDER BY month, type, status
    `;
    
    const [results] = await db.execute(query, [year, year]);
    
    const monthlyData = {};
    
    // Initialize all months with all statuses set to 0
    const allMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
    
    allMonths.forEach(monthName => {
      monthlyData[monthName] = {
        month: monthName,
        posts: { approved: 0, pending: 0, rejected: 0, total: 0 },
        recipes: { approved: 0, pending: 0, rejected: 0, total: 0 },
        total: 0
      };
    });
    
    // Process the results and populate the data
    results.forEach(item => {
      const monthName = getMonthName(item.month);  
      const status = item.status.toLowerCase();
      
      if (item.type === 'Posts') {
        if (['approved', 'pending', 'rejected'].includes(status)) {
          monthlyData[monthName].posts[status] = item.count;
        }
        monthlyData[monthName].posts.total += item.count;
      } else if (item.type === 'Recipes') {
        if (['approved', 'pending', 'rejected'].includes(status)) {
          monthlyData[monthName].recipes[status] = item.count;
        }
        monthlyData[monthName].recipes.total += item.count;
      }
      
      // Update total for the month
      monthlyData[monthName].total = monthlyData[monthName].posts.total + monthlyData[monthName].recipes.total;
    });
    
    const data = allMonths.map(monthName => monthlyData[monthName]);
    
    // Calculate totals
    const totalPosts = data.reduce((sum, month) => sum + month.posts.total, 0);
    const totalRecipes = data.reduce((sum, month) => sum + month.recipes.total, 0);
    const totalCount = totalPosts + totalRecipes;
    
    // Calculate status totals
    const postsApproved = data.reduce((sum, month) => sum + month.posts.approved, 0);
    const postsPending = data.reduce((sum, month) => sum + month.posts.pending, 0);
    const postsRejected = data.reduce((sum, month) => sum + month.posts.rejected, 0);
    
    const recipesApproved = data.reduce((sum, month) => sum + month.recipes.approved, 0);
    const recipesPending = data.reduce((sum, month) => sum + month.recipes.pending, 0);
    const recipesRejected = data.reduce((sum, month) => sum + month.recipes.rejected, 0);
    
    res.json({ 
      success: true, 
      data,
      totals: {
        posts: totalPosts,
        recipes: totalRecipes,
        total: totalCount,
        statusBreakdown: {
          posts: { approved: postsApproved, pending: postsPending, rejected: postsRejected },
          recipes: { approved: recipesApproved, pending: recipesPending, rejected: recipesRejected }
        }
      },
      year: year
    });
  } catch (error) {
    console.error('Error fetching posts and recipes data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch posts and recipes data',
      message: error.message 
    });
  }
});

// Get popular food categories
router.get('/popular-categories', async (req, res) => {
  try {
    const query = `
      SELECT 
        category as name,
        COUNT(foodID) as submissions
      FROM food
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY submissions DESC
    `;
    
    const [results] = await db.execute(query);
    
    // Format the data for frontend
    const data = results.map(item => ({
      name: item.name,
      submissions: parseInt(item.submissions)
    }));
    
    res.json({ 
      success: true, 
      data,
      totalCategories: results.length
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

// get top contributors
router.get('/top-contributors', async (req, res) => {
  try {
    const { view = 'recipes' } = req.query;
    
    console.log(`🔍 Fetching top contributors for view: ${view}`);
    
    let query = '';

    if (view === 'recipes') {
      query = `
        SELECT 
          u.firstname,
          u.lastname,
          up.userProfileID,
          COUNT(DISTINCT r.recipeID) as recipes
        FROM user u
        INNER JOIN userProfile up ON u.userID = up.userID
        INNER JOIN recipe r ON up.userProfileID = r.userProfileID AND r.status = 'Approved'
        GROUP BY u.firstname, u.lastname, up.userProfileID
        ORDER BY recipes DESC
        LIMIT 5;
      `;
    } else if (view === 'stories') {
      query = `
        SELECT 
          u.firstname,
          u.lastname,
          up.userProfileID,
          COUNT(DISTINCT p.postID) as stories
        FROM user u
        INNER JOIN userProfile up ON u.userID = up.userID
        INNER JOIN posts p ON up.userProfileID = p.userProfileID AND p.status = 'Approved'
        GROUP BY u.firstname, u.lastname, up.userProfileID
        ORDER BY stories DESC
        LIMIT 5;
      `;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid view parameter. Use "recipes" or "stories"'
      });
    }
    
    console.log('📊 Executing query:', query);
    
    const [results] = await db.execute(query);
    
    console.log(`✅ Found ${results.length} top contributors for ${view}:`, results);
    
    res.json({
      success: true,
      data: results,
      view: view
    });
    
  } catch (error) {
    console.error('❌ Error fetching top contributors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top contributors',
      message: error.message
    });
  }
});

module.exports = router;