const express = require("express");
const router = express.Router();
const db = require('../config/db');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("🔧 Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
});

// GET all recipes 
router.get('/all/recipes', async (req, res) => {
  try {
    console.log('Fetching all recipes...');
    
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
        r.chefTips
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      WHERE r.status = 'Approved'
    `;
    
    const result = await db.query(query);
    console.log('Raw MySQL result length:', Array.isArray(result) ? result.length : 'N/A');
    
    let allRecipes = [];
    
    if (Array.isArray(result)) {
      // Filter out schema objects
      const validItems = result.filter(item => {
        if (typeof item !== 'object' || item === null) return false;
        
        // Check if this is a schema definition
        const values = Object.values(item);
        const isSchema = values.some(value => 
          typeof value === 'string' && 
          (value.includes('INT NOT NULL') || value.includes('VARCHAR'))
        );
        
        return !isSchema;
      });
      
      console.log(`Valid items after filtering: ${validItems.length}`);
      
      // DEBUG
      console.log('🔍 DEBUG - Detailed structure analysis:');
      validItems.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          keys: Object.keys(item),
          hasNumericKeys: Object.keys(item).some(key => !isNaN(parseInt(key))),
          numericKeys: Object.keys(item).filter(key => !isNaN(parseInt(key))),
          firstFewValues: Object.values(item).slice(0, 3).map(val => 
            val && typeof val === 'object' ? { type: 'object', hasId: !!val.id, hasName: !!val.name } : val
          )
        });
      });
      
      // Extract ALL recipe objects from ALL numeric keys
      validItems.forEach(item => {
        Object.keys(item).forEach(key => {
          const value = item[key];
          
          if (value && typeof value === 'object' && value.id !== undefined && value.name !== undefined) {
            console.log(`📖 Found recipe at key ${key}: ${value.name} (ID: ${value.id})`);
            const transformedRecipe = createRecipeFromFlatObject(value);
            allRecipes.push(transformedRecipe);
          }
        });
      });
      
      console.log(`Total recipes extracted: ${allRecipes.length}`);
      
      // Remove duplicates by ID
      const uniqueRecipes = [];
      const seenIds = new Set();
      
      allRecipes.forEach(recipe => {
        if (!seenIds.has(recipe.id)) {
          seenIds.add(recipe.id);
          uniqueRecipes.push(recipe);
        }
      });
      
      console.log(`Unique recipes after deduplication: ${uniqueRecipes.length}`);
      allRecipes = uniqueRecipes;
    }
    
    console.log(`Sending ${allRecipes.length} APPROVED recipes to frontend`);
    
    if (allRecipes.length > 0) {
      console.log('✅ Recipes being sent:', allRecipes.map(r => ({ id: r.id, name: r.name })));
    }
    
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
        r.userProfileID,
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
    
    let row = rows[0];
    
    // DEBUG
    console.log('Single recipe row structure:', {
      keys: Object.keys(row),
      hasNumericKeys: Object.keys(row).some(key => !isNaN(parseInt(key))),
      hasNamedProps: row.id !== undefined || row.name !== undefined,
      sampleValues: Object.values(row).slice(0, 3)
    });
    
    // Extract the actual recipe data
    let recipeData = row;
    
    // If row has numeric keys, look for the actual recipe object
    if ((row.id === undefined || row.name === undefined) && Object.keys(row).some(key => !isNaN(key))) {
      console.log('Looking for recipe in numeric keys...');
      
      // Check each numeric key for a recipe-like object
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (value && typeof value === 'object' && value.id !== undefined && value.name !== undefined) {
          console.log(`Found recipe at key ${key}:`, { id: value.id, name: value.name });
          recipeData = value;
        }
      });
    }
    
    if (recipeData.id === undefined || recipeData.name === undefined) {
      console.log('Using direct mapping for single recipe');
      // Map numeric indices to field names based on SELECT order
      const fieldMap = {
        0: 'id', 1: 'name', 2: 'origin', 3: 'difficulty', 4: 'prepTime', 5: 'image',
        6: 'description', 7: 'foodType', 8: 'category', 9: 'dietaryTags',
        10: 'cookTime', 11: 'servings', 12: 'ingredients', 13: 'instructions',
        14: 'funFact', 15: 'chefTips', 
      };
      
      const mappedData = {};
      Object.keys(recipeData).forEach(key => {
        const numKey = parseInt(key);
        if (!isNaN(numKey) && fieldMap[numKey] !== undefined) {
          mappedData[fieldMap[numKey]] = recipeData[key];
        } else if (isNaN(numKey) && key !== 'userProfileID' && key !== 'status') {
          // Only include non-numeric keys that are NOT the internal fields
          mappedData[key] = recipeData[key];
        }
      });
      recipeData = mappedData;
    } else {
      // Remove internal fields if they exist as named properties
      const { userProfileID, status, ...cleanData } = recipeData;
      recipeData = cleanData;
    }
    
    console.log('Final recipe data before transformation:', {
      id: recipeData.id,
      name: recipeData.name,
      typeOfId: typeof recipeData.id,
      typeOfName: typeof recipeData.name
    });
    
    const recipe = createRecipeFromFlatObject(recipeData);
    
    console.log('Sending transformed recipe:', { 
      id: recipe.id, 
      name: recipe.name,
      origin: recipe.origin 
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

    console.log('📊 Request data analysis:', {
      name, 
      origin, 
      foodType,
      ingredientsType: typeof ingredients,
      instructionsType: typeof instructions,
      ingredientsIsArray: Array.isArray(ingredients),
      instructionsIsArray: Array.isArray(instructions),
      ingredientsLength: Array.isArray(ingredients) ? ingredients.length : 'N/A',
      instructionsLength: Array.isArray(instructions) ? instructions.length : 'N/A'
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

    const userProfileID = req.session.user.userID;
    console.log('✅ User authenticated:', userProfileID);

    let processedImage = image || 
    'https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg';

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

// POST new recipe 
router.post('/create/recipes', async (req, res) => {
  console.log('🔍 START: Recipe creation endpoint called');
  
  try {
    const {
      name, origin, difficulty, prepTime, image, description, 
      foodType, dietaryTags, cookTime, servings, ingredients, 
      instructions, funFact, chefTips
    } = req.body;

    console.log('📊 Request data analysis:', {
      name, 
      origin, 
      foodType,
      hasImage: !!image,
      imageType: image ? (image.startsWith('data:image') ? 'base64' : 'url') : 'none'
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

    const userProfileID = req.session.user.userID;
    console.log('✅ User authenticated:', userProfileID);

    let processedImage = 'https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg';

    // CLOUDINARY UPLOAD LOGIC
    if (image && image.startsWith('data:image')) {
      try {
        console.log('📤 Uploading image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'food-recipes',
          resource_type: 'image'
        });
        processedImage = uploadResult.secure_url;
        console.log('✅ Image uploaded to Cloudinary:', processedImage);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        // Continue with default image
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
    await db.query(recipeQuery, recipeParams);
    
    console.log('✅ Recipe created successfully with ID:', foodId);
    
    res.status(201).json({ 
      message: 'Recipe created successfully', 
      id: foodId,
      status: 'Pending'
    });
    
  } catch (error) {
    console.error('❌ Error creating recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET recipe for revision (by ID, any status)
router.get('/revise/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔧 Fetching recipe for revision ID:', id);
    
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
        r.recipeID,
        r.cookTime, 
        r.servings, 
        r.ingredients, 
        r.steps AS instructions, 
        r.DidYouKnow AS funFact, 
        r.chefTips,
        r.status
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      WHERE f.foodID = ? OR r.recipeID = ?
    `;
    
    const result = await db.query(query, [id, id]);
    console.log('🔍 Query executed, result structure:', Array.isArray(result) ? `Array with ${result.length} items` : 'Not array');
    
    // 🚨 CRITICAL FIX: Extract data from nested array structure
    let row;
    if (Array.isArray(result) && result.length > 0) {
      // The actual data is in result[0][0] - first array contains data rows
      if (Array.isArray(result[0]) && result[0].length > 0) {
        row = result[0][0];
        console.log('✅ Using result[0][0] as data');
      } else if (result[0] && typeof result[0] === 'object' && result[0].name !== undefined) {
        // Sometimes it might be result[0] directly
        row = result[0];
        console.log('✅ Using result[0] as data');
      }
    }
    
    if (!row || !row.name) {
      console.log('❌ No valid recipe data found');
      console.log('Result structure:', JSON.stringify(result, null, 2).substring(0, 500));
      return res.status(404).json({ error: 'Recipe not found for revision' });
    }
    
    console.log('🔍 EXTRACTED ROW DATA:', {
      id: row.id,
      name: row.name,
      origin: row.origin,
      status: row.status
    });
    
    // Build the recipe object
    const recipe = {
      id: row.id || 0,
      name: row.name || '',
      origin: row.origin || '',
      difficulty: row.difficulty || 'Easy',
      prepTime: row.prepTime || 0,
      cookTime: row.cookTime || 0,
      servings: row.servings || 0,
      image: row.image || 'https://res.cloudinary.com/demo/image/upload/v1638752412/placeholder_food.jpg',
      description: row.description || '',
      foodType: row.foodType || '',
      dietaryTags: row.dietaryTags ? 
        (typeof row.dietaryTags === 'string' ? 
          row.dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag) : 
          row.dietaryTags) 
        : [],
      ingredients: row.ingredients ? 
        (typeof row.ingredients === 'string' ? 
          row.ingredients.split('\n').map(line => line.trim()).filter(line => line) : 
          row.ingredients) 
        : [],
      instructions: row.instructions ? 
        (typeof row.instructions === 'string' ? 
          row.instructions.split('\n').map(line => line.trim()).filter(line => line) : 
          row.instructions) 
        : [],
      funFact: row.funFact || '',
      chefTips: row.chefTips || '',
      status: row.status || 'Unknown'
    };
    
    console.log('✅ FINAL RECIPE DATA SENT:', {
      id: recipe.id,
      name: recipe.name,
      origin: recipe.origin,
      status: recipe.status
    });
    
    res.json(recipe);
    
  } catch (error) {
    console.error('❌ Error fetching recipe for revision:', error);
    res.status(500).json({ error: error.message });
  }
});

// display old data
router.put('/update/recipes/:id', async (req, res) => {
  console.log('🔍 START: Recipe update endpoint called for ID:', req.params.id);
  
  try {
    const {
      name, origin, difficulty, prepTime, image, description, 
      foodType, dietaryTags, cookTime, servings, ingredients, 
      instructions, funFact, chefTips
    } = req.body;

    const recipeId = req.params.id;

    console.log('📊 Update request data analysis:', {
      recipeId,
      name, 
      origin, 
      foodType,
      hasImage: !!image,
      imageType: image ? (image.startsWith('data:image') ? 'base64' : 'url') : 'none'
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

    const userProfileID = req.session.user.userID;
    console.log('✅ User authenticated:', userProfileID);

    // First, get the current foodID from the recipe
    console.log('🔍 Getting current food ID for recipe:', recipeId);
    const [currentRecipe] = await db.query(
      'SELECT foodID FROM recipe WHERE recipeID = ? AND userProfileID = ?',
      [recipeId, userProfileID]
    );

    if (currentRecipe.length === 0) {
      console.log('❌ Recipe not found or user not authorized');
      return res.status(404).json({ error: 'Recipe not found or access denied' });
    }

    const foodId = currentRecipe[0].foodID;
    console.log('✅ Found food ID:', foodId);

    let processedImage = null;

    // CLOUDINARY UPLOAD LOGIC (only if new image provided)
    if (image && image.startsWith('data:image')) {
      try {
        console.log('📤 Uploading new image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'food-recipes',
          resource_type: 'image'
        });
        processedImage = uploadResult.secure_url;
        console.log('✅ New image uploaded to Cloudinary:', processedImage);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        // Don't update image if upload fails
      }
    } else if (image && image.startsWith('http')) {
      processedImage = image;
      console.log('✅ Using provided image URL');
    }

    console.log('🚀 About to UPDATE food table');

    // Update food table
    const foodUpdateQuery = `
      UPDATE food 
      SET name = ?, origin = ?, difficulty = ?, prepTime = ?, 
          description = ?, foodType = ?, category = ?, dietaryTags = ?
          ${processedImage ? ', image = ?' : ''}
      WHERE foodID = ?
    `;
    
    const foodParams = [
      name, 
      origin, 
      difficulty || 'Easy', 
      prepTime || 0, 
      description || '', 
      foodType || 'Other',
      foodType || 'Other',
      Array.isArray(dietaryTags) ? dietaryTags.join(', ') : (dietaryTags || '')
    ];

    // Add image parameter if new image was processed
    if (processedImage) {
      foodParams.push(processedImage);
    }
    
    // Always add foodId at the end
    foodParams.push(foodId);
    
    console.log('📝 Executing food update with params:', foodParams);
    
    const [foodResult] = await db.query(foodUpdateQuery, foodParams);
    console.log('✅ Food update successful - affected rows:', foodResult.affectedRows);

    console.log('🚀 About to UPDATE recipe table');

    // Update recipe table
    const recipeUpdateQuery = `
      UPDATE recipe 
      SET ingredients = ?, steps = ?, cookTime = ?, servings = ?, 
          DidYouKnow = ?, chefTips = ?, status = ?
      WHERE foodID = ? AND userProfileID = ?
    `;
    
    const recipeParams = [
      Array.isArray(ingredients) ? ingredients.join('\n') : (ingredients || ''),
      Array.isArray(instructions) ? instructions.join('\n') : (instructions || ''),
      cookTime || 0, 
      servings || 1,
      funFact || '', 
      chefTips || '',
      'Pending', // Reset status to Pending for re-review
      foodId,
      userProfileID
    ];
    
    console.log('📝 Executing recipe update with foodID:', foodId);
    const [recipeResult] = await db.query(recipeUpdateQuery, recipeParams);
    
    console.log('✅ Recipe updated successfully - affected rows:', recipeResult.affectedRows);
    
    res.status(200).json({ 
      message: 'Recipe updated successfully', 
      id: foodId,
      status: 'Pending'
    });
    
  } catch (error) {
    console.error('❌ Error updating recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;