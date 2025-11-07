const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

// Helper function to get month name
function getMonthName(monthNumber) {  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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
      WHERE origin IS NOT NULL
      GROUP BY origin
      ORDER BY count DESC
    `;
    
    const [results] = await db.execute(query);
    
    // Convert to percentage
    const total = results.reduce((sum, item) => sum + parseInt(item.count), 0);
    const data = results.map(item => ({
      name: item.name,
      value: total > 0 ? Math.round((item.count / total) * 100) : 0
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

router.get('/posts-recipes-by-month', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const query = `
      SELECT 
        'Posts' as type,
        MONTH(created_at) as month,
        COUNT(*) as count
      FROM posts 
      WHERE status = 'Approved' 
        AND YEAR(created_at) = ?
      GROUP BY MONTH(created_at)
      
      UNION ALL
      
      SELECT 
        'Recipes' as type,
        MONTH(createdAt) as month,
        COUNT(*) as count
      FROM recipe 
      WHERE status = 'Approved' 
        AND YEAR(createdAt) = ?
      GROUP BY MONTH(createdAt)
      
      ORDER BY month, type
    `;
    
    const [results] = await db.execute(query, [currentYear, currentYear]);
    
    const monthlyData = {};
    
    results.forEach(item => {
      const monthName = getMonthName(item.month);  
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = {
          month: monthName,
          posts: 0,
          recipes: 0,
          total: 0
        };
      }
      
      if (item.type === 'Posts') {
        monthlyData[monthName].posts = item.count;
      } else if (item.type === 'Recipes') {
        monthlyData[monthName].recipes = item.count;
      }
      
      monthlyData[monthName].total = monthlyData[monthName].posts + monthlyData[monthName].recipes;
    });
    
    const allMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const data = allMonths.map(monthName => {
      return monthlyData[monthName] || {
        month: monthName,
        posts: 0,
        recipes: 0,
        total: 0
      };
    });
    
    const totalPosts = data.reduce((sum, month) => sum + month.posts, 0);
    const totalRecipes = data.reduce((sum, month) => sum + month.recipes, 0);
    const totalCount = totalPosts + totalRecipes;
    
    res.json({ 
      success: true, 
      data,
      totals: {
        posts: totalPosts,
        recipes: totalRecipes,
        total: totalCount
      },
      year: currentYear
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
      LIMIT 6
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

// Get top contributors
router.get('/top-contributors', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.firstname,
        u.lastname,
        up.userProfileID,
        COUNT(r.recipeID) as submissions,
        COUNT(DISTINCT r.foodID) as recipes
      FROM user u
      INNER JOIN userProfile up ON u.userID = up.userID
      INNER JOIN recipe r ON up.userProfileID = r.userProfileID
      WHERE r.status = 'Approved'
      GROUP BY u.userID, u.firstname, u.lastname, up.userProfileID
      ORDER BY submissions DESC
      LIMIT 5
    `;
    
    const [results] = await db.execute(query);
    
    // Format the data for frontend
    const data = results.map(item => ({
      name: `${item.firstname} ${item.lastname}`,
      submissions: parseInt(item.submissions),
      recipes: parseInt(item.recipes)
    }));
    
    res.json({ 
      success: true, 
      data,
      totalContributors: results.length
    });
  } catch (error) {
    console.error('Error fetching top contributors data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch top contributors data',
      message: error.message 
    });
  }
});

module.exports = router;