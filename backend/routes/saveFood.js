const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Please log in to continue' 
    });
  }
  next();
};

// Apply auth to all routes
router.use(requireAuth);

// Check if food is saved by user
router.get('/check/:foodId', async (req, res) => {
  console.log('=== CHECK SAVE STATUS REQUEST ===');
  console.log('Session user:', req.session.user);
  
  try {
    const { foodId } = req.params;

    if (!req.session.user) {
      console.log('❌ No user in session for check');
      return res.status(401).json({ 
        success: false, 
        error: 'Please log in to continue' 
      });
    }

    const userProfileID = req.session.user.userProfileID;
    console.log('Checking save status - Food:', foodId, 'User:', userProfileID);

    if (!userProfileID) {
      return res.status(400).json({
        success: false,
        error: 'User profile ID not found'
      });
    }

    // Check if food exists first
    const [foodExists] = await db.execute(
      'SELECT foodID FROM food WHERE foodID = ?',
      [foodId]
    );

    if (foodExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    const [saves] = await db.execute(
      'SELECT saveID FROM saveFood WHERE foodID = ? AND userProfileID = ?',
      [foodId, userProfileID]
    );

    console.log('Save check result:', saves.length > 0 ? 'Saved' : 'Not saved');

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

// Save/Unsave a food 
router.post('/:foodId', async (req, res) => {
  
  try {
    const { foodId } = req.params;
    
    if (!req.session.user) {
      console.log('❌ NO USER IN SESSION - UNAUTHORIZED');
      return res.status(401).json({ 
        success: false, 
        error: 'Please log in to continue' 
      });
    }

    const userProfileID = req.session.user.userProfileID;
    console.log('✅ User Profile ID from session:', userProfileID);
    console.log('✅ Food ID from params:', foodId);

    if (!userProfileID) {
      console.log('❌ userProfileID is undefined/null');
      return res.status(400).json({
        success: false,
        error: 'User profile ID not found'
      });
    }

    if (!foodId) {
      console.log('❌ foodId is undefined/null');
      return res.status(400).json({
        success: false,
        error: 'Food ID is required'
      });
    }

    // Validate food exists
    console.log('🔍 Checking if food exists in database...');
    const [foodExists] = await db.execute(
      'SELECT foodID, foodName FROM food WHERE foodID = ?',
      [foodId]
    );

    console.log('📊 Food exists result:', foodExists);

    if (foodExists.length === 0) {
      console.log('❌ Food not found in database');
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    console.log('✅ Food found:', foodExists[0].foodName);

    // Check if already saved
    console.log('🔍 Checking if already saved...');
    const [existingSaves] = await db.execute(
      'SELECT saveID FROM saveFood WHERE foodID = ? AND userProfileID = ?',
      [foodId, userProfileID]
    );

    console.log('📊 Existing saves result:', existingSaves);

    if (existingSaves.length > 0) {
      // If already saved, unsave (remove)
      console.log('🗑️ Removing existing save...');
      const deleteResult = await db.execute(
        'DELETE FROM saveFood WHERE foodID = ? AND userProfileID = ?',
        [foodId, userProfileID]
      );
      console.log('✅ Food unsaved successfully');
      return res.json({ 
        success: true, 
        saved: false, 
        message: 'Food unsaved successfully' 
      });
    } else {
      // If not saved, save it
      console.log('💾 Inserting new save...');
      const [result] = await db.execute(
        'INSERT INTO saveFood (foodID, userProfileID) VALUES (?, ?)',
        [foodId, userProfileID]
      );
      console.log('✅ Food saved successfully with ID:', result.insertId);
      return res.json({ 
        success: true, 
        saved: true, 
        message: 'Food saved successfully',
        data: { saveID: result.insertId }
      });
    }
  } catch (error) {
    console.error('❌ ERROR SAVING FOOD:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    console.log('=== SAVE FOOD REQUEST END ===');
  }
});

// Get user's saved foods
router.get('/user/saved', async (req, res) => {
  try {
    const userProfileID = req.session.user.userProfileID; // From session
    
    const [savedFoods] = await db.execute(
    `SELECT sf.saveID, sf.foodID, sf.userProfileID, sf.createdAt,
            f.name as foodName, f.image as foodImage, f.prepTime as cookingTime, f.difficulty, f.Energy_kcal as rating
        FROM saveFood sf 
        JOIN food f ON sf.foodID = f.foodID 
        WHERE sf.userProfileID = ? 
        ORDER BY sf.createdAt DESC`,
        [userProfileID]
      );

    res.json({
      success: true,
      data: savedFoods,
      count: savedFoods.length
    });
  } catch (error) {
    console.error('Error fetching saved foods:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;