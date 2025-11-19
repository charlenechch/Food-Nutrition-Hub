const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const cloudinary = require('cloudinary').v2;
const { updateUserStats } = require('./userProfile');
const { sendEmail } = require("../config/mailer");

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
// GET all recipes (for admin and public)
router.get('/all/recipes', async (req, res) => {
try {
// NEW: detect query param
const includeAll = req.query.includeAll === 'true';
console.log(`Fetching ${includeAll ? 'ALL' : 'APPROVED'} recipes...`);

  // ✅ FIXED QUERY
  // This query now starts FROM recipe (the submissions)
  // and JOINS the food info and user info.
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
      r.status,
      r.createdAt AS date,
      CONCAT(u.firstname, ' ', u.lastname) AS author
      FROM recipe r
      INNER JOIN food f ON r.foodID = f.foodID
    LEFT JOIN userProfile up ON r.userProfileID = up.userProfileID
    LEFT JOIN user u ON up.userID = u.userID
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
      author: getSafe(data, 'author') || 'Unknown Author', // ✅ FIXED
      date: getSafe(data, 'date') ? new Date(data.date).toLocaleDateString() : '—', // ✅ ADDED
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
      status: getSafe(data, 'status') || 'Pending' // This is now safe
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
    WHERE f.foodID = ? 
  `;
  
  console.log('🔍 SQL Query:', query);
  console.log('🔍 Query parameter (id):', id);
  
  const [rows] = await db.query(query, [id]);
  console.log('✅ SQL rows found:', rows.length);
  
  if (!rows || rows.length === 0) {
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
    dietaryTags: row.dietaryTags
      ? (typeof row.dietaryTags === 'string'
          ? row.dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag)
          : [])
      : [],
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
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    console.log(`📏 Image size check: ${Math.round(base64Size / 1024)} KB`);
    
    if (base64Size > maxSize) {
      return res.status(400).json({ 
        error: 'Image too large. Please use an image smaller than 10MB.' 
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

  // Force the stats to recount immediately after submission
  await updateUserStats(userID); 
  console.log(`✅ User stats recounted on recipe submission for userID: ${userID}`);
  
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

// ✅ GET recipes by user ID 
router.get("/user/:userId", async (req, res) => {
console.log('=== STARTING USER RECIPES FETCH ===');
console.log('📝 Request params:', req.params);
console.log('🔍 Query params:', req.query);

try {
  const { userId } = req.params;
  
  console.log(`📖 Fetching recipes for user ID: ${userId}`);

  // ✅ Enhanced validation
  if (!userId) {
    console.log('❌ No user ID provided');
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  // Convert to number and validate
  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId) || numericUserId <= 0) {
    console.log('❌ Invalid user ID format:', userId);
    return res.status(400).json({
      success: false,
      error: 'Valid numeric user ID is required'
    });
  }

  console.log('🔢 Numeric user ID:', numericUserId);

  // ✅ Check if user exists with better error handling
  let userCheck;
  try {
    console.log('👤 Checking if user exists...');
    [userCheck] = await db.execute(
      'SELECT userID, firstname, lastname FROM user WHERE userID = ?',
      [numericUserId]
    );
    console.log('✅ User check result:', userCheck);
  } catch (dbError) {
    console.error('❌ Database error checking user:', dbError);
    return res.status(500).json({
      success: false,
      error: 'Database error while checking user',
      details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
    });
  }

  if (userCheck.length === 0) {
    console.log('❌ User not found with ID:', numericUserId);
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // ✅ Get userProfileID
  let profileResult;
  try {
    console.log('📋 Fetching user profile...');
    [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [numericUserId]
    );
    console.log('✅ Profile result:', profileResult);
  } catch (profileError) {
    console.error('❌ Database error fetching profile:', profileError);
    return res.status(500).json({
      success: false,
      error: 'Database error while fetching user profile',
      details: process.env.NODE_ENV === 'development' ? profileError.message : undefined
    });
  }

  if (profileResult.length === 0) {
    console.log('No user profile found for user:', numericUserId);
    return res.status(200).json({
      success: true,
      message: 'No recipes found',
      data: [],
      userInfo: {
        userId: numericUserId,
        username: `${userCheck[0].firstname} ${userCheck[0].lastname}`,
        totalRecipes: 0
      }
    });
  }

  const userProfileID = profileResult[0].userProfileID;
  console.log('✅ User profile ID:', userProfileID);

  let recipes;
  try {
    console.log('🍳 Fetching recipes...');
    const recipeQuery = `
      SELECT 
        f.foodID AS id,
        f.name AS foodName,
        f.origin AS culturalOrigin,
        r.status,
        f.description AS culturalStory,
        f.image AS photos,
        r.ingredients,
        r.steps AS instructions,
        r.createdAt AS created_at,
        up.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS author,
        u.userID,
        r.cookTime,
        r.servings,
        r.DidYouKnow AS funFact,
        r.chefTips,
        f.difficulty,
        f.prepTime,
        f.foodType
      FROM recipe r
      JOIN food f ON r.foodID = f.foodID
      JOIN userProfile up ON r.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE up.userProfileID = ?
      ORDER BY r.createdAt DESC
    `;
    
    console.log('📊 Executing query:', recipeQuery);
    console.log('📋 With parameter:', userProfileID);
    
    [recipes] = await db.execute(recipeQuery, [userProfileID]);
    console.log(`✅ Found ${recipes.length} recipes`);
    
  } catch (recipeError) {
    console.error('❌ Database error fetching recipes:', recipeError);
    console.error('❌ Error details:', {
      code: recipeError.code,
      errno: recipeError.errno,
      sqlMessage: recipeError.sqlMessage
    });
    
    return res.status(500).json({
      success: false,
      error: 'Database error while fetching recipes',
      details: process.env.NODE_ENV === 'development' ? {
        message: recipeError.message,
        code: recipeError.code,
        sqlMessage: recipeError.sqlMessage
      } : undefined
    });
  }

  // ✅ Format the response data safely for RECIPES
  const formattedRecipes = recipes.map(recipe => {
    // Handle potential undefined values
    let images = [];
    try {
      if (recipe.photos && typeof recipe.photos === 'string' && recipe.photos.trim() !== '') {
        // For recipes, typically one main image, not comma-separated
        images = [recipe.photos];
      }
    } catch (photoError) {
      console.warn('⚠️ Error processing photos for recipe:', recipe.id, photoError);
    }

    // Handle ingredients and instructions 
    let ingredients = [];
    let instructions = [];
    
    if (recipe.ingredients && typeof recipe.ingredients === 'string') {
      ingredients = recipe.ingredients.split('\n').filter(line => line.trim() !== '');
    }
    
    if (recipe.instructions && typeof recipe.instructions === 'string') {
      instructions = recipe.instructions.split('\n').filter(line => line.trim() !== '');
    }

    return {
      id: recipe.id, 
      foodName: recipe.foodName || 'Untitled Recipe',
      culturalOrigin: recipe.culturalOrigin || 'Unknown Origin',
      status: (recipe.status || 'pending').toLowerCase(),
      culturalStory: recipe.culturalStory || '',
      images: images,
      ingredients: ingredients, // ✅ Include ingredients array
      instructions: instructions, // ✅ Include instructions array
      author: recipe.author || 'Unknown Author',
      userId: recipe.userID,
      userProfileID: recipe.userProfileID,
      createdAt: recipe.created_at,
      cookTime: recipe.cookTime || 0,
      servings: recipe.servings || 1,
      funFact: recipe.funFact || '',
      chefTips: recipe.chefTips || '',
      difficulty: recipe.difficulty || 'Easy',
      prepTime: recipe.prepTime || 0,
      foodType: recipe.foodType || 'Other'
    };
  });

  console.log('✅ Successfully formatted recipes:', formattedRecipes.length);
  console.log('📊 Sample recipe:', formattedRecipes.length > 0 ? {
    id: formattedRecipes[0].id,
    name: formattedRecipes[0].foodName,
    status: formattedRecipes[0].status,
    ingredientsCount: formattedRecipes[0].ingredients?.length,
    instructionsCount: formattedRecipes[0].instructions?.length
  } : 'No recipes found');

  res.status(200).json({
    success: true,
    message: `Found ${formattedRecipes.length} recipes`,
    data: formattedRecipes,
    userInfo: {
      userId: numericUserId,
      username: `${userCheck[0].firstname} ${userCheck[0].lastname}`,
      totalRecipes: formattedRecipes.length
    }
  });

} catch (error) {
  console.error('❌ UNEXPECTED ERROR in user recipes route:', error);
  console.error('❌ Error stack:', error.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      stack: error.stack
    } : undefined
  });
}
});

// PUT update recipe
router.put('/revise/recipes/:id', async (req, res) => {
console.log('🔧 START: Recipe update endpoint called');
console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));

try {
  const { id } = req.params;
  const {
    name, origin, difficulty, prepTime, image, description,
    foodType, dietaryTags, cookTime, servings, ingredients,
    instructions, funFact, chefTips, status
  } = req.body;

  console.log('🆔 Updating recipe with ID:', id);

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

  // ✅ Validate and sanitize input
  {
    const { error, value } = recipeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
    const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
    Object.assign(req.body, cleanData);
  }

  // ✅ Fetch existing data (to preserve image if not replaced)
  const [existingRows] = await db.query('SELECT image FROM food WHERE foodID = ?', [id]);
  const existingImage = existingRows.length > 0 ? existingRows[0].image : null;

  let finalImage = existingImage;
  if (image && image.trim() !== '' && image !== existingImage) {
    if (image.startsWith('data:image')) {
      console.log('📤 Uploading new image to Cloudinary...');
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'food-recipes',
          resource_type: 'image',
          timeout: 30000
        });
        finalImage = uploadResult.secure_url;
        console.log('✅ Image uploaded successfully:', finalImage);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError.message);
        finalImage = existingImage; // fallback to old image
      }
    } else if (image.startsWith('http')) {
      finalImage = image;
      console.log('✅ Using existing image URL directly');
    }
  } else {
    console.log('🖼️ Keeping existing image');
  }

  // 🥦 Update food table
  const updateFoodQuery = `
    UPDATE food 
    SET 
      name = ?, 
      origin = ?, 
      difficulty = ?, 
      prepTime = ?, 
      image = ?, 
      description = ?, 
      foodType = ?, 
      category = ?, 
      dietaryTags = ?
    WHERE foodID = ?
  `;
  const foodParams = [
    name,
    origin,
    difficulty || 'Easy',
    prepTime || 0,
    finalImage,
    description || '',
    foodType || 'Other',
    foodType || 'Other',
    Array.isArray(dietaryTags) ? dietaryTags.join(', ') : (dietaryTags || ''),
    id
  ];

  console.log('📝 Executing FOOD UPDATE with params:', foodParams);
  await db.query(updateFoodQuery, foodParams);

  // 🍳 Update recipe table
  const updateRecipeQuery = `
    UPDATE recipe 
    SET 
      ingredients = ?, 
      steps = ?, 
      cookTime = ?, 
      servings = ?, 
      DidYouKnow = ?, 
      chefTips = ?, 
      status = ?
    WHERE foodID = ? AND userProfileID = ? 
  `;
  const recipeParams = [
    Array.isArray(ingredients) ? ingredients.join('\n') : (ingredients || ''),
    Array.isArray(instructions) ? instructions.join('\n') : (instructions || ''),
    cookTime || 0,
    servings || 1,
    funFact || '',
    chefTips || '',
    status || 'Pending',
    id,
    userProfileID
  ];

  console.log('📝 Executing RECIPE UPDATE with params:', recipeParams);
  const [updateResult] = await db.query(updateRecipeQuery, recipeParams);

  if (updateResult.affectedRows === 0) {
  console.log('⚠️ No existing recipe found, inserting new recipe entry instead');
  const insertRecipeQuery = `
    INSERT INTO recipe (
      foodID, userProfileID, ingredients, steps, cookTime, servings, DidYouKnow, chefTips, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await db.query(insertRecipeQuery, [
    id,
    userProfileID, 
    Array.isArray(ingredients) ? ingredients.join('\n') : (ingredients || ''),
    Array.isArray(instructions) ? instructions.join('\n') : (instructions || ''),
    cookTime || 0,
    servings || 1,
    funFact || '',
    chefTips || '',
    status || 'Pending'
  ]);
  console.log('✅ Inserted new recipe entry for foodID:', id, 'by userProfileID:', userProfileID);
}

  console.log('✅ Recipe updated successfully');
  res.json({ message: 'Recipe updated successfully', id });

} catch (error) {
  console.error('💥 CATCH BLOCK - FULL ERROR DETAILS:', {
    message: error.message,
    code: error.code,
    errno: error.errno,
    sql: error.sql,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
    stack: error.stack
  });

  res.status(500).json({
    error: error.message,
    sqlCommand: error.sql,
    code: error.code,
    details: 'Check backend logs for full error details'
  });
}
});

// =============================
// GET feedback for a specific recipe
// =============================
router.get("/recipes/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT f.*, 
      CONCAT(u.firstname, ' ', u.lastname) AS adminName
      FROM feedback f
      LEFT JOIN user u ON f.adminID = u.userID
      WHERE f.recipeID = ?
      ORDER BY f.createdAt DESC
    `;

    const [rows] = await db.query(query, [id]);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// POST admin feedback
// =============================
router.post("/recipes/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;       // recipeID
    const { adminID, userID, message } = req.body;

    if (!adminID || !userID || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
      INSERT INTO feedback (recipeID, adminID, userID, message)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(query, [id, adminID, userID, message]);

    res.json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("❌ Error submitting feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ADMIN: Update recipe approval status (Approve / Reject)
router.patch('/updateStatus/:id', async (req, res) => {
  const recipeId = req.params.id;

  // --- MODIFICATION 1: Add logging ---
  // Log the *entire* body to see what the frontend is sending.
  // My guess is this will log: "Received body for updateStatus: {}" or "undefined"
  console.log(`Attempting to update status for ID: ${recipeId}`);
  console.log("Received body for updateStatus:", req.body);
  // ------------------------------------

  const { status } = req.body; // This is 'undefined' if the body is wrong

  const validStatuses = ["Approved", "Rejected", "Pending"];

  if (!validStatuses.includes(status)) {
    
    // --- MODIFICATION 2: Better error message ---
    // This is more helpful for debugging.
    console.log(`❌ Invalid status value received: '${status}'`);
    return res.status(400).json({ 
      success: false, 
      message: `Invalid or missing status. Received: '${status}', but expected one of: ${validStatuses.join(', ')}.` 
    });
    // -------------------------------------------
  }

  try {
    const [result] = await db.query(
      "UPDATE recipe SET status = ? WHERE foodID = ?",
      [status, recipeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found." });
    }

    // Fetch User Info & Recipe Details for Email
    const [rows] = await db.query(`
      SELECT u.email, u.firstname, f.name AS recipeName
      FROM recipe r
      JOIN userProfile up ON r.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      JOIN food f ON r.foodID = f.foodID
      WHERE r.foodID = ?
    `, [recipeId]);

    if (rows.length > 0) {
      const { email, firstname, recipeName } = rows[0];

      // Force the stats to recount
      const [userResult] = await db.query("SELECT userProfileID FROM recipe WHERE foodID = ?", [recipeId]);
      if (userResult.length > 0) {
          const userProfileID = userResult[0].userProfileID;
          const [userRow] = await db.query("SELECT userID FROM userProfile WHERE userProfileID = ?", [userProfileID]);
          const userID = userRow[0].userID;
          await updateUserStats(userID);
          console.log(`✅ User stats recounted for userProfileID: ${userProfileID}`);
      }

        // Send "Approved" Email
        if (status === "Approved") {
          const approvedHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background-color: #28a745; padding: 20px; text-align: center;">
                <h1 style="color: #fff; margin: 0;">Recipe Approved!</h1>
              </div>
              <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                <h2 style="color: #28a745;">Great news, ${firstname}!</h2>
                <p>Your recipe <strong>"${recipeName}"</strong> has been reviewed and approved by our team.</p>
                
                <div style="background-color: #f0fff4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #28a745;">
                  <p style="margin: 0;">It is now live on SarawakEats for the whole community to enjoy!</p>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://food-nutrition-hub.vercel.app/recipes" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Recipes</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                  Best regards,<br>The SarawakEats Team
                </p>
              </div>
            </div>
          `;

          // Send asynchronously
          sendEmail({
            to: email,
            subject: "🎉 Your Recipe Has Been Approved!",
            html: approvedHTML,
            text: `Great news! Your recipe "${recipeName}" has been approved and is now live.`
          });
          console.log(`📩 Approved email sent to ${email}`);
        }
      }

      // B. REJECTED Logic (✅ NEW)
      else if (status === "Rejected") {
        const feedbackText = feedback || "No specific feedback provided. Please review our content guidelines.";
        
        const rejectedHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #dc3545; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">Action Required</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #dc3545;">Hello ${firstname},</h2>
              <p>Thank you for submitting <strong>"${recipeName}"</strong>.</p>
              <p>Unfortunately, we could not approve it in its current form.</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-left: 5px solid #dc3545;">
                <strong style="color: #856404;">Admin Feedback:</strong><br/>
                <p style="margin-top: 5px; margin-bottom: 0;">${feedbackText}</p>
              </div>

              <p>Please edit your recipe to address these issues and resubmit it for review.</p>

              <div style="text-align: center; margin-top: 25px;">
                <a href="https://food-nutrition-hub.vercel.app/revise/${recipeId}" style="display: inline-block; background-color: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Edit Recipe</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;

        sendEmail({
          to: email,
          subject: "Update on your Recipe Submission",
          html: rejectedHTML,
          text: `Your recipe "${recipeName}" requires revision. Feedback: ${feedbackText}`
        });
        console.log(`📩 Rejection email sent to ${email}`);
      }

      console.log(`✅ Recipe ${recipeId} status updated to ${status}`);
      res.json({ success: true, message: `Recipe marked as ${status}.` });

    } catch (error) {
      console.error("❌ Error updating recipe status:", error);
      res.status(500).json({ success: false, message: "Database update failed." });
    }
});

module.exports = router;
