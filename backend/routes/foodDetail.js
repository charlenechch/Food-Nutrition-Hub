const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

const num = (v) => (v == null ? 0 : Number(v));

router.get('/:id', async (req, res) => {
  try {
    const foodId = req.params.id;
    console.log(`Fetching data for food ID: ${foodId}`);

    // 1. Fetch food details separately
    const foodQuery = `
      SELECT 
        f.foodID,
        f.name,
        f.origin,
        f.category,
        f.description,
        f.culturalSignificance,
        f.traditionalPreparation,
        f.commonIngredients,
        f.image,
        f.healthTips,
        f.Energy_kcal,
        f.Protein_g,
        f.Fat_g,
        f.Carbohydrates_g,
        f.Fiber_g,
        f.VitaminC_mg
      FROM food f
      WHERE f.foodID = ?
    `;

    console.log('Executing food query with ID:', foodId);
    
    const [foodRows] = await db.execute(foodQuery, [foodId]);
    console.log('Food query result:', foodRows);

    if (foodRows.length === 0) {
      console.log('No food found with ID:', foodId);
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    const food = foodRows[0];
    console.log('Raw food data from DB:', food);
    
    // 2. Fetch recipe for this specific food only
    let recipeId = null;
    let servings = null; // Set to null instead of 1 when no recipe
    
    const recipeQuery = `
      SELECT recipeID, servings 
      FROM recipe 
      WHERE foodID = ? AND status = 'Approved'
      ORDER BY recipeID 
      LIMIT 1
    `;
    
    console.log('Executing recipe query for foodID:', foodId);
    const [recipeRows] = await db.execute(recipeQuery, [foodId]);
    
    if (recipeRows.length > 0) {
      recipeId = recipeRows[0].recipeID;
      servings = num(recipeRows[0].servings);
      console.log(`✅ Found recipe for food ${foodId}: recipeID=${recipeId}, servings=${servings}`);
    } else {
      console.log(`ℹ️ No approved recipe found for food ${foodId}`);
      // servings remains null
    }
    
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

    // Instead, use the servings from recipe query
    const servingsForCalculation = servings || 1; // Use recipe servings or default to 1
    const k = 1 / servingsForCalculation;

    const Energy_kcal = num(food.Energy_kcal);
    const Protein_g = num(food.Protein_g);
    const Fat_g = num(food.Fat_g);
    const Carbohydrates_g = num(food.Carbohydrates_g);
    const Fiber_g = num(food.Fiber_g);
    const VitaminC_mg = num(food.VitaminC_mg);

    const Energy_kcal_ps = +(Energy_kcal * k).toFixed(2);
    const Protein_g_ps = +(Protein_g * k).toFixed(2);
    const Fat_g_ps = +(Fat_g * k).toFixed(2);
    const Carbohydrates_g_ps = +(Carbohydrates_g * k).toFixed(2);
    const Fiber_g_ps = +(Fiber_g * k).toFixed(2);
    const VitaminC_mg_ps = +(VitaminC_mg * k).toFixed(2);

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
      calories: Energy_kcal,
      protein: Protein_g,
      fat: Fat_g,
      carbs: Carbohydrates_g,
      image: food.image,
      healthTips: food.healthTips,
      recipeId: recipeId, // FIX: Use the recipeId from our separate query
      Fiber_g,
      VitaminC_mg,
      servings: servings, // FIX: Use the servings from our separate query
      Energy_kcal_ps,
      Protein_g_ps,
      Fat_g_ps,
      Carbohydrates_g_ps,
      Fiber_g_ps,
      VitaminC_mg_ps,
      calories_ps: Energy_kcal_ps,
      protein_ps: Protein_g_ps,
      fat_ps: Fat_g_ps,
      carbs_ps: Carbohydrates_g_ps,
    };

    console.log(`✅ Successfully formatted food: ${formattedFood.name}`);
    console.log(`✅ Recipe ID for this food: ${formattedFood.recipeId}`);
    console.log(`✅ Servings for this food: ${formattedFood.servings}`);
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