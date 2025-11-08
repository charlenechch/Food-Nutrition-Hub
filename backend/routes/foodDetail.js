const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

const num = (v) => (v == null ? 0 : Number(v));
const toSlug = (s) => String(s ?? "").trim().toLowerCase().replace(/[_\s]+/g, "-");
const parseDietaryTags = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];
  const str = String(raw).trim();
  if (str.startsWith("[")) {
    try { const arr = JSON.parse(str); return Array.isArray(arr) ? arr : []; } catch { return []; }
  }
  return str.split(",").map(s => s.trim()).filter(Boolean);
};

router.get('/:id', async (req, res) => {
  try {
    const foodId = req.params.id;
    console.log(`Fetching data for food ID: ${foodId}`);

    const foodDetailQuery = `
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
        -- totals stored on 'food'
        f.Energy_kcal,
        f.Protein_g,
        f.Fat_g,
        f.Carbohydrates_g,
        f.Fiber_g,
        f.VitaminC_mg,
        -- join 1 approved recipe (lowest recipeID) for servings
        r.servings
      FROM food f
      LEFT JOIN (
        SELECT r1.*
        FROM recipe r1
        INNER JOIN (
          SELECT foodID, MIN(recipeID) AS rid
          FROM recipe
          WHERE status = 'Approved'
          GROUP BY foodID
        ) x ON x.rid = r1.recipeID
      ) r ON r.foodID = f.foodID
      WHERE f.foodID = ?
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

    const servings = Math.max(1, num(food.servings) || 1);
    const k = 1 / servings;

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
      Fiber_g,
      VitaminC_mg,
      servings,
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