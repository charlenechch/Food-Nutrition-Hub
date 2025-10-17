const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Check if food is saved by user - FIXED
router.get('/check/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    const userProfileID = req.query.userProfileID;

    console.log('Checking save status - Food:', foodId, 'User:', userProfileID);

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
    console.error('Error checking saved status:', error);
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
    const userProfileID = req.query.userProfileID;

    console.log('Save/Unsave request - Food:', foodId, 'User:', userProfileID);

    // Check if already saved
    const [existingSaves] = await db.execute(
      'SELECT saveID FROM saveFood WHERE foodID = ? AND userProfileID = ?',
      [foodId, userProfileID]
    );

    if (existingSaves.length > 0) {
      // If already saved, unsave (remove)
      await db.execute(
        'DELETE FROM saveFood WHERE foodID = ? AND userProfileID = ?',
        [foodId, userProfileID]
      );
      console.log('Food unsaved successfully');
      return res.json({ 
        success: true, 
        saved: false, 
        message: 'Food unsaved successfully' 
      });
    } else {
      // If not saved, save it
      const [result] = await db.execute(
        'INSERT INTO saveFood (foodID, userProfileID) VALUES (?, ?)',
        [foodId, userProfileID]
      );
      console.log('Food saved successfully with ID:', result.insertId);
      return res.json({ 
        success: true, 
        saved: true, 
        message: 'Food saved successfully',
        data: { saveID: result.insertId }
      });
    }
  } catch (error) {
    console.error('Error saving food:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get user's saved foods
router.get('/user/saved', async (req, res) => {
  try {
    const userProfileID = req.query.userProfileID;
    
    const [savedFoods] = await db.execute(
      `SELECT sf.saveID, sf.foodID, sf.userProfileID, f.name, f.image, f.description, f.calories 
       FROM saveFood sf 
       JOIN food f ON sf.foodID = f.foodID 
       WHERE sf.userProfileID = ? 
       ORDER BY sf.saveID DESC`,
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

// Remove the duplicate select route since we already have /check

module.exports = router;