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
    
    if (!year) {
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
    
    const [results] = await db.execute(query, [year]);
    
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
    // Get current month and previous month for percentage calculations
    // const currentYear = new Date().getFullYear();
    // const currentMonth = new Date().getMonth() + 1;
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    let recipeWhere = '';
    let recipeParams = [];
    let storyWhere = '';
    let storyParams = [];

    // For recipes
    if (year && month) {
      recipeWhere = 'AND YEAR(updatedAt) = ? AND MONTH(updatedAt) = ?';
      recipeParams = [year, month];
    } else if (year) {
      recipeWhere = 'AND YEAR(updatedAt) = ?';
      recipeParams = [year];
    }

    // For stories
    if (year && month) {
      storyWhere = 'AND YEAR(updated_at) = ? AND MONTH(updated_at) = ?';
      storyParams = [year, month];
    } else if (year) {
      storyWhere = 'AND YEAR(updated_at) = ?';
      storyParams = [year];
    }

    // Query for total approved recipes
    const [totalRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM recipe 
      WHERE status = 'Approved'
        ${recipeWhere}
    `, recipeParams);

    // Query for total approved stories (posts)
    const [totalStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Approved'
        ${storyWhere}
    `, storyParams);

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
        AND MONTH(updatedAt) = ? 
        AND YEAR(updatedAt) = ?
    `, [currentMonth, currentYear]);

    // Query for previous month approved recipes
    const [previousMonthRecipesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM recipe 
      WHERE status = 'Approved' 
        AND MONTH(updatedAt) = ? 
        AND YEAR(updatedAt) = ?
    `, [previousMonth, previousYear]);

    // Query for current month approved stories
    const [currentMonthStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Approved' 
        AND MONTH(updated_at) = ? 
        AND YEAR(updated_at) = ?
    `, [currentMonth, currentYear]);

    // Query for previous month approved stories
    const [previousMonthStoriesResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'Approved' 
        AND MONTH(updated_at) = ? 
        AND YEAR(updated_at) = ?
    `, [previousMonth, previousYear]);

    // Calculate percentages
    const currentMonthRecipes = currentMonthRecipesResult[0].count;
    const previousMonthRecipes = previousMonthRecipesResult[0].count;
    const recipesPercentage = previousMonthRecipes > 0 
      ? Math.round(Math.min(((currentMonthRecipes - previousMonthRecipes) / previousMonthRecipes) * 100, 100))
      : currentMonthRecipes > 0 ? 100 : 0;

    const currentMonthStories = currentMonthStoriesResult[0].count;
    const previousMonthStories = previousMonthStoriesResult[0].count;
    const storiesPercentage = previousMonthStories > 0 
      ? Math.round(Math.min(((currentMonthStories - previousMonthStories) / previousMonthStories) * 100, 100))
      : currentMonthStories > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        totalRecipes: totalRecipesResult[0].count,
        totalStories: totalStoriesResult[0].count,
        pendingRecipes: pendingRecipesResult[0].count,
        pendingStories: pendingStoriesResult[0].count,
        percentages: {
          recipes: recipesPercentage,
          stories: storiesPercentage
        },
        currentMonth: {
          recipes: currentMonthRecipes,
          stories: currentMonthStories
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

router.get('/cultural-origin', async (req, res) => {
  try {
    const { year, month } = req.query;

    let whereConditions = "WHERE f.origin IS NOT NULL AND f.origin != '' AND r.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(r.updatedAt) = ? AND MONTH(r.updatedAt) = ?";
      params.push(year, month);
    } else if (year) {
      whereConditions += " AND YEAR(r.updatedAt) = ?";
      params.push(year);
    } else if (month) {
      whereConditions += " AND MONTH(r.updatedAt) = ?";
      params.push(month);
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

router.get('/posts-recipes-by-month', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : null;
    
    console.log(`📊 Fetching data for year: ${year}, month: ${month || 'all months'}`);
    
    if (month) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in month
      
      const query = `
        SELECT 
          'Posts' as type,
          status,
          DAY(updated_at) as day,
          COUNT(*) as count
        FROM posts 
        WHERE YEAR(updated_at) = ?
          AND MONTH(updated_at) = ?
        GROUP BY DAY(updated_at), status
        
        UNION ALL
        
        SELECT 
          'Recipes' as type,
          status,
          DAY(updatedAt) as day,
          COUNT(*) as count
        FROM recipe 
        WHERE YEAR(updatedAt) = ?
          AND MONTH(updatedAt) = ?
        GROUP BY DAY(updatedAt), status
        
        ORDER BY day, type, status
      `;
      
      const params = [year, month, year, month];
      const [results] = await db.execute(query, params);
      
      // Create data for all days in the month
      const dailyData = {};
      const allDays = Array.from({length: daysInMonth}, (_, i) => i + 1);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      allDays.forEach(day => {
        const date = new Date(year, month - 1, day);
        const dayName = dayNames[date.getDay()];
        const displayName = `${dayName} ${day}`;
        
        dailyData[displayName] = {
          day: displayName,
          posts: { approved: 0, pending: 0, rejected: 0, total: 0 },
          recipes: { approved: 0, pending: 0, rejected: 0, total: 0 },
          total: 0
        };
      });
      
      // Process query results
      results.forEach(item => {
        const date = new Date(year, month - 1, item.day);
        const dayName = dayNames[date.getDay()];
        const displayName = `${dayName} ${item.day}`;
        const status = item.status.toLowerCase();
        
        if (dailyData[displayName]) {
          if (item.type === 'Posts') {
            if (['approved', 'pending', 'rejected'].includes(status)) {
              dailyData[displayName].posts[status] = item.count;
            }
            dailyData[displayName].posts.total += item.count;
          } else if (item.type === 'Recipes') {
            if (['approved', 'pending', 'rejected'].includes(status)) {
              dailyData[displayName].recipes[status] = item.count;
            }
            dailyData[displayName].recipes.total += item.count;
          }
          
          dailyData[displayName].total = dailyData[displayName].posts.total + dailyData[displayName].recipes.total;
        }
      });
      
      const data = Object.values(dailyData);
      
      res.json({ 
        success: true, 
        data,
        viewType: 'daily',
        timeframe: {
          year: year,
          month: month,
          monthName: getMonthName(month)
        },
        totalDays: daysInMonth
      });
      
    } else {
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

// Get popular food categories
router.get('/popular-categories', async (req, res) => {
  try {
    const { year, month } = req.query;

    let whereConditions = "WHERE f.category IS NOT NULL AND f.category != '' AND r.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(r.createdAt) = ? AND MONTH(r.createdAt) = ?";
      params.push(year, month);
    } else if (year) {
      whereConditions += " AND YEAR(r.createdAt) = ?";
      params.push(year);
    } else if (month) {
      whereConditions += " AND MONTH(r.createdAt) = ?";
      params.push(month);
    }
    
    const query = `
      SELECT 
        f.category as name,
        COUNT(f.foodID) as submissions
      FROM food f
      INNER JOIN recipe r ON f.foodID = r.foodID
      ${whereConditions}
      GROUP BY f.category
      ORDER BY submissions DESC
    `;

    const [results] = await db.execute(query, params);
    
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

// Top contributors endpoints
router.get('/top-contributors-recipes', async (req, res) => {
  try {
    const { year, month } = req.query;

    let whereConditions = "AND r.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(r.createdAt) = ? AND MONTH(r.createdAt) = ?";
      params.push(year, month);
    } else if (year) {
      whereConditions += " AND YEAR(r.createdAt) = ?";
      params.push(year);
    } else if (month) {
      whereConditions += " AND MONTH(r.createdAt) = ?";
      params.push(month);
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

    let whereConditions = "AND p.status = 'Approved'";
    const params = [];
    
    if (year && month) {
      whereConditions += " AND YEAR(p.created_at) = ? AND MONTH(p.created_at) = ?";
      params.push(year, month);
    } else if (year) {
      whereConditions += " AND YEAR(p.created_at) = ?";
      params.push(year);
    } else if (month) {
      whereConditions += " AND MONTH(p.created_at) = ?";
      params.push(month);
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