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
    chefTips: getSafe(data, 'chefTips') || '',
    status: getSafe(data, 'status'),
  };
}

// GET single recipe by ID 
router.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching recipe with ID:', id);
    
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
      WHERE f.foodID = ? AND r.status = 'Approved'
    `;
    
    const result = await db.query(query, [id]);
    console.log('Raw result for single recipe:', result);
    
    const rows = Array.isArray(result) ? result : (result.rows || result);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const row = rows[0];
    console.log('✅ Raw row data received:', row);
    
    const recipe = {
      id: row.id,
      name: row.name || '',
      origin: row.origin || '',
      difficulty: row.difficulty || 'Easy',
      prepTime: row.prepTime || 0,
      cookTime: row.cookTime || 0,
      servings: row.servings || 0,
      image: row.image || '',
      description: row.description || '',
      foodType: row.foodType || row.category || 'Other',
      dietaryTags: row.dietaryTags ? 
        (typeof row.dietaryTags === 'string' ? 
          row.dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag) : 
          []) : [],
      ingredients: row.ingredients || '',
      instructions: row.instructions || '',
      funFact: row.funFact || '',
      chefTips: row.chefTips || '',
      status: row.status || 'Unknown'
    };
    
    console.log('Sending transformed recipe:', { 
      id: recipe.id, 
      name: recipe.name,
      origin: recipe.origin,
      foodType: recipe.foodType,
      status: recipe.status,
      hasImage: !!recipe.image
    });
    
    res.json(recipe);
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single recipe by ID 
// router.get('/recipes/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log('Fetching recipe with ID:', id);
    
//     const query = `
//       SELECT 
//         f.foodID AS id,
//         f.name, 
//         f.origin, 
//         f.difficulty, 
//         f.prepTime, 
//         f.image, 
//         f.description, 
//         f.foodType,
//         f.category,
//         f.dietaryTags,
//         r.cookTime, 
//         r.servings, 
//         r.ingredients, 
//         r.steps AS instructions, 
//         r.DidYouKnow AS funFact, 
//         r.chefTips,
//         r.userProfileID,
//         r.status
//       FROM food f
//       LEFT JOIN recipe r ON f.foodID = r.foodID
//       WHERE f.foodID = ? 
//     `;
    
//     const result = await db.query(query, [id]);
//     console.log('Raw result for single recipe:', result);
    
//     const rows = Array.isArray(result) ? result : (result.rows || result);
    
//     if (rows.length === 0) {
//       return res.status(404).json({ error: 'Recipe not found' });
//     }
    
//     let row = rows[0];
    
//     // DEBUG
//     console.log('Single recipe row structure:', {
//       keys: Object.keys(row),
//       hasNumericKeys: Object.keys(row).some(key => !isNaN(parseInt(key))),
//       hasNamedProps: row.id !== undefined || row.name !== undefined,
//       sampleValues: Object.values(row).slice(0, 3)
//     });
    
//     // Extract the actual recipe data
//     let recipeData = row;
    
//     // If row has numeric keys, look for the actual recipe object
//     if ((row.id === undefined || row.name === undefined) && Object.keys(row).some(key => !isNaN(key))) {
//       console.log('Looking for recipe in numeric keys...');
      
//       // Check each numeric key for a recipe-like object
//       Object.keys(row).forEach(key => {
//         const value = row[key];
//         if (value && typeof value === 'object' && value.id !== undefined && value.name !== undefined) {
//           console.log(`Found recipe at key ${key}:`, { id: value.id, name: value.name });
//           recipeData = value;
//         }
//       });
//     }
    
//     if (recipeData.id === undefined || recipeData.name === undefined) {
//       console.log('Using direct mapping for single recipe');
//       // Map numeric indices to field names based on SELECT order
//       const fieldMap = {
//         0: 'id', 1: 'name', 2: 'origin', 3: 'difficulty', 4: 'prepTime', 5: 'image',
//         6: 'description', 7: 'foodType', 8: 'category', 9: 'dietaryTags',
//         10: 'cookTime', 11: 'servings', 12: 'ingredients', 13: 'instructions',
//         14: 'funFact', 15: 'chefTips', 
//       };
      
//       const mappedData = {};
//       Object.keys(recipeData).forEach(key => {
//         const numKey = parseInt(key);
//         if (!isNaN(numKey) && fieldMap[numKey] !== undefined) {
//           mappedData[fieldMap[numKey]] = recipeData[key];
//         } else if (isNaN(numKey) && key !== 'userProfileID' && key !== 'status') {
//           // Only include non-numeric keys that are NOT the internal fields
//           mappedData[key] = recipeData[key];
//         }
//       });
//       recipeData = mappedData;
//     } else {
//       // Remove internal fields if they exist as named properties
//       const { userProfileID, status, ...cleanData } = recipeData;
//       recipeData = cleanData;
//     }
    
//     console.log('Final recipe data before transformation:', {
//       id: recipeData.id,
//       name: recipeData.name,
//       status: recipeData.status,
//       typeOfId: typeof recipeData.id,
//       typeOfName: typeof recipeData.name
//     });
    
//     const recipe = createRecipeFromFlatObject(recipeData);
    
//     console.log('Sending transformed recipe:', { 
//       id: recipe.id, 
//       name: recipe.name,
//       origin: recipe.origin,
//       status: recipe.status, 
//     });
    
//     res.json(recipe);
    
//   } catch (error) {
//     console.error('Error fetching recipe:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// POST new recipe 
router.post('/create/recipes', async (req, res) => {
  console.log('🔍 START: Recipe creation endpoint called');
  console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      name, origin, difficulty, prepTime, image, description, 
      foodType, dietaryTags, cookTime, servings, ingredients, 
      instructions, funFact, chefTips
    } = req.body;

    // ✅ NEW: Validate and sanitize (added, no removals)
    {
      const { error, value } = recipeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
      const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
      Object.assign(req.body, cleanData);
    }

    // image size validation
    if (image && image.startsWith('data:image')) {
      const base64Size = (image.length * 3) / 4; // Base64 size estimate in bytes
      const maxSize = 3 * 1024 * 1024; // 3MB limit
      
      console.log(`📏 Image size check: ${Math.round(base64Size / 1024)} KB`);
      
      if (base64Size > maxSize) {
        return res.status(400).json({ 
          error: 'Image too large. Please use an image smaller than 2MB.' 
        });
      }
    }

    console.log('📊 Request data analysis:', {
      name, 
      origin, 
      foodType,
      ingredientsType: typeof ingredients,
      instructionsType: typeof instructions,
      ingredientsIsArray: Array.isArray(ingredients),
      instructionsIsArray: Array.isArray(instructions),
      ingredientsLength: Array.isArray(ingredients) ? ingredients.length : 'N/A',
      instructionsLength: Array.isArray(instructions) ? instructions.length : 'N/A',
      imageSize: image ? (image.startsWith('data:image') ? `${Math.round((image.length * 3) / 4 / 1024)} KB` : 'URL') : 'None'
    });

    // Validate required fields
    if (!name || !origin) {
      console.log('❌ Validation failed: missing name or origin');
      return res.status(400).json({ error: 'Name and origin are required' });
    }

    // Check authentication
    if (!req.session || !req.session.user) {
      console.log('❌ Authentication failed - no session user');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userID = req.session.user.userID;

    // ✅ Get userProfileID from database
    const [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );

    if (profileResult.length === 0) {
      console.log('❌ No userProfile found for user:', userID);
      return res.status(400).json({ error: 'User profile not found' });
    }

    const userProfileID = profileResult[0].userProfileID;
    console.log('✅ User authenticated - userID:', userID, 'userProfileID:', userProfileID);

    let processedImage = image || 
    'https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg';

    // CLOUDINARY UPLOAD LOGIC with size protection
    if (image && image.startsWith('data:image')) {
      try {
        console.log('📤 Uploading image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'food-recipes',
          resource_type: 'image',
          timeout: 30000 // 30 second timeout
        });
        processedImage = uploadResult.secure_url;
        console.log('✅ Image uploaded to Cloudinary:', processedImage);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError.message);
        // Continue with default image - don't fail the entire recipe
      }
    } else if (image && image.startsWith('http')) {
      processedImage = image;
      console.log('✅ Using existing image URL');
    }
    
    console.log('🚀 About to execute FIRST INSERT (food table)');

    // Insert into food table
    const foodQuery = `
      INSERT INTO food (
        name, origin, difficulty, prepTime, image, description, 
        foodType, category, dietaryTags, commonIngredients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const foodParams = [
      name, 
      origin, 
      difficulty || 'Easy', 
      prepTime || 0, 
      processedImage, 
      description || '', 
      foodType || 'Other',
      foodType || 'Other',
      Array.isArray(dietaryTags) ? dietaryTags.join(', ') : (dietaryTags || ''),
      null
    ];
    
    console.log('📝 Executing food insert with params:', foodParams);
    
    // Try using query() instead of execute() to avoid prepared statement issues
    const [foodResult] = await db.query(foodQuery, foodParams);
    console.log('✅ Food insert successful - insertId:', foodResult.insertId);
    
    const foodId = foodResult.insertId;

    if (!foodId) {
      throw new Error('Could not retrieve the inserted food ID');
    }

    console.log('🚀 About to execute SECOND INSERT (recipe table)');

    // Insert into recipe table
    const recipeQuery = `
      INSERT INTO recipe (
        foodID, userProfileID, ingredients, steps, cookTime, servings, DidYouKnow, chefTips, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const recipeParams = [
      foodId, 
      userProfileID,
      Array.isArray(ingredients) ? ingredients.join('\n') : (ingredients || ''),
      Array.isArray(instructions) ? instructions.join('\n') : (instructions || ''),
      cookTime || 0, 
      servings || 1,
      funFact || '', 
      chefTips || '',
      'Pending' 
    ];
    
    console.log('📝 Executing recipe insert with foodID:', foodId);
    console.log('📋 Recipe params:', recipeParams);
    
    await db.query(recipeQuery, recipeParams);
    
    console.log('✅ Recipe insert successful');
    console.log('🎉 Recipe created successfully with ID:', foodId);
    
    res.status(201).json({ 
      message: 'Recipe created successfully', 
      id: foodId,
      status: 'Pending'
    });
    
  } catch (error) {
    console.error('💥 CATCH BLOCK - FULL ERROR DETAILS:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,           // show the exact failing SQL command
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    
    // Send detailed error info to frontend
    res.status(500).json({ 
      error: error.message,
      sqlCommand: error.sql,   
      code: error.code,
      details: 'Check backend logs for full error details'
    });
  }
});

// Add this route to your backend
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
