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
        foodID, name, origin, category, difficulty, dietaryTags,
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

module.exports = router;
