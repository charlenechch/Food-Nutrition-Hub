const express = require("express");
const router = express.Router();
const db = require('../config/db');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// ✅ NEW: Validation + sanitization setup (added without removing anything)
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

// ✅ NEW: Joi schema for recipe create/update inputs
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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CloudINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("🔧 Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
});


// ✅✅ UPDATED ROUTE BELOW: supports ?includeAll=true for admin moderation
// GET all recipes 
router.get('/all/recipes', async (req, res) => {
  try {
    // NEW: detect query param
    const includeAll = req.query.includeAll === 'true';
    console.log(`Fetching ${includeAll ? 'ALL' : 'APPROVED'} recipes...`);

    const query = `
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
        r.chefTips,
        r.status
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      ${includeAll ? "" : "WHERE r.status = 'Approved'"}
    `;

    const [rows] = await db.query(query);

    const allRecipes = rows.map(data => {
      // Safe value getter
      const getSafe = (obj, prop) => {
        return obj && obj[prop] !== null && obj[prop] !== undefined ? obj[prop] : null;
      };

      // Handle dietaryTags
      let dietaryTags = [];
      const dietaryTagsValue = getSafe(data, 'dietaryTags');
      if (dietaryTagsValue) {
        if (typeof dietaryTagsValue === 'string') {
          dietaryTags = dietaryTagsValue.split(',').map(tag => tag.trim()).filter(Boolean);
        } else if (Array.isArray(dietaryTagsValue)) {
          dietaryTags = dietaryTagsValue;
        }
      }

      // Handle ingredients
      let ingredients = [];
      const ingredientsValue = getSafe(data, 'ingredients');
      if (ingredientsValue) {
        if (typeof ingredientsValue === 'string') {
          ingredients = ingredientsValue.split('\n').map(line => line.trim()).filter(Boolean);
        } else if (Array.isArray(ingredientsValue)) {
          ingredients = ingredientsValue;
        }
      }

      // Handle instructions
      let instructions = [];
      const instructionsValue = getSafe(data, 'instructions');
      if (instructionsValue) {
        if (typeof instructionsValue === 'string') {
          instructions = instructionsValue.split('\n').map(line => line.trim()).filter(Boolean);
        } else if (Array.isArray(instructionsValue)) {
          instructions = instructionsValue;
        }
      }

      // Handle image properly - accept both URLs and base64
      let imageUrl = '';
      const imageValue = getSafe(data, 'image');
      if (imageValue && typeof imageValue === 'string') {
        if (imageValue.startsWith('http') || imageValue.startsWith('data:image')) {
          imageUrl = imageValue;
        }
      }

      // If no image, use base64 placeholder
      if (!imageUrl) {
        imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg';
      }

      return {
        id: getSafe(data, 'id') || 0,
        name: getSafe(data, 'name') || 'Unknown Recipe',
        origin: getSafe(data, 'origin') || 'Unknown',
        difficulty: getSafe(data, 'difficulty') || 'Easy',
        prepTime: Number(getSafe(data, 'prepTime')) || 0,
        cookTime: Number(getSafe(data, 'cookTime')) || 0,
        servings: Number(getSafe(data, 'servings')) || 0,
        image: imageUrl,
        description: getSafe(data, 'description') || '',
        foodType: getSafe(data, 'foodType') || getSafe(data, 'category') || 'Other',
        dietaryTags,
        ingredients,
        instructions,
        funFact: getSafe(data, 'funFact') || '',
        chefTips: getSafe(data, 'chefTips') || '',
        status: getSafe(data, 'status') || 'Pending'
      };
    });

    console.log(`✅ Total recipes sent: ${allRecipes.length}`);
    res.json(allRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: error.message });
  }
});


// to create recipe from flat object 
function createRecipeFromFlatObject(data) {
  // Safe value getter
  const getSafe = (obj, prop) => {
    return obj && obj[prop] !== null && obj[prop] !== undefined ? obj[prop] : null;
  };
  
  // Handle dietaryTags
  let dietaryTags = [];
  const dietaryTagsValue = getSafe(data, 'dietaryTags');
  if (dietaryTagsValue) {
    if (typeof dietaryTagsValue === 'string') {
      dietaryTags = dietaryTagsValue.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag && tag !== 'null' && tag !== 'undefined');
    } else if (Array.isArray(dietaryTagsValue)) {
      dietaryTags = dietaryTagsValue;
    }
  }
  
  // Handle ingredients
  let ingredients = [];
  const ingredientsValue = getSafe(data, 'ingredients');
  if (ingredientsValue) {
    if (typeof ingredientsValue === 'string') {
      ingredients = ingredientsValue.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 0);
    } else if (Array.isArray(ingredientsValue)) {
      ingredients = ingredientsValue;
    }
  }
  
  // Handle instructions
  let instructions = [];
  const instructionsValue = getSafe(data, 'instructions');
  if (instructionsValue) {
    if (typeof instructionsValue === 'string') {
      instructions = instructionsValue.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 0);
    } else if (Array.isArray(instructionsValue)) {
      instructions = instructionsValue;
    }
  }
  
  // Handle image properly - accept both URLs and base64
  let imageUrl = '';
  const imageValue = getSafe(data, 'image');
  if (imageValue && typeof imageValue === 'string') {
    if (imageValue.startsWith('http') || imageValue.startsWith('data:image')) {
      imageUrl = imageValue;
    }
  }
  
  // If no image, use base64 placeholder
  if (!imageUrl) {
    imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg'; // Default placeholder
  }
  
  return {
    id: getSafe(data, 'id') || 0,
    name: getSafe(data, 'name') || 'Unknown Recipe',
    origin: getSafe(data, 'origin') || 'Unknown',
    difficulty: getSafe(data, 'difficulty') || 'Easy',
    prepTime: Number(getSafe(data, 'prepTime')) || 0,
    cookTime: Number(getSafe(data, 'cookTime')) || 0,
    servings: Number(getSafe(data, 'servings')) || 0,
    image: imageUrl,
    description: getSafe(data, 'description') || '',
    foodType: getSafe(data, 'foodType') || getSafe(data, 'category') || 'Other',
    dietaryTags: dietaryTags,
    ingredients: ingredients,
    instructions: instructions,
    funFact: getSafe(data, 'funFact') || '',
    chefTips: getSafe(data, 'chefTips') || ''
  };
}

// (Your /recipes/:id, /create/recipes, /update/recipes routes remain unchanged below this point)

// GET single recipe by ID 
router.get('/recipes/:id', async (req, res) => {
  // ... (unchanged)
});

// POST new recipe 
router.post('/create/recipes', async (req, res) => {
  // ... (unchanged)
});

// PUT update recipe 
router.put('/update/recipes/:id', async (req, res) => {
  // ... (unchanged)
});


// ✅ ADMIN: Update recipe approval status (Approve / Reject)
router.patch('/updateStatus/:id', async (req, res) => {
  const recipeId = req.params.id;
  const { status } = req.body; // Expected: "Approved", "Rejected", or "Pending"

  const validStatuses = ["Approved", "Rejected", "Pending"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value." });
  }

  try {
    const [result] = await db.query(
      "UPDATE recipe SET status = ? WHERE foodID = ?",
      [status, recipeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found." });
    }

    console.log(`✅ Recipe ${recipeId} status updated to ${status}`);
    res.json({ success: true, message: `Recipe marked as ${status}.` });

  } catch (error) {
    console.error("❌ Error updating recipe status:", error);
    res.status(500).json({ success: false, message: "Database update failed." });
  }
});

module.exports = router;
