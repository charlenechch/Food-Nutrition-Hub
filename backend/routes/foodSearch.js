// routes/foodSearch.js
const express = require("express");
const router = express.Router();
const { one, many, pool } = require("../config/db");

// ✅ Case-insensitive exact name search
router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Food name is required." });
    }

    const cleanName = name.trim().toLowerCase();

    // Find all foods where name matches, ignoring case
    const results = await many(
      `SELECT 
        foodID, name, origin, category, foodType, difficulty, dietaryTags,
        description, image, prepTime, culturalSignificance, traditionalPreparation,
        commonIngredients, alternative, altDescription, healthTips,
        Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg,
        likes_count, liked_by
      FROM food
      WHERE LOWER(name) = ?`,
      [cleanName]
    );

    // 🟦 No matches
    if (!results.length) {
      return res.json({ found: false, message: "No foods found." });
    }

    // 🟨 Multiple matches → Suggest
    if (results.length > 1) {
      return res.json({
        found: false,
        didYouMean: results.map((r) => r.name),
        message: "Multiple foods matched. Please choose one.",
      });
    }

    // 🟩 Exactly one match → Return full structured result
    const row = results[0];

    const nutrition = {
      calories: row.Energy_kcal,
      protein_g: row.Protein_g,
      fat_g: row.Fat_g,
      carbs_g: row.Carbohydrates_g,
      fiber_g: row.Fiber_g,
      vitaminC_mg: row.VitaminC_mg,
      portion_note: "Estimated portion: 1 medium serving (150 g)",
    };

    const tips = [];
    if (row.healthTips) {
      const ht = row.healthTips.trim();
      if (ht.startsWith("[")) {
        try {
          tips.push(...JSON.parse(ht));
        } catch {
          tips.push(ht);
        }
      } else {
        tips.push(ht);
      }
    }

    const alternatives = [];
    if (row.alternative || row.altDescription) {
      alternatives.push({
        name: row.alternative || "Alternative",
        calories: null,
        note: row.altDescription || "",
      });
    }

    return res.json({
      found: true,
      source: "text",
      food_name: row.name,
      confidence: 1.0, // per your choice
      nutrition,
      alternatives,
      tips,
      extra: {
        origin: row.origin,
        category: row.category,
        image: row.image,
        dietaryTags: row.dietaryTags,
        description: row.description,
        culturalSignificance: row.culturalSignificance,
        traditionalPreparation: row.traditionalPreparation,
        commonIngredients: row.commonIngredients,
        likes_count: row.likes_count,
      },
    });
  } catch (err) {
    console.error("❌ Food Search Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// bulk import function
router.post("/bulk-import", async (req, res) => {
  console.log("📥 [BULK IMPORT] Received request with", req.body.length, "items");

  console.log("Body type:", typeof req.body);
  console.log("Is array?", Array.isArray(req.body));
  console.log("Body keys:", Object.keys(req.body));

  try {
    let importedData;
    
    if (Array.isArray(req.body)) {
      importedData = req.body;
    } else if (req.body && typeof req.body === 'object' && req.body.data) {
      importedData = req.body.data;
    } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      for (const key in req.body) {
        if (Array.isArray(req.body[key])) {
          importedData = req.body[key];
          break;
        }
      }
      
      // If no array found, wrap the object in an array
      if (!importedData) {
        importedData = [req.body];
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid data format. Expected an array of food items." 
      });
    }
    
    console.log("Processed data length:", importedData.length);
    console.log("First item:", importedData[0]);
    
    if (!Array.isArray(importedData) || importedData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Data must be a non-empty array of food items" 
      });
    }

    console.log("🔍 Checking session for admin user...");
    console.log("Session:", req.session);
    console.log("Session user:", req.session?.user);
    
    const userID = req.session?.user?.userID;
    
    if (!userID) {
      console.log("❌ No userID found in session");
      return res.status(401).json({
        success: false,
        error: "Please log in first"
      });
    }
    
    console.log(`✅ Current admin userID: ${userID}`);
    
    // Get the admin's userProfileID from database
    let userProfileID;
    try {
      const [profileResult] = await db.execute(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );
      
      if (profileResult.length > 0) {
        userProfileID = profileResult[0].userProfileID;
        console.log(`✅ Found admin's userProfileID: ${userProfileID}`);
      } else {
        // If userProfile doesn't exist, create it
        console.log(`🛠️ Creating userProfile for admin userID: ${userID}`);
        const [insertResult] = await db.execute(
          'INSERT INTO userProfile (userID) VALUES (?)',
          [userID]
        );
        userProfileID = insertResult.insertId;
        console.log(`✅ Created userProfileID: ${userProfileID}`);
      }
    } catch (dbError) {
      console.error("❌ Error getting userProfileID:", dbError);
      return res.status(500).json({ 
        success: false, 
        error: "Error getting admin profile: " + dbError.message 
      });
    }

    const results = {
      total: importedData.length,
      foodCreated: 0,
      recipeCreated: 0,
      failed: 0,
      errors: []
    };

    // Process each food item
    for (let i = 0; i < importedData.length; i++) {
      const foodItem = importedData[i];
      
      try {
        // Validate required fields for FOOD table
        if (!foodItem.name || !foodItem.origin) {
          throw new Error("Missing name or origin");
        }

        // Validate required fields for RECIPE table
        if (!foodItem.ingredients || !foodItem.steps) {
          throw new Error("Missing ingredients or steps for recipe");
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
          // 1. Insert into FOOD table
          const foodSql = `
            INSERT INTO food 
            (
              name, origin, category, foodType, difficulty, dietaryTags, 
              description, image, prepTime, culturalSignificance, 
              traditionalPreparation, commonIngredients, alternative, 
              altDescription, healthTips, Energy_kcal, Protein_g, Fat_g, 
              Carbohydrates_g, Fiber_g, VitaminC_mg
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const foodValues = [
            foodItem.name,
            foodItem.origin,
            foodItem.category || "",
            foodItem.foodType || "Dish",
            foodItem.difficulty || "Medium",
            foodItem.dietaryTags || "",
            foodItem.description || "",
            foodItem.image || "",
            foodItem.prepTime || 0,
            foodItem.culturalSignificance || "",
            foodItem.traditionalPreparation || "",
            foodItem.commonIngredients || "",
            foodItem.alternative || "",
            foodItem.altDescription || "",
            foodItem.healthTips || "",
            foodItem.Energy_kcal || 0,
            foodItem.Protein_g || 0,
            foodItem.Fat_g || 0,
            foodItem.Carbohydrates_g || 0,
            foodItem.Fiber_g || 0,
            foodItem.VitaminC_mg || 0
          ];

          const [foodResult] = await connection.query(foodSql, foodValues);
          const foodID = foodResult.insertId;
          results.foodCreated++;

          // 2. Insert into RECIPE table with "Approved" status
          const recipeSql = `
            INSERT INTO recipe 
            (
              foodID, userProfileID, ingredients, steps, cookTime, 
              servings, DidYouKnow, chefTips, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const recipeValues = [
            foodID,
            userProfileID, // ✅ Use the actual logged-in admin's ID
            foodItem.ingredients || "",
            foodItem.steps || "",
            foodItem.cookTime || 0,
            foodItem.servings || 1,
            foodItem.DidYouKnow || "",
            foodItem.chefTips || "",
            "Approved" // Directly approved
          ];

          await connection.query(recipeSql, recipeValues);
          results.recipeCreated++;

          // Commit transaction
          await connection.commit();
          connection.release();

        } catch (dbError) {
          // Rollback on error
          await connection.rollback();
          connection.release();
          throw dbError;
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i + 1,
          name: foodItem.name || `Item ${i + 1}`,
          error: error.message
        });
        console.error(`❌ Failed to import item ${i + 1}:`, error.message);
      }
    }

    console.log(`✅ [BULK IMPORT] Completed by admin ${userID}: ${results.foodCreated} foods, ${results.recipeCreated} recipes created`);

    res.json({
      success: true,
      message: `Bulk import completed: ${results.foodCreated} foods created, ${results.recipeCreated} recipes approved`,
      results
    });

  } catch (error) {
    console.error("❌ [BULK IMPORT] Server error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server error during bulk import: " + error.message 
    });
  }
});

module.exports = router;
