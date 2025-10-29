// const express = require('express');
// const router = express.Router();
// const db = require('../config/db');

// // Check if food/recipe is saved by user
// router.get('/check/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userProfileID, type = 'food' } = req.query; 

//     const finalUserProfileID = req.session.user?.userProfileID || userProfileID;

//     console.log('🔍 UserProfileID sources:');
//     console.log('  - From session:', req.session.user?.userProfileID);
//     console.log('  - From query:', userProfileID);
//     console.log('  - Final to use:', finalUserProfileID);
//     console.log('🔍 Check type:', type, 'ID:', id);

//     if (!finalUserProfileID) {
//       console.log('❌ No userProfileID found');
//       return res.status(401).json({ 
//         success: false, 
//         error: 'Please log in to continue' 
//       });
//     }
    
//     // Validate id
//     if (!id || isNaN(id)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid ID is required'
//       });
//     }

//     console.log('Checking save status - Type:', type, 'ID:', id, 'User:', finalUserProfileID);

//     let query, params;

//     if (type === 'food') {
//       // Check by foodID only
//       query = 'SELECT saveID FROM saveFood WHERE foodID = ? AND userProfileID = ?';
//       params = [id, finalUserProfileID];

//     } else if (type === 'recipe') {
//       // Check by recipeID only  
//       query = 'SELECT saveID FROM saveFood WHERE recipeID = ? AND userProfileID = ?';
//       params = [id, finalUserProfileID];
//     } else {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid type. Use "food" or "recipe"'
//       });
//     }

//     const [saves] = await db.execute(query, params);
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

// // Save/Unsave a food or recipe
// router.post('/:id', async (req, res) => {
//   console.log('=== SAVE FOOD/RECIPE REQUEST ===');
//   console.log('Session:', req.session);
//   console.log('Session user:', req.session.user);
//   console.log('Request body:', req.body); 
  
//   try {
//     const { id } = req.params;
//     const { userProfileID: bodyUserProfileID, type = 'food' } = req.body; 

//     // Use userProfileID from body OR from session
//     const finalUserProfileID = bodyUserProfileID || req.session.user?.userProfileID;
    
//     console.log('🔍 UserProfileID sources:');
//     console.log('  - From body:', bodyUserProfileID);
//     console.log('  - From session:', req.session.user?.userProfileID);
//     console.log('  - Final userProfileID to use:', finalUserProfileID);
//     console.log('🔍 Save type:', type, 'ID:', id);

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
//     console.log('✅ ID from params:', id);

//     // Validate id
//     if (!id || isNaN(id)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid ID is required'
//       });
//     }

//     let foodIdToUse, recipeIdToUse;

//     // Determine which IDs to use based on type
//     if (type === 'food') {
//       foodIdToUse = id;
//       recipeIdToUse = null; // ✅ Set recipeID to null for food
      
//       console.log('🔗 Food ID to save:', foodIdToUse);

//       const [foodExists] = await db.execute(
//         'SELECT foodID FROM food WHERE foodID = ?',
//         [id]
//       );

//       if (foodExists.length === 0) {
//         return res.status(404).json({
//           success: false,
//           error: 'Food not found'
//         });
//       }

//     } else if (type === 'recipe') {
//       recipeIdToUse = id;
//       foodIdToUse = null; // ✅ Set foodID to null for recipe
      
//       console.log('🔗 Recipe ID to save:', recipeIdToUse);

//       // ✅ FIXED: Only check if recipe exists by ID, don't select name
//       const [recipeExists] = await db.execute(
//         'SELECT recipeID FROM recipe WHERE recipeID = ?',
//         [id]
//       );

//       if (recipeExists.length === 0) {
//         return res.status(404).json({
//           success: false,
//           error: 'Recipe not found'
//         });
//       }
//     } else {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid type. Use "food" or "recipe"'
//       });
//     }

//     console.log('📊 Final IDs to save - FoodID:', foodIdToUse, 'RecipeID:', recipeIdToUse);

//     // Check if already saved - check by either foodID OR recipeID
//     console.log('🔍 Checking if already saved...');
//     const [existingSaves] = await db.execute(
//       `SELECT saveID FROM saveFood 
//        WHERE userProfileID = ? 
//        AND (foodID = ? OR recipeID = ?)`,
//       [finalUserProfileID, foodIdToUse, recipeIdToUse]
//     );

//     console.log('📊 Existing saves result:', existingSaves);

//     if (existingSaves.length > 0) {
//       // If already saved, unsave (remove)
//       console.log('🗑️ Removing existing save...');
//       await db.execute(
//         `DELETE FROM saveFood 
//          WHERE userProfileID = ? 
//          AND (foodID = ? OR recipeID = ?)`,
//         [finalUserProfileID, foodIdToUse, recipeIdToUse]
//       );
//       console.log('✅ Item unsaved successfully');
//       return res.json({ 
//         success: true, 
//         saved: false, 
//         message: 'Item unsaved successfully' 
//       });
//     } else {
//       // If not saved, save it with BOTH IDs (one will be null)
//       console.log('💾 Inserting new save with foodID and recipeID...');
//       const [result] = await db.execute(
//         'INSERT INTO saveFood (foodID, recipeID, userProfileID) VALUES (?, ?, ?)',
//         [foodIdToUse, recipeIdToUse, finalUserProfileID]
//       );
//       console.log('✅ Item saved successfully with ID:', result.insertId);
//       return res.json({ 
//         success: true, 
//         saved: true, 
//         message: 'Item saved successfully',
//         data: { saveID: result.insertId }
//       });
//     }
//   } catch (error) {
//     console.error('❌ ERROR SAVING ITEM:');
//     console.error('Error message:', error.message);
//     console.error('Error code:', error.code);
//     console.error('Error stack:', error.stack);
    
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     console.log('=== SAVE ITEM REQUEST END ===');
//   }
// });

// // Get user's saved foods and recipes
// router.get('/user/saved', async (req, res) => {
//   try {
//     const userProfileID = req.session.user.userProfileID; // From session
    
//     const [savedItems] = await db.execute(
//       `SELECT 
//         sf.saveID, 
//         sf.foodID, 
//         sf.recipeID,
//         sf.userProfileID, 
//         sf.createdAt,
//         COALESCE(f.name, r.name) as name,
//         COALESCE(f.image, r.image) as image,
//         COALESCE(f.prepTime, r.prepTime) as prepTime,
//         COALESCE(f.difficulty, r.difficulty) as difficulty,
//         COALESCE(f.Energy_kcal, NULL) as calories,
//         CASE 
//           WHEN sf.foodID IS NOT NULL THEN 'food'
//           WHEN sf.recipeID IS NOT NULL THEN 'recipe'
//         END as type
//       FROM saveFood sf 
//       LEFT JOIN food f ON sf.foodID = f.foodID 
//       LEFT JOIN recipe r ON sf.recipeID = r.recipeID 
//       WHERE sf.userProfileID = ? 
//       ORDER BY sf.createdAt DESC`,
//       [userProfileID]
//     );

//     res.json({
//       success: true,
//       data: savedItems,
//       count: savedItems.length
//     });
//   } catch (error) {
//     console.error('Error fetching saved items:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error' 
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Check if food/recipe is saved by user (USING FOODID LINK)
router.get('/check/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userProfileID, type = 'food' } = req.query; 

    const finalUserProfileID = req.session.user?.userProfileID || userProfileID;

    console.log('🔍 Check type:', type, 'ID:', id, 'User:', finalUserProfileID);

    if (!finalUserProfileID) {
      return res.status(401).json({ 
        success: false, 
        error: 'Please log in to continue' 
      });
    }
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Valid ID is required'
      });
    }

    let foodIdToCheck = null;
    let recipeIdToCheck = null;

    // ✅ USE THE EXISTING FOODID LINK
    if (type === 'food') {
      foodIdToCheck = id;
      
      // Find recipe that links to this food
      const [recipes] = await db.execute('SELECT recipeID FROM recipe WHERE foodID = ?', [id]);
      recipeIdToCheck = recipes.length > 0 ? recipes[0].recipeID : null;
      
    } else if (type === 'recipe') {
      recipeIdToCheck = id;
      
      // Find the food ID that this recipe links to
      const [recipes] = await db.execute('SELECT foodID FROM recipe WHERE recipeID = ?', [id]);
      foodIdToCheck = recipes.length > 0 ? recipes[0].foodID : null;
    }

    console.log('🔍 Checking - FoodID:', foodIdToCheck, 'RecipeID:', recipeIdToCheck);

    // Check if either is saved
    const [saves] = await db.execute(
      `SELECT saveID FROM saveFood 
       WHERE userProfileID = ? 
       AND (foodID = ? OR recipeID = ?)`,
      [finalUserProfileID, foodIdToCheck, recipeIdToCheck]
    );

    console.log('💾 Save check result:', saves.length > 0 ? 'SAVED' : 'NOT SAVED');

    res.json({
      success: true,
      saved: saves.length > 0
    });
  } catch (error) {
    console.error('❌ ERROR CHECKING SAVE STATUS:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ✅ ADD THIS MISSING SAVE ENDPOINT (WITH SYNCHRONIZATION)
router.post('/:id', async (req, res) => {
  console.log('=== SAVE FOOD/RECIPE REQUEST ===');
  console.log('Session:', req.session);
  console.log('Session user:', req.session.user);
  console.log('Request body:', req.body); 
  
  try {
    const { id } = req.params;
    const { userProfileID: bodyUserProfileID, type = 'food' } = req.body; 

    const finalUserProfileID = bodyUserProfileID || req.session.user?.userProfileID;
    
    console.log('🔍 Save type:', type, 'ID:', id);

    if (!req.session.user && !bodyUserProfileID) {
      return res.status(401).json({ 
        success: false, 
        error: 'Please log in to continue' 
      });
    }

    if (!finalUserProfileID) {
      return res.status(400).json({
        success: false,
        error: 'User profile ID not found'
      });
    }

    console.log('✅ Final User Profile ID to use:', finalUserProfileID);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Valid ID is required'
      });
    }

    let foodIdToUse = null;
    let recipeIdToUse = null;

    // ✅ USE THE EXISTING FOODID LINK
    if (type === 'food') {
      foodIdToUse = id;
      
      // Find recipe that links to this food
      const [recipes] = await db.execute('SELECT recipeID FROM recipe WHERE foodID = ?', [id]);
      recipeIdToUse = recipes.length > 0 ? recipes[0].recipeID : null;
      
      console.log('🔗 Food ID:', foodIdToUse, 'Linked Recipe ID:', recipeIdToUse);

    } else if (type === 'recipe') {
      recipeIdToUse = id;
      
      // Find the food ID that this recipe links to
      const [recipes] = await db.execute('SELECT foodID FROM recipe WHERE recipeID = ?', [id]);
      foodIdToUse = recipes.length > 0 ? recipes[0].foodID : null;
      
      console.log('🔗 Recipe ID:', recipeIdToUse, 'Linked Food ID:', foodIdToUse);
    }

    console.log('📊 Final IDs to save - FoodID:', foodIdToUse, 'RecipeID:', recipeIdToUse);

    // Check if already saved (check by either ID)
    console.log('🔍 Checking if already saved...');
    const [existingSaves] = await db.execute(
      `SELECT saveID FROM saveFood 
       WHERE userProfileID = ? 
       AND (foodID = ? OR recipeID = ?)`,
      [finalUserProfileID, foodIdToUse, recipeIdToUse]
    );

    console.log('📊 Existing saves result:', existingSaves);

    if (existingSaves.length > 0) {
      // Unsave both food and recipe
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
      // Save both food and recipe IDs
      console.log('💾 Inserting new save with both IDs...');
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