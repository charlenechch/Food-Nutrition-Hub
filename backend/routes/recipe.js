const express = require("express");
const router = express.Router();
const db = require("../config/db");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

// ✅ Helper to sanitize input
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

// ✅ Joi schema for recipe inputs
const recipeSchema = Joi.object({
  name: Joi.string().max(100).required(),
  origin: Joi.string().max(100).required(),
  difficulty: Joi.string().max(50).allow("", null),
  prepTime: Joi.number().integer().min(0).allow(null),
  image: Joi.string().uri().allow("", null),
  description: Joi.string().max(2000).allow("", null),
  foodType: Joi.string().max(100).allow("", null),
  dietaryTags: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string().allow("")
  ).default([]),
  cookTime: Joi.number().integer().min(0).allow(null),
  servings: Joi.number().integer().min(1).allow(null),
  ingredients: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).required(),
  instructions: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).required(),
  funFact: Joi.string().allow("", null),
  chefTips: Joi.string().allow("", null)
});

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("🔧 Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
});

// ✅ Get all approved recipes
router.get("/all/recipes", async (req, res) => {
  try {
    console.log("Fetching all recipes from DB...");

    const [rows] = await db.query(`
      SELECT 
        f.foodID AS id,
        f.name, 
        f.origin, 
        f.difficulty, 
        f.prepTime, 
        f.image, 
        f.description, 
        f.foodType,
        f.category,
        f.dietaryTags,
        r.cookTime, 
        r.servings, 
        r.ingredients, 
        r.steps AS instructions, 
        r.DidYouKnow AS funFact, 
        r.chefTips
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      WHERE r.status = 'Approved'
    `);

    console.log(`✅ Retrieved ${rows.length} recipes`);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching recipes:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get single recipe by ID
router.get("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `
      SELECT 
        f.foodID AS id,
        f.name, 
        f.origin, 
        f.difficulty, 
        f.prepTime, 
        f.image, 
        f.description, 
        f.foodType,
        f.category,
        f.dietaryTags,
        r.cookTime, 
        r.servings, 
        r.ingredients, 
        r.steps AS instructions, 
        r.DidYouKnow AS funFact, 
        r.chefTips
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      WHERE f.foodID = ? AND r.status = 'Approved'
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error fetching single recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Create new recipe
router.post("/create/recipes", async (req, res) => {
  try {
    const { error, value } = recipeSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error)
      return res.status(400).json({
        error: error.details.map((d) => d.message).join(", "),
      });

    const clean = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)])
    );

    console.log("📦 Creating new recipe:", clean.name);

    const [foodResult] = await db.query(
      `
      INSERT INTO food (name, origin, difficulty, prepTime, image, description, foodType, category, dietaryTags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clean.name,
        clean.origin,
        clean.difficulty || "Easy",
        clean.prepTime || 0,
        clean.image || "https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg",
        clean.description || "",
        clean.foodType || "Other",
        clean.foodType || "Other",
        Array.isArray(clean.dietaryTags)
          ? clean.dietaryTags.join(", ")
          : clean.dietaryTags || "",
      ]
    );

    const foodID = foodResult.insertId;
    console.log("✅ New food entry ID:", foodID);

    await db.query(
      `
      INSERT INTO recipe (foodID, ingredients, steps, cookTime, servings, DidYouKnow, chefTips, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      `,
      [
        foodID,
        Array.isArray(clean.ingredients)
          ? clean.ingredients.join("\n")
          : clean.ingredients,
        Array.isArray(clean.instructions)
          ? clean.instructions.join("\n")
          : clean.instructions,
        clean.cookTime || 0,
        clean.servings || 1,
        clean.funFact || "",
        clean.chefTips || "",
      ]
    );

    console.log("✅ Recipe created successfully.");
    res.status(201).json({ message: "Recipe created successfully", id: foodID });
  } catch (error) {
    console.error("💥 Error creating recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update existing recipe
router.put("/update/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = recipeSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error)
      return res.status(400).json({
        error: error.details.map((d) => d.message).join(", "),
      });

    const clean = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)])
    );

    console.log("🛠 Updating recipe:", id);

    await db.query(
      `
      UPDATE food
      SET name=?, origin=?, difficulty=?, prepTime=?, image=?, description=?, foodType=?, category=?, dietaryTags=?
      WHERE foodID = ?
      `,
      [
        clean.name,
        clean.origin,
        clean.difficulty || "Easy",
        clean.prepTime || 0,
        clean.image ||
          "https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg",
        clean.description || "",
        clean.foodType || "Other",
        clean.foodType || "Other",
        Array.isArray(clean.dietaryTags)
          ? clean.dietaryTags.join(", ")
          : clean.dietaryTags || "",
        id,
      ]
    );

    await db.query(
      `
      UPDATE recipe
      SET ingredients=?, steps=?, cookTime=?, servings=?, DidYouKnow=?, chefTips=?, status='Pending'
      WHERE foodID = ?
      `,
      [
        Array.isArray(clean.ingredients)
          ? clean.ingredients.join("\n")
          : clean.ingredients,
        Array.isArray(clean.instructions)
          ? clean.instructions.join("\n")
          : clean.instructions,
        clean.cookTime || 0,
        clean.servings || 1,
        clean.funFact || "",
        clean.chefTips || "",
        id,
      ]
    );

    console.log("✅ Recipe updated successfully:", id);
    res.json({ message: "Recipe updated successfully", id });
  } catch (error) {
    console.error("❌ Error updating recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Export router (critical line!)
module.exports = router;
