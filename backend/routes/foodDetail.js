const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get('/:id', async (req, res) => {
  try {
    const foodId = req.params.id;
    console.log(`📥 Fetching data for food ID: ${foodId}`);

    const foodDetailQuery = `
      SELECT 
        foodID,
        name,
        origin,
        category,
        description,
        culturalSignificance,
        traditionalPreparation,
        commonIngredients,
        Energy_kcal,
        Protein_g,
        Fat_g,
        Carbohydrates_g,
        image,
        healthTips
      FROM food 
      WHERE foodID = ?
    `;

    console.log('Executing query with ID:', foodId);
    
    const [foodRows] = await db.execute(foodDetailQuery, [foodId]);
    console.log('Query result:', foodRows);

    if (foodRows.length === 0) {
      console.log('No food found with ID:', foodId);
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    const food = foodRows[0];
    console.log('Raw food data from DB:', food);
    
    // Parse ingredients - handle both JSON array and comma-separated string
    let ingredients = [];
    if (food.commonIngredients) {
      try {
        // First try to parse as JSON
        ingredients = JSON.parse(food.commonIngredients);
        console.log('Ingredients parsed as JSON:', ingredients);
      } catch (e) {
        // If JSON parsing fails, treat as comma-separated string
        console.log('Ingredients is comma-separated string, splitting...');
        ingredients = food.commonIngredients.split(',').map(ing => ing.trim());
        console.log('Ingredients after splitting:', ingredients);
      }
    } else {
      console.log('No commonIngredients found');
    }

    // Map to frontend field names
    const formattedFood = {
      id: food.foodID,
      name: food.name,
      origin: food.origin,
      category: food.category,
      description: food.description,
      culturalSignificance: food.culturalSignificance,
      traditionalPreparation: food.traditionalPreparation,
      commonIngredients: ingredients, // this will be an array
      calories: food.Energy_kcal,
      protein: food.Protein_g,
      fat: food.Fat_g,
      carbs: food.Carbohydrates_g,
      image: food.image,
      healthTips: food.healthTips
    };

    console.log(`✅ Successfully formatted food: ${formattedFood.name}`);
    console.log('Final ingredients array:', formattedFood.commonIngredients);

    res.json({
      success: true,
      data: formattedFood
    });

  } catch (error) {
    console.error('❌ Database Error fetching food:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;