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

    // Query for current month approved recipes
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

    // Calculate pending percentages
    const pendingRecipesPercentage = 15;

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
    
    const total = results.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    const data = results.map(item => ({
      name: item.name,
      value: Math.round((item.count / total) * 100),
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

// Get available years from database
router.get('/available-years', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT YEAR(createdAt) as year 
      FROM (
        SELECT createdAt FROM recipe WHERE status = 'Approved'
        UNION ALL
        SELECT created_at as createdAt FROM posts WHERE status = 'Approved'
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

router.get('/posts-recipes-by-month', async (req, res) => {
  try {
    // Use the year from query parameter, fallback to current year
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    console.log(`📊 Fetching data for year: ${year}`);
    
    const query = `
      SELECT 
        'Posts' as type,
        status,
        MONTH(created_at) as month,
        COUNT(*) as count
      FROM posts 
      WHERE YEAR(created_at) = ?
      GROUP BY MONTH(created_at), status
      
      UNION ALL
      
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
      
      monthlyData[monthName].total = monthlyData[monthName].posts.total + monthlyData[monthName].recipes.total;
    });
    
    const data = allMonths.map(monthName => monthlyData[monthName]);
    
    const totalPosts = data.reduce((sum, month) => sum + month.posts.total, 0);
    const totalRecipes = data.reduce((sum, month) => sum + month.recipes.total, 0);
    const totalCount = totalPosts + totalRecipes;
    
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
      year: year // Return the actual year used
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

// Top contributors endpoints (already fixed from previous)
router.get('/top-contributors-recipes', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.firstname,
        u.lastname,
        up.userProfileID,
        COUNT(r.recipeID) as recipes
      FROM user u
      INNER JOIN userProfile up ON u.userID = up.userID
      LEFT JOIN recipe r ON up.userProfileID = r.userProfileID AND r.status = 'Approved'
      GROUP BY u.userID, u.firstname, u.lastname, up.userProfileID
      HAVING COUNT(r.recipeID) > 0
      ORDER BY recipes DESC
      LIMIT 5
    `;
    
    const [results] = await db.execute(query);
    
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
    const query = `
      SELECT 
        u.firstname,
        u.lastname,
        up.userProfileID,
        COUNT(p.postID) as stories
      FROM user u
      INNER JOIN userProfile up ON u.userID = up.userID
      LEFT JOIN posts p ON up.userProfileID = p.userProfileID AND p.status = 'Approved'
      GROUP BY u.userID, u.firstname, u.lastname, up.userProfileID
      HAVING COUNT(p.postID) > 0
      ORDER BY stories DESC
      LIMIT 5
    `;
    
    const [results] = await db.execute(query);
    
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

// Default top contributors
router.get('/top-contributors', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.firstname,
        u.lastname,
        up.userProfileID,
        COUNT(r.recipeID) as recipes
      FROM user u
      INNER JOIN userProfile up ON u.userID = up.userID
      LEFT JOIN recipe r ON up.userProfileID = r.userProfileID AND r.status = 'Approved'
      GROUP BY u.userID, u.firstname, u.lastname, up.userProfileID
      HAVING COUNT(r.recipeID) > 0
      ORDER BY recipes DESC
      LIMIT 5
    `;
    
    const [results] = await db.execute(query);
    
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
    console.error('❌ Error fetching default contributors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contributors'
    });
  }
});

module.exports = router;