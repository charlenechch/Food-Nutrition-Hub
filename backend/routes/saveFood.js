const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE CHECK ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session user:', req.session.user);
  console.log('Session keys:', Object.keys(req.session));
  
  if (!req.session.user) {
    console.log('❌ No user in session - UNAUTHORIZED');
    return res.status(401).json({ 
      success: false, 
      error: 'Please log in to continue' 
    });
  }
  
  if (!req.session.user.userProfileID) {
    console.log('❌ No userProfileID in session user object');
    return res.status(400).json({
      success: false,
      error: 'User profile ID not found in session'
    });
  }
  
  console.log('✅ User authenticated:', req.session.user.userProfileID);
  next();
};

// // Check if food is saved by user
// router.get('/check/:foodId', async (req, res) => {
//   console.log('=== CHECK SAVE STATUS REQUEST ===');
//   console.log('Session:', req.session);
//   console.log('Session user:', req.session.user);
//   console.log('Query params:', req.query); 
  
//   try {
//     const { foodId } = req.params;
//     const { userProfileID } = req.query; 

//     const finalUserProfileID = req.session.user?.userProfileID || userProfileID;

//     console.log('🔍 UserProfileID sources:');
//     console.log('  - From session:', req.session.user?.userProfileID);
//     console.log('  - From query:', userProfileID);
//     console.log('  - Final to use:', finalUserProfileID);

//     if (!finalUserProfileID) {
//       console.log('❌ No userProfileID found');
//       return res.status(401).json({ 
//         success: false, 
//         error: 'Please log in to continue' 
//       });
//     }
    
//     // Validate foodId
//     if (!foodId || isNaN(foodId)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid food ID is required'
//       });
//     }

//     console.log('Checking save status - Food:', foodId, 'User:', finalUserProfileID);

//     // Check if food exists first
//     const [foodExists] = await db.execute(
//       'SELECT foodID FROM food WHERE foodID = ?',
//       [foodId]
//     );

//     if (foodExists.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Food not found'
//       });
//     }

//     const [saves] = await db.execute(
//       'SELECT saveID FROM saveFood WHERE foodID = ? AND userProfileID = ?',
//       [foodId, finalUserProfileID] 
//     );

//     console.log('💾 Save check result:', saves.length > 0 ? 'SAVED' : 'NOT SAVED');

//     res.json({
//       success: true,
//       saved: saves.length > 0
//     });
//   } catch (error) {
//     console.error('❌ ERROR CHECKING SAVE STATUS:');
//     console.error('Error message:', error.message);
//     console.error('Error stack:', error.stack);
    
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error' 
//     });
//   }
// });

// Check if food/recipe is saved by user
router.get('/check/:id', async (req, res) => {
  console.log('=== CHECK SAVE STATUS REQUEST ===');
  console.log('Session:', req.session);
  console.log('Session user:', req.session.user);
  console.log('Query params:', req.query); 
  
  try {
    const { id } = req.params;
    const { userProfileID, type = 'food' } = req.query; 

    const finalUserProfileID = req.session.user?.userProfileID || userProfileID;

    console.log('🔍 UserProfileID sources:');
    console.log('  - From session:', req.session.user?.userProfileID);
    console.log('  - From query:', userProfileID);
    console.log('  - Final to use:', finalUserProfileID);
    console.log('🔍 Check type:', type, 'ID:', id);

    if (!finalUserProfileID) {
      console.log('❌ No userProfileID found');
      return res.status(401).json({ 
        success: false, 
        error: 'Please log in to continue' 
      });
    }
    
    // Validate id
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Valid ID is required'
      });
    }

    console.log('Checking save status - Type:', type, 'ID:', id, 'User:', finalUserProfileID);

    let query, params;

    if (type === 'food') {
      // Check if food exists first
      const [foodExists] = await db.execute(
        'SELECT foodID FROM food WHERE foodID = ?',
        [id]
      );

      if (foodExists.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Food not found'
        });
      }

      // Check by foodID OR by recipeID if food has a linked recipe
      query = `
        SELECT sf.saveID 
        FROM saveFood sf 
        LEFT JOIN food f ON sf.foodID = f.foodID 
        WHERE sf.userProfileID = ? 
        AND (sf.foodID = ? OR sf.recipeID IN (SELECT recipeID FROM food WHERE foodID = ?))
      `;
      params = [finalUserProfileID, id, id];

    } else if (type === 'recipe') {
      // Check if recipe exists first
      const [recipeExists] = await db.execute(
        'SELECT recipeID FROM recipe WHERE recipeID = ?',
        [id]
      );

      if (recipeExists.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Recipe not found'
        });
      }

      // Check by recipeID OR by foodID if recipe has a linked food
      query = `
        SELECT sf.saveID 
        FROM saveFood sf 
        LEFT JOIN recipe r ON sf.recipeID = r.recipeID 
        WHERE sf.userProfileID = ? 
        AND (sf.recipeID = ? OR sf.foodID IN (SELECT foodID FROM recipe WHERE recipeID = ?))
      `;
      params = [finalUserProfileID, id, id];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Use "food" or "recipe"'
      });
    }

    const [saves] = await db.execute(query, params);
    console.log('💾 Save check result:', saves.length > 0 ? 'SAVED' : 'NOT SAVED');

    res.json({
      success: true,
      saved: saves.length > 0
    });
  } catch (error) {
    console.error('❌ ERROR CHECKING SAVE STATUS:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// // Save/Unsave a food 
// router.post('/:foodId', async (req, res) => {
//   console.log('=== SAVE FOOD REQUEST ===');
//   console.log('Session:', req.session);
//   console.log('Session user:', req.session.user);
//   console.log('Request body:', req.body); 
  
//   try {
//     const { foodId } = req.params;
//     const { userProfileID: bodyUserProfileID } = req.body; 

//     // Use userProfileID from body OR from session
//     const finalUserProfileID = bodyUserProfileID || req.session.user?.userProfileID;
    
//     console.log('🔍 UserProfileID sources:');
//     console.log('  - From body:', bodyUserProfileID);
//     console.log('  - From session:', req.session.user?.userProfileID);
//     console.log('  - Final userProfileID to use:', finalUserProfileID);

//     // Enhanced session validation - but allow body userProfileID as fallback
//     if (!req.session.user && !bodyUserProfileID) {
//       console.log('❌ NO USER IN SESSION AND NO userProfileID IN BODY - UNAUTHORIZED');
//       return res.status(401).json({ 
//         success: false, 
//         error: 'Please log in to continue' 
//       });
//     }

//     if (!finalUserProfileID) {
//       console.log('❌ userProfileID is missing from both session and body');
//       console.log('Available session user keys:', req.session.user ? Object.keys(req.session.user) : 'No user object');
//       return res.status(400).json({
//         success: false,
//         error: 'User profile ID not found'
//       });
//     }

//     console.log('✅ Final User Profile ID to use:', finalUserProfileID);
//     console.log('✅ Food ID from params:', foodId);

//     // Validate foodId
//     if (!foodId || isNaN(foodId)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid food ID is required'
//       });
//     }

//     // Check if food exists
//     console.log('🔍 Checking if food exists in database...');
//     const [foodExists] = await db.execute(
//       'SELECT foodID, name FROM food WHERE foodID = ?',
//       [foodId]
//     );

//     console.log('📊 Food exists result:', foodExists);

//     if (foodExists.length === 0) {
//       console.log('❌ Food not found in database');
//       return res.status(404).json({
//         success: false,
//         error: 'Food not found'
//       });
//     }

//     console.log('✅ Food found:', foodExists[0].foodName);

//     // Check if already saved - USE finalUserProfileID
//     console.log('🔍 Checking if already saved...');
//     const [existingSaves] = await db.execute(
//       'SELECT saveID FROM saveFood WHERE foodID = ? AND userProfileID = ?',
//       [foodId, finalUserProfileID] // Use finalUserProfileID here
//     );

//     console.log('📊 Existing saves result:', existingSaves);

//     if (existingSaves.length > 0) {
//       // If already saved, unsave (remove)
//       console.log('🗑️ Removing existing save...');
//       await db.execute(
//         'DELETE FROM saveFood WHERE foodID = ? AND userProfileID = ?',
//         [foodId, finalUserProfileID] // Use finalUserProfileID here
//       );
//       console.log('✅ Food unsaved successfully');
//       return res.json({ 
//         success: true, 
//         saved: false, 
//         message: 'Food unsaved successfully' 
//       });
//     } else {
//       // If not saved, save it
//       console.log('💾 Inserting new save...');
//       const [result] = await db.execute(
//         'INSERT INTO saveFood (foodID, userProfileID) VALUES (?, ?)',
//         [foodId, finalUserProfileID]
//       );
//       console.log('✅ Food saved successfully with ID:', result.insertId);
//       return res.json({ 
//         success: true, 
//         saved: true, 
//         message: 'Food saved successfully',
//         data: { saveID: result.insertId }
//       });
//     }
//   } catch (error) {
//     console.error('❌ ERROR SAVING FOOD:');
//     console.error('Error message:', error.message);
//     console.error('Error code:', error.code);
//     console.error('Error stack:', error.stack);
    
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     console.log('=== SAVE FOOD REQUEST END ===');
//   }
// });

// Save/Unsave a food or recipe
router.post('/:id', async (req, res) => {
  console.log('=== SAVE FOOD/RECIPE REQUEST ===');
  console.log('Session:', req.session);
  console.log('Session user:', req.session.user);
  console.log('Request body:', req.body); 
  
  try {
    const { id } = req.params;
    const { userProfileID: bodyUserProfileID, foodID, recipeID, type = 'food' } = req.body; 

    // Use userProfileID from body OR from session
    const finalUserProfileID = bodyUserProfileID || req.session.user?.userProfileID;
    
    console.log('🔍 UserProfileID sources:');
    console.log('  - From body:', bodyUserProfileID);
    console.log('  - From session:', req.session.user?.userProfileID);
    console.log('  - Final userProfileID to use:', finalUserProfileID);
    console.log('🔍 Save type:', type, 'ID:', id);

    // Enhanced session validation - but allow body userProfileID as fallback
    if (!req.session.user && !bodyUserProfileID) {
      console.log('❌ NO USER IN SESSION AND NO userProfileID IN BODY - UNAUTHORIZED');
      return res.status(401).json({ 
        success: false, 
        error: 'Please log in to continue' 
      });
    }

    if (!finalUserProfileID) {
      console.log('❌ userProfileID is missing from both session and body');
      console.log('Available session user keys:', req.session.user ? Object.keys(req.session.user) : 'No user object');
      return res.status(400).json({
        success: false,
        error: 'User profile ID not found'
      });
    }

    console.log('✅ Final User Profile ID to use:', finalUserProfileID);
    console.log('✅ ID from params:', id);

    // Validate id
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Valid ID is required'
      });
    }

    let foodIdToUse, recipeIdToUse;

    // Determine which IDs to use based on type
    if (type === 'food') {
      foodIdToUse = id;
      
      // Try to find linked recipe ID
      const [linkedRecipe] = await db.execute(
        'SELECT recipeID FROM food WHERE foodID = ?',
        [id]
      );
      recipeIdToUse = linkedRecipe.length > 0 ? linkedRecipe[0].recipeID : null;
      
      console.log('🔗 Linked recipe ID:', recipeIdToUse);

      // Check if food exists
      const [foodExists] = await db.execute(
        'SELECT foodID, name FROM food WHERE foodID = ?',
        [id]
      );

      if (foodExists.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Food not found'
        });
      }

    } else if (type === 'recipe') {
      recipeIdToUse = id;
      
      // Try to find linked food ID
      const [linkedFood] = await db.execute(
        'SELECT foodID FROM recipe WHERE recipeID = ?',
        [id]
      );
      foodIdToUse = linkedFood.length > 0 ? linkedFood[0].foodID : null;
      
      console.log('🔗 Linked food ID:', foodIdToUse);

      // Check if recipe exists
      const [recipeExists] = await db.execute(
        'SELECT recipeID, name FROM recipe WHERE recipeID = ?',
        [id]
      );

      if (recipeExists.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Recipe not found'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Use "food" or "recipe"'
      });
    }

    console.log('📊 Final IDs to save - FoodID:', foodIdToUse, 'RecipeID:', recipeIdToUse);

    // Check if already saved - check by either foodID OR recipeID
    console.log('🔍 Checking if already saved...');
    const [existingSaves] = await db.execute(
      `SELECT saveID FROM saveFood 
       WHERE userProfileID = ? 
       AND (foodID = ? OR recipeID = ?)`,
      [finalUserProfileID, foodIdToUse, recipeIdToUse]
    );

    console.log('📊 Existing saves result:', existingSaves);

    if (existingSaves.length > 0) {
      // If already saved, unsave (remove)
      console.log('🗑️ Removing existing save...');
      await db.execute(
        `DELETE FROM saveFood 
         WHERE userProfileID = ? 
         AND (foodID = ? OR recipeID = ?)`,
        [finalUserProfileID, foodIdToUse, recipeIdToUse]
      );
      console.log('✅ Item unsaved successfully');
      return res.json({ 
        success: true, 
        saved: false, 
        message: 'Item unsaved successfully' 
      });
    } else {
      // If not saved, save it with BOTH IDs
      console.log('💾 Inserting new save with foodID and recipeID...');
      const [result] = await db.execute(
        'INSERT INTO saveFood (foodID, recipeID, userProfileID) VALUES (?, ?, ?)',
        [foodIdToUse, recipeIdToUse, finalUserProfileID]
      );
      console.log('✅ Item saved successfully with ID:', result.insertId);
      return res.json({ 
        success: true, 
        saved: true, 
        message: 'Item saved successfully',
        data: { saveID: result.insertId }
      });
    }
  } catch (error) {
    console.error('❌ ERROR SAVING ITEM:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    console.log('=== SAVE ITEM REQUEST END ===');
  }
});

// // Get user's saved foods
// router.get('/user/saved', async (req, res) => {
//   try {
//     const userProfileID = req.session.user.userProfileID; // From session
    
//     const [savedFoods] = await db.execute(
//     `SELECT sf.saveID, sf.foodID, sf.userProfileID, sf.createdAt,
//             f.name as foodName, f.image as foodImage, f.prepTime as cookingTime, f.difficulty, f.Energy_kcal as rating
//         FROM saveFood sf 
//         JOIN food f ON sf.foodID = f.foodID 
//         WHERE sf.userProfileID = ? 
//         ORDER BY sf.createdAt DESC`,
//         [userProfileID]
//       );

//     res.json({
//       success: true,
//       data: savedFoods,
//       count: savedFoods.length
//     });
//   } catch (error) {
//     console.error('Error fetching saved foods:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error' 
//     });
//   }
// });

// Get user's saved foods and recipes
router.get('/user/saved', async (req, res) => {
  try {
    const userProfileID = req.session.user.userProfileID; // From session
    
    const [savedItems] = await db.execute(
      `SELECT 
        sf.saveID, 
        sf.foodID, 
        sf.recipeID,
        sf.userProfileID, 
        sf.createdAt,
        COALESCE(f.name, r.name) as name,
        COALESCE(f.image, r.image) as image,
        COALESCE(f.prepTime, r.prepTime) as prepTime,
        COALESCE(f.difficulty, r.difficulty) as difficulty,
        COALESCE(f.Energy_kcal, NULL) as calories,
        CASE 
          WHEN sf.foodID IS NOT NULL THEN 'food'
          WHEN sf.recipeID IS NOT NULL THEN 'recipe'
        END as type
      FROM saveFood sf 
      LEFT JOIN food f ON sf.foodID = f.foodID 
      LEFT JOIN recipe r ON sf.recipeID = r.recipeID 
      WHERE sf.userProfileID = ? 
      ORDER BY sf.createdAt DESC`,
      [userProfileID]
    );

    res.json({
      success: true,
      data: savedItems,
      count: savedItems.length
    });
  } catch (error) {
    console.error('Error fetching saved items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;