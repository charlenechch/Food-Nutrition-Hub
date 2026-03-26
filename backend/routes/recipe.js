const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const cloudinary = require('cloudinary').v2;
const { updateUserStats } = require('./userProfile');
const { sendEmail } = require("../config/mailer");
const { createNotification, isEmailNotificationsEnabled } = require("./notifications");
const { logActivity } = require("./adminActivityLog");

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
category: Joi.string().max(100).allow("", null),
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


// GET all recipes (for admin and public)
router.get('/all/recipes', async (req, res) => {
try {

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
      r.description, 
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
      r.updatedAt,
      CONCAT(u.firstname, ' ', u.lastname) AS author,
      up.avatar AS authorImage,
      up.userProfileID AS authorId
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
      author: getSafe(data, 'author') || 'Unknown Author', 
      authorImage: getSafe(data, 'authorImage') || null,
      authorId: getSafe(data, 'authorId') || null,
      date: getSafe(data, 'date') ? new Date(data.date).toLocaleDateString() : '—',
      updatedAt: getSafe(data, 'updatedAt') ? new Date(data.updatedAt).toISOString() : null,
      origin: getSafe(data, 'origin') || 'Unknown',
      difficulty: getSafe(data, 'difficulty') || 'Easy',
      prepTime: Number(getSafe(data, 'prepTime')) || 0,
      cookTime: Number(getSafe(data, 'cookTime')) || 0,
      servings: Number(getSafe(data, 'servings')) || 0,
      image: imageUrl,
      description: getSafe(data, 'description') || '',
      category: getSafe(data, 'category') || 'Other',
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
  category: getSafe(data, 'category') || 'Other',
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
  console.log('Fetching recipe for ID (Recipe or Food):', id); 
  
  // FIXED: Changed the WHERE clause to check BOTH recipeID and foodID.
  // Added ORDER BY to ensure it grabs the newest submission if there are multiple.
  const query = `
    SELECT 
      f.foodID AS foodId,  
      r.recipeID AS recipeID,   
      f.name, 
      f.origin, 
      f.difficulty, 
      f.prepTime, 
      f.image, 
      r.description, 
      f.category,
      f.dietaryTags,
      r.cookTime, 
      r.servings, 
      r.ingredients, 
      r.steps AS instructions, 
      r.DidYouKnow AS funFact, 
      r.chefTips,
      r.status,
      r.admin_feedback,
      CONCAT(u.firstname, ' ', u.lastname) AS authorName,
      u.email AS authorEmail
    FROM recipe r  
    LEFT JOIN food f ON r.foodID = f.foodID  
    LEFT JOIN userProfile up ON r.userProfileID = up.userProfileID
    LEFT JOIN user u ON up.userID = u.userID
    WHERE r.recipeID = ? OR f.foodID = ?
    ORDER BY r.createdAt DESC
    LIMIT 1
  `;
  
  // Pass the ID twice so it checks both conditions
  const [rows] = await db.query(query, [id, id]);  
  
  if (!rows || rows.length === 0) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  const row = rows[0];
  
  const recipe = {
    id: row.recipeID,  
    foodId: row.foodID,
    name: row.name || '',
    origin: row.origin || '',
    difficulty: row.difficulty || 'Easy',
    prepTime: row.prepTime || 0,
    cookTime: row.cookTime || 0,
    servings: row.servings || 0,
    image: row.image || '',
    description: row.description || '',
    category: row.category || 'Other',
    dietaryTags: row.dietaryTags
      ? (typeof row.dietaryTags === 'string'
          ? row.dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag)
          : [])
      : [],
    ingredients: row.ingredients || '',
    instructions: row.instructions || '',
    funFact: row.funFact || '',
    chefTips: row.chefTips || '',
    status: row.status || 'Unknown',
    adminFeedback: row.admin_feedback || '',
    authorName: row.authorName || 'Unknown Author',
    authorEmail: row.authorEmail || 'N/A',
    createdAt: row.createdAt
  };
  
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
    category, dietaryTags, cookTime, servings, ingredients, 
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
    category,
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
      category, dietaryTags, commonIngredients
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const foodParams = [
    name, 
    origin, 
    difficulty || 'Easy', 
    prepTime || 0, 
    processedImage, 
    description || '', 
    category || 'Other',
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
      foodID, userProfileID, ingredients, steps, cookTime, servings, DidYouKnow, chefTips, status, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    'Pending',
    description || ''
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
        r.recipeID,
        f.name AS foodName,
        f.origin AS culturalOrigin,
        r.status,
        r.admin_feedback,
        r.description AS description,
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
        f.category,
        f.dietaryTags
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
      recipeID: recipe.recipeID,
      foodName: recipe.foodName || 'Untitled Recipe',
      culturalOrigin: recipe.culturalOrigin || 'Unknown Origin',
      status: (recipe.status || 'pending').toLowerCase(),
      adminFeedback: recipe.admin_feedback || null,
      description: recipe.description || '',
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
      category: recipe.category || 'Other',
      dietaryTags: recipe.dietaryTags || '',
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

    // Check if the ID exists as a recipeID
    const [checkRecipe] = await db.query(
      'SELECT recipeID FROM recipe WHERE recipeID = ?',
      [id]
    );
    
    // Check if it exists as a foodID
    const [checkFood] = await db.query(
      'SELECT foodID FROM food WHERE foodID = ?',
      [id]
    );
    
    if (checkRecipe.length === 0 && checkFood.length > 0) {
      console.log('⚠️⚠️⚠️ CRITICAL: Received foodID instead of recipeID!');
      console.log(`Expected recipeID but got foodID: ${id}`);
      console.log(`The correct recipeID is likely ${id - 1} or check your database`);
      
      return res.status(400).json({ 
        error: 'Invalid recipe ID. Please use recipeID, not foodID.',
        receivedId: id,
        idType: 'foodID',
        message: `You passed foodID ${id} but should pass recipeID. Check your database for the correct recipeID.`
      });
    }

    const {
      name, origin, difficulty, prepTime, image, description,
      category, dietaryTags, cookTime, servings, ingredients,
      instructions, funFact, chefTips, status
    } = req.body;

    console.log('🆔 Updating recipe with ID:', id);

    // Check authentication
    if (!req.session || !req.session.user) {
      console.log('❌ Authentication failed - no session user');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userID = req.session.user.userID;

    // Get userProfileID from database
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

    // Verify that this recipe belongs to this user and get the foodID
    const [recipeCheck] = await db.query(
      'SELECT recipeID, foodID FROM recipe WHERE recipeID = ? AND userProfileID = ?',
      [id, userProfileID]
    );

    if (recipeCheck.length === 0) {
      console.log('❌ Recipe not found or does not belong to user');
      return res.status(403).json({ error: 'You do not have permission to edit this recipe' });
    }

    const foodID = recipeCheck[0].foodID;  
    console.log('✅ Found recipe - recipeID:', id, 'foodID:', foodID);

    // Validate and sanitize input
    const { error, value } = recipeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ error: error.details.map(d => d.message).join(", ") });
    }
    const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
    Object.assign(req.body, cleanData);

    // Fetch existing data using foodID, NOT recipeID
    const [existingRows] = await db.query('SELECT image FROM food WHERE foodID = ?', [foodID]);
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

    // Update food table 
    const updateFoodQuery = `
      UPDATE food 
      SET 
        name = ?, 
        origin = ?, 
        difficulty = ?, 
        prepTime = ?, 
        image = ?, 
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
      Array.isArray(category) ? category.join(', ') : (category || 'Other'),
      Array.isArray(dietaryTags) ? dietaryTags.join(', ') : (dietaryTags || ''),
      foodID  
    ];

    console.log('📝 Executing FOOD UPDATE with params:', foodParams);
    await db.query(updateFoodQuery, foodParams);

    // Update recipe table using recipeID
    const updateRecipeQuery = `
      UPDATE recipe 
      SET 
        ingredients = ?, 
        steps = ?, 
        cookTime = ?, 
        servings = ?, 
        DidYouKnow = ?, 
        chefTips = ?, 
        status = ?,
        description = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE recipeID = ? AND userProfileID = ?
    `;
    const recipeParams = [
      Array.isArray(ingredients) ? ingredients.join('\n') : (ingredients || ''),
      Array.isArray(instructions) ? instructions.join('\n') : (instructions || ''),
      cookTime || 0,
      servings || 1,
      funFact || '',
      chefTips || '',
      status || 'Pending',
      description || '',
      id,
      userProfileID
    ];

    console.log('📝 Executing RECIPE UPDATE with params:', recipeParams);
    const [updateResult] = await db.query(updateRecipeQuery, recipeParams);

    if (updateResult.affectedRows === 0) {
      console.log('⚠️ Recipe not found during update, inserting new recipe entry instead');
      const insertRecipeQuery = `
        INSERT INTO recipe (
          foodID, userProfileID, ingredients, steps, cookTime, servings, DidYouKnow, chefTips, status, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await db.query(insertRecipeQuery, [
        foodID, 
        userProfileID, 
        Array.isArray(ingredients) ? ingredients.join('\n') : (ingredients || ''),
        Array.isArray(instructions) ? instructions.join('\n') : (instructions || ''),
        cookTime || 0,
        servings || 1,
        funFact || '',
        chefTips || '',
        status || 'Pending',
        description || ''
      ]);
      console.log('✅ Inserted new recipe entry for foodID:', foodID, 'by userProfileID:', userProfileID);
    }

    console.log('✅ Recipe updated successfully');
    res.json({ message: 'Recipe updated successfully', id: foodID });

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

// Admin update recipe approval status (Approve / Reject)
router.patch('/updateStatus/:id', async (req, res) => {
  const recipeId = req.params.id;
  console.log(`Attempting to update status for ID: ${recipeId}`);

  const { status, feedback } = req.body;
  const validStatuses = ["Approved", "Rejected", "Pending"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid status. Received: '${status}'` 
    });
  }

  // Coerce feedback into a string and trim whitespace
  const inputFeedback = String(feedback || '').trim();

  // Define the variable for the database (NULL if empty)
  const dbFeedbackValue = inputFeedback.length > 0 ? inputFeedback : null;

  // Define the variable for email display (includes the default fallback)
  const rejectionContent = inputFeedback.length > 0 
                           ? inputFeedback 
                           : "No specific feedback provided.";

  try {
    // Update recipe status
    const [result] = await db.query(
      "UPDATE recipe SET status = ?, admin_feedback = ? WHERE foodID = ?",
      [status, dbFeedbackValue, recipeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found." });
    }

    const adminID = req.session.user.userID;
    const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
    const actionType = status === "Approved" ? "recipe_approved" : "recipe_rejected";
    await logActivity(db, adminID, adminName, actionType, `${status} recipe for food ID ${recipeId}.`);

    // Fetch User Info & Recipe Details
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

      // Force stats recount
      let userID = null;
      const [userResult] = await db.query("SELECT userProfileID FROM recipe WHERE foodID = ?", [recipeId]);
      if (userResult.length > 0) {
          const userProfileID = userResult[0].userProfileID;
          const [userRow] = await db.query("SELECT userID FROM userProfile WHERE userProfileID = ?", [userProfileID]);
          userID = userRow[0].userID;
          await updateUserStats(userID);
      }

      // REJECTED Logic
      if (status === "Rejected") {
        
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
                <p style="margin-top: 5px; margin-bottom: 0;">${rejectionContent}</p>
              </div>

              <p>Please update your recipe based on this feedback so we can reconsider it for approval.</p>

              <p><a href="https://sarawakeats.site/revise/${recipeId}">Edit your recipe</a></p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;

        const rejectionEmailEnabled = await isEmailNotificationsEnabled(userID, db);
        if (rejectionEmailEnabled) {
            sendEmail({
              to: email,
              subject: `Action Required: Please Revise "${recipeName}"`,
              html: rejectedHTML,
              text: `Your recipe "${recipeName}" has been rejected. Admin Feedback: ${rejectionContent}`
            });
            console.log(`📩 Recipe rejection email sent to ${email}`);
        } else {
            console.log(`📭 Recipe rejection email skipped (notifications disabled) for userID: ${userID}`);
        }
        await createNotification(userID, "recipe_rejected", `Your recipe "${recipeName}" was not approved. Admin feedback: ${rejectionContent}`, db);
        console.log(`🔔 Rejection notification created for userID: ${userID}`);
      }
    }

    res.json({ success: true, message: `Recipe marked as ${status}.` });

  } catch (error) {
    console.error("❌ Error updating recipe status:", error);
    res.status(500).json({ success: false, message: "Database update failed." });
  }
});

// =============================
// PATCH: Send Admin Feedback Only + Smart Email Notification
// =============================
router.patch('/sendFeedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = req.body.feedback || req.body.message;

    if (!feedback) {
      return res.status(400).json({ error: "Feedback content is required." });
    }

    // 1. Update database
    const query = "UPDATE recipe SET admin_feedback = ? WHERE foodID = ?";
    const [result] = await db.query(query, [feedback, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    // 2. Fetch Info AND Status
    const [rows] = await db.query(`
      SELECT u.email, u.firstname, f.name AS recipeName, r.status, u.userID
      FROM recipe r
      JOIN userProfile up ON r.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      JOIN food f ON r.foodID = f.foodID
      WHERE r.foodID = ?
    `, [id]);

    // 3. Construct Smart Email
    if (rows.length > 0) {
      const { email, firstname, recipeName, status, userID } = rows[0];

      let subjectLine = "";
      let emailBodyHTML = "";

      // 🚨 SCENARIO A: Rejected (Urgent Red)
      if (status === "Rejected") {
        subjectLine = `Action Required: Please Revise "${recipeName}"`;
        emailBodyHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #dc3545; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">Revision Requested</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #dc3545;">Hello ${firstname},</h2>
              <p>We have reviewed your rejected recipe <strong>"${recipeName}"</strong> and have new feedback.</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-left: 5px solid #dc3545;">
                <strong style="color: #856404;">Action Required:</strong><br/>
                <p style="margin-top: 5px; margin-bottom: 0;">${feedback}</p>
              </div>

              <p>Please update your recipe based on this feedback.</p>

              <p><a href="https://sarawakeats.site/revise/${id}">Edit and resubmit your recipe</a></p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;
      } 
      // ⚠️ SCENARIO B: Approved/Pending (Standard Yellow)
      else {
        subjectLine = `New Feedback on "${recipeName}"`;
        emailBodyHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #ffc107; padding: 20px; text-align: center;">
              <h1 style="color: #000; margin: 0;">New Feedback Received</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #333;">Hello ${firstname},</h2>
              <p>You have received a new note regarding your recipe <strong>"${recipeName}"</strong>.</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-left: 5px solid #ffc107;">
                <strong style="color: #856404;">Admin Message:</strong><br/>
                <p style="margin-top: 5px; margin-bottom: 0;">${feedback}</p>
              </div>

              <p><a href="https://sarawakeats.site/revise/${id}">View your recipe</a></p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;
      }

      const feedbackEmailEnabled = await isEmailNotificationsEnabled(userID, db);
      if (feedbackEmailEnabled) {
          await sendEmail({
            to: email,
            subject: subjectLine,
            html: emailBodyHTML,
            text: `Feedback on "${recipeName}": ${feedback}`
          });
          console.log(`📩 Recipe feedback email sent to ${email}`);
      } else {
          console.log(`📭 Recipe feedback email skipped (notifications disabled) for userID: ${userID}`);
      }
      const notifMessage = status === "Rejected"
          ? `Your recipe "${recipeName}" has new admin feedback: ${feedback}`
          : `You have received a new note on your recipe "${recipeName}": ${feedback}`;
      await createNotification(userID, "recipe_feedback", notifMessage, db);
      console.log(`🔔 Recipe feedback notification created for userID: ${userID}`);
    }

    res.json({ success: true, message: "Feedback sent successfully." });

  } catch (error) {
    console.error("❌ Error sending feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE RECIPE (Admin Only)
router.delete("/admin/delete/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [ADMIN] Deleting recipe ID: ${id}`);

  // 1. Security Check: Ensure user is Admin
  if (req.session?.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized: Admin access required." });
  }

  try {
    // 2. Delete from 'recipe' table first (Child table)
    await db.query("DELETE FROM recipe WHERE foodID = ?", [id]);

    // 3. Delete from 'food' table next (Parent table)
    const [result] = await db.query("DELETE FROM food WHERE foodID = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found." });
    }

    console.log(`✅ [ADMIN] Recipe ${id} deleted successfully.`);
    res.json({ success: true, message: "Recipe deleted successfully." });

  } catch (error) {
    console.error(`❌ [ADMIN] Error deleting recipe ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during deletion.",
      error: error.message 
    });
  }
});

// recipe navigation
// GET recipe by food ID
router.get('/byFood/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    console.log('🔍 Looking for recipe by food ID:', foodId);

    const query = `
      SELECT 
        r.recipeID AS id,  
        f.foodID,  
        f.name AS foodName,
        r.status
      FROM recipe r
      JOIN food f ON r.foodID = f.foodID
      WHERE f.foodID = ?
      LIMIT 1
    `;

    const [rows] = await db.query(query, [foodId]);

    if (rows.length === 0) {
      console.log('❌ No recipe found for food ID:', foodId);
      return res.json({
        success: false,
        message: 'No recipe found for this food'
      });
    }

    console.log('✅ Found recipe:', rows[0]);
    res.json({
      success: true,
      data: rows[0]  
    });

  } catch (error) {
    console.error('Error fetching recipe by food:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================
// GET Approved recipes that need food details
// =============================
router.get('/pending-food-details', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.recipeID as id,
        r.status,
        r.createdAt,
        f.foodID,
        f.name as foodName,
        f.origin,
        f.category,
        f.description,
        f.culturalSignificance,
        f.traditionalPreparation,
        f.healthTips,
        f.Energy_kcal,
        f.Protein_g,
        f.Carbohydrates_g,
        f.Fat_g,
        f.Fiber_g,
        f.VitaminC_mg,
        f.image,
        f.commonIngredients,
        f.dietaryTags,
        f.alternative,
        f.altDescription,
        CONCAT(u.firstname, ' ', u.lastname) AS author
      FROM recipe r
      INNER JOIN food f ON r.foodID = f.foodID
      LEFT JOIN userProfile up ON r.userProfileID = up.userProfileID
      LEFT JOIN user u ON up.userID = u.userID
      WHERE r.status = 'Approved'
      AND (
        f.origin IS NULL 
        OR f.origin = '' 
        OR f.Energy_kcal IS NULL 
        OR f.Energy_kcal = 0
        OR f.culturalSignificance IS NULL 
        OR f.culturalSignificance = ''
      )
      ORDER BY r.createdAt DESC
    `;

    const [rows] = await db.query(query);
    
    const recipes = rows.map(recipe => ({
      id: recipe.id,
      name: recipe.foodName,
      author: recipe.author || 'Unknown Author',
      status: recipe.status,
      hasFoodDetails: recipe.origin ? true : false,
      foodId: recipe.foodID
    }));

    console.log(`📋 Found ${recipes.length} approved recipes needing food details`);
    res.json(recipes);

  } catch (error) {
    console.error('Error fetching recipes needing food details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recipes',
      message: error.message 
    });
  }
});

// =============================
// GET all approved recipes for selection
// =============================
router.get('/waiting-recipes', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.recipeID as id,
        f.name as foodName,
        CONCAT(u.firstname, ' ', u.lastname) AS author
      FROM recipe r
      INNER JOIN food f ON r.foodID = f.foodID
      LEFT JOIN userProfile up ON r.userProfileID = up.userProfileID
      LEFT JOIN user u ON up.userID = u.userID
      WHERE r.status = 'Approved' and r.publish = 'waiting'
      ORDER BY r.createdAt DESC
    `;

    const [rows] = await db.query(query);
    
    const formattedRecipes = rows.map(recipe => ({
      id: recipe.id,
      name: recipe.foodName,
      author: recipe.author || 'Unknown Author'
    }));
    
    res.json(formattedRecipes);
    
  } catch (error) {
    console.error('Error fetching approved recipes:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET recipe by foodID (for a specific food)
router.get('/recipes/food/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    console.log('Fetching recipe for Food ID:', foodId);
    
    const query = `
      SELECT 
        r.recipeID,
        r.foodID,
        r.description,
        r.ingredients,
        r.steps,
        r.cookTime,
        r.servings,
        r.DidYouKnow,
        r.chefTips,
        r.status,
        r.createdAt,
        r.updatedAt
      FROM recipe r  
      WHERE r.foodID = ? AND r.status = 'Approved'
      ORDER BY r.createdAt DESC
      LIMIT 1
    `;
    
    const [rows] = await db.query(query, [foodId]);
    
    // 🚨 THIS IS THE CRASH FIX 🚨
    // Instead of returning null, we return a safe fallback object so the frontend can read 'servings'
    if (!rows || rows.length === 0) {
      return res.json({ 
        success: true, 
        data: {
          recipeID: 0,
          foodID: parseInt(foodId),
          description: "Official Food Item",
          ingredients: "Recipe coming soon...",
          steps: "",
          cookTime: 0,
          servings: 1,  // <-- This stops the React crash!
          DidYouKnow: "",
          chefTips: "",
          status: "Approved"
        } 
      });
    }
    
    const row = rows[0];
    
    const recipe = {
      recipeID: row.recipeID,
      foodID: row.foodID,
      description: row.description || '',
      ingredients: row.ingredients || '',
      steps: row.steps || '',
      cookTime: row.cookTime || null,
      servings: row.servings || 1,
      DidYouKnow: row.DidYouKnow || '',
      chefTips: row.chefTips || '',
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
    
    res.json({ success: true, data: recipe });
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update recipe
router.put('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      ingredients,
      steps,
      cookTime,
      servings,
      DidYouKnow,
      chefTips
    } = req.body;
    
    const query = `
      UPDATE recipe 
      SET 
        description = ?,
        ingredients = ?,
        steps = ?,
        cookTime = ?,
        servings = ?,
        DidYouKnow = ?,
        chefTips = ?,
        updatedAt = CURRENT_TIMESTAMP,
        status = 'Approved' 
      WHERE recipeID = ?
    `;
    
    const [result] = await db.query(query, [
      description || null,
      ingredients,
      steps,
      cookTime || null,
      servings || 1,
      DidYouKnow || null,
      chefTips || null,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }
    
    res.json({ success: true, message: 'Recipe updated successfully' });
    
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Final publish after admin edits food details
router.post('/publishRecipe/:id', async (req, res) => {
  const recipeId = req.params.id;
  
  try {
    // Verify recipe exists and is in draft status
    const [recipeCheck] = await db.query(
      "SELECT status FROM recipe WHERE foodID = ?",
      [recipeId]
    );
    
    if (recipeCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found." });
    }
    
    if (recipeCheck[0].status !== "Draft") {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe must be in draft status to publish." 
      });
    }
    
    // Update status to Approved
    const [result] = await db.query(
      "UPDATE recipe SET status = 'Approved', published_at = NOW() WHERE foodID = ?",
      [recipeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Recipe not found." });
    }
    
    // Fetch user info for notification
    const [rows] = await db.query(`
      SELECT u.userID, u.email, u.firstname, f.name AS recipeName
      FROM recipe r
      JOIN userProfile up ON r.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      JOIN food f ON r.foodID = f.foodID
      WHERE r.foodID = ?
    `, [recipeId]);
    
    if (rows.length > 0) {
      const { userID, email, firstname, recipeName } = rows[0];
      
      // Send final approval notification
      const finalApprovalHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #28a745; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Recipe Published!</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #28a745;">Congratulations ${firstname}!</h2>
            <p>Your recipe <strong>"${recipeName}"</strong> is now live on SarawakEats!</p>
            
            <div style="background-color: #f0fff4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">The community can now discover and enjoy your recipe.</p>
            </div>

            <p><a href="https://sarawakeats.site/recipes">View your published recipe</a></p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              Best regards,<br>The SarawakEats Team
            </p>
          </div>
        </div>
      `;
      
      const emailEnabled = await isEmailNotificationsEnabled(userID, db);
      if (emailEnabled) {
        sendEmail({
          to: email,
          subject: "🎉 Your Recipe Has Been Published!",
          html: finalApprovalHTML,
          text: `Your recipe "${recipeName}" is now live on SarawakEats!`
        });
      }
      
      await createNotification(
        userID, 
        "recipe_published", 
        `Your recipe "${recipeName}" has been published and is now visible to all users!`, 
        db
      );
    }
    
    res.json({ 
      success: true, 
      message: "Recipe published successfully and is now visible to users." 
    });
    
  } catch (error) {
    console.error("❌ Error publishing recipe:", error);
    res.status(500).json({ success: false, message: "Failed to publish recipe." });
  }
});

module.exports = router;