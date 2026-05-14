const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

const num = (v) => (v == null ? 0 : Number(v));

router.get('/:id', async (req, res) => {
  try {
    const foodId = req.params.id;

    // 1. Fetch food details separately
    // ADDED f.dietaryTags to this SQL query!
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
        f.dietaryTags, 
        f.image,
        f.healthTips,
        f.Energy_kcal,
        f.Protein_g,
        f.Fat_g,
        f.Carbohydrates_g,
        f.Fiber_g,
        f.VitaminC_mg,
        f.gram_per_serving
      FROM food f
      WHERE f.foodID = ?
    `;
    
    const [foodRows] = await db.execute(foodQuery, [foodId]);

    if (foodRows.length === 0) {
      console.log('No food found with ID:', foodId);
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    const food = foodRows[0];
    
    // 2. Fetch recipe for this specific food ONLY
    let recipeId = null;
    let servings = null;
    
    const recipeQuery = `
      SELECT recipeID, servings 
      FROM recipe 
      WHERE foodID = ? AND status = 'Approved'
      ORDER BY recipeID 
      LIMIT 1
    `;
    
const [recipeRows] = await db.execute(recipeQuery, [foodId]);

    if (recipeRows.length > 0) {
      recipeId = recipeRows[0].recipeID;
      servings = num(recipeRows[0].servings);
      console.log(`✅ Found recipe for food ${foodId}: recipeID=${recipeId}, servings=${servings}`);
    } else {
      console.log(`ℹ️ No approved recipe found for food ${foodId}`);
    }
    
    // Parse ingredients
    let ingredients = [];
    if (food.commonIngredients) {
      try {
        ingredients = JSON.parse(food.commonIngredients);
      } catch (e) {
        ingredients = food.commonIngredients.split(',').map(ing => ing.trim());
      }
    }

    // Calculate per-serving values
    const servingsForCalc = servings || 1;
    const k = 1 / servingsForCalc;

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
      commonIngredients: ingredients,
      dietaryTags: food.dietaryTags, // ADDED this line to send the data to the frontend!
      calories: Energy_kcal,
      protein: Protein_g,
      fat: Fat_g,
      carbs: Carbohydrates_g,
      image: food.image,
      healthTips: food.healthTips,
      recipeId: recipeId,
      Fiber_g,
      VitaminC_mg,
      gram_per_serving: num(food.gram_per_serving),
      servings: servings,
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

    console.log(`✅ Food ${foodId} - Recipe ID: ${recipeId}`);
    console.log(`✅ Food name: ${formattedFood.name}`);

    res.json({
      success: true,
      data: formattedFood
    });

  } catch (error) {
    console.error('❌ Database Error fetching food:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food details'
    });
  }
});

module.exports = router;