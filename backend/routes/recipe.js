const express = require("express");
const router = express.Router();
const db = require('../config/db');

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
        r.chefTips,
        r.userProfileID,
        r.status
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
    imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
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
        14: 'funFact', 15: 'chefTips'
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
  let connection;
  try {
    const {
      name, origin, difficulty, prepTime, image, description, 
      foodType, dietaryTags, cookTime, servings, ingredients, 
      instructions, funFact, chefTips
    } = req.body;

    console.log('Creating new recipe:', { name, origin, foodType });

    // Validate required fields
    if (!name || !origin) {
      return res.status(400).json({ error: 'Name and origin are required' });
    }

  
    let processedImage = image || 
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

    await db.query('START TRANSACTION');

    // Insert into food table
    const foodQuery = `
      INSERT INTO food (
        name, origin, difficulty, prepTime, image, description, 
        foodType, category, dietaryTags, status, userProfileID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      'Pending',
      req.user?.id || null
    ];
    
    console.log('Executing food insert...');
    const foodResult = await db.query(foodQuery, foodParams);
    console.log('Food insert result:', foodResult);
    
    // DEBUG: Check what's returned
    console.log('Food result keys:', Object.keys(foodResult));
    console.log('Food result values:', foodResult);
    
    // Get the inserted ID 
    let foodId;
    if (foodResult.insertId) {
      foodId = foodResult.insertId;
    } else if (foodResult[0] && foodResult[0].insertId) {
      foodId = foodResult[0].insertId;
    } else {
      // If can't get the ID, try to fetch the last inserted ID
      const idResult = await db.query('SELECT LAST_INSERT_ID() as id');
      foodId = idResult[0].id;
    }
    
    console.log('Retrieved food ID:', foodId);

    if (!foodId) {
      throw new Error('Could not retrieve the inserted food ID');
    }

    // Insert into recipe table
    const recipeQuery = `
      INSERT INTO recipe (
        foodID, ingredients, steps, cookTime, servings, DidYouKnow, chefTips
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const recipeParams = [
      foodId, 
      Array.isArray(ingredients) ? ingredients.join('\n') : (ingredients || ''),
      Array.isArray(instructions) ? instructions.join('\n') : (instructions || ''),
      cookTime || 0, 
      servings || 1,
      funFact || '', 
      chefTips || ''
    ];
    
    console.log('Executing recipe insert with foodID:', foodId);
    await db.query(recipeQuery, recipeParams);
    await db.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Recipe created successfully', 
      id: foodId,
      status: 'Pending'
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating recipe:', error);
    
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(500).json({ 
        error: 'Failed to create recipe - food ID was null',
        details: 'The food record was not created properly'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;