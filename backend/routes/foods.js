const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;
const { sendEmail } = require("../config/mailer");
const { embedFood } = require("../utils/embeddings");
const { logActivity } = require("./adminActivityLog");

// ============================
// 📂 CLOUDINARY CONFIG
// ============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CloudINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || "",
});
console.log("🔧 Cloudinary configured:", {
  cloud_name: cloudinary.config().cloud_name ? "✅ Set" : "❌ Missing",
  api_key: cloudinary.config().api_key ? "✅ Set" : "❌ Missing",
});

// ============================
// 🖼️ IMAGE UPLOAD
// ============================
router.post(
  "/upload/food-image",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { image } = req.body;

      if (!image)
        return res.status(400).json({ success: false, error: "No image received" });

      if (typeof image !== "string" || !image.startsWith("data:image"))
        return res.status(400).json({
          success: false,
          error: "Invalid image format; expected data URI",
        });

      const estimatedBytes = Math.ceil((image.length * 3) / 4);
      const maxBytes = 10 * 1024 * 1024; // 10 MB
      if (estimatedBytes > maxBytes)
        return res.status(400).json({
          success: false,
          error: "Image too large. Please use an image smaller than 10MB.",
        });

      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "food-images",
        resource_type: "image",
        timeout: 30000,
      });

      return res.status(200).json({ success: true, imageUrl: uploaded.secure_url });
    } catch (err) {
      console.error("❌ Cloudinary upload failed:", err.message || err);
      return res.status(500).json({ success: false, error: "Cloudinary upload failed" });
    }
  }
);

// Get total food count (Strictly hides empty recipe shells)
router.get("/count", async (req, res) => {
  try {
    const query = `
      SELECT COUNT(DISTINCT foodID) AS total 
      FROM food
      WHERE Energy_kcal > 0 
         OR (culturalSignificance IS NOT NULL AND culturalSignificance != '')
    `;
    const [result] = await db.query(query);
    res.json({ success: true, total: result[0].total });
  } catch (err) {
    console.error("❌ Count foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to count foods" });
  }
});

// Get all foods (Strictly hides empty recipe shells)
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT * FROM food
      WHERE Energy_kcal > 0 
         OR (culturalSignificance IS NOT NULL AND culturalSignificance != '')
      ORDER BY name ASC
    `;

    const [foods] = await db.query(query);
    res.json({ success: true, data: foods });
  } catch (err) {
    console.error("❌ Get foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch foods" });
  }
});

// Get single food by ID
router.get("/:id", async (req, res) => {
  try {
    const [foods] = await db.query("SELECT * FROM food WHERE foodID = ?", [
      req.params.id,
    ]);

    if (foods.length === 0)
      return res.status(404).json({ success: false, error: "Food not found" });

    const food = foods[0];
    res.json({
      success: true,
      data: {
        ...food,
        createdAt: food.createdAt,
        updatedAt: food.updatedAt,
      },
    });
  } catch (err) {
    console.error("❌ Get food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch food" });
  }
});

// Get food by recipe ID (using the foodId from recipe table)
router.get("/by-recipe/:recipeId", async (req, res) => {
  try {
    // get the recipe to find its foodId
    const [recipes] = await db.query(
      "SELECT foodId FROM recipe WHERE recipeID = ?",
      [req.params.recipeId]
    );

    if (recipes.length === 0) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    const foodId = recipes[0].foodId;

    // If there's no foodId linked yet (null or 0), return 404 to create new food
    if (!foodId) {
      return res.status(404).json({ success: false, error: "No food linked to this recipe yet" });
    }

    // Get the food data using the foodId
    const [foods] = await db.query("SELECT * FROM food WHERE foodID = ?", [foodId]);

    if (foods.length === 0) {
      return res.status(404).json({ success: false, error: "Food not found" });
    }

    const food = foods[0];
    res.json({
      success: true,
      data: {
        ...food,
        createdAt: food.createdAt,
        updatedAt: food.updatedAt,
      },
    });
  } catch (err) {
    console.error("❌ Get food by recipe error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch food" });
  }
});

// ============================
// CREATE NEW FOOD ROUTE
// ============================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  console.log("📥 [POST] Received Add Food Request:", req.body);

  // Get the admin's userProfileID from database
  let userProfileID;
  try {
    // Get user from session 
    const sessionUser = req.session?.user;
    
    console.log("🔍 Session user:", JSON.stringify(sessionUser, null, 2));
    
    if (!sessionUser) {
      console.error("❌ No user found in session");
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated - no session found" 
      });
    }
    
    // Get userID from session user 
    const userID = sessionUser.userID || sessionUser.id;
    
    console.log("🔍 Extracted userID:", userID);

    if (!userID) {
      console.error("❌ UserID not found in session user");
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated - no user ID found" 
      });
    }
    
    // Check if user is admin 
    if (sessionUser.role !== 'admin') {
      console.error(`❌ User ${userID} is not admin`);
      return res.status(403).json({ 
        success: false, 
        error: "Admin privileges required" 
      });
    }
    
    // Get or create userProfile for the admin
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

  const {
    // Food Table Fields
    name,
    origin,
    category,
    foodDescription,
    culturalSignificance,
    traditionalPreparation,
    Energy_kcal,
    Protein_g,
    Fat_g,
    Carbohydrates_g,
    Fiber_g,
    VitaminC_mg,
    image,
    difficulty,
    dietaryTags,
    prepTime,
    commonIngredients,
    healthTips,
    
    // Recipe Table Fields
    ingredients,        
    steps,             
    recipeDescription, 
    cookTime,          
    servings,          
    didYouKnow,        
    chefTips           
  } = req.body;

  // 1. Validation 
  if (!name || !origin) {
    console.error("❌ [POST] Validation Failed: Name or Origin missing");
    return res.status(400).json({ 
      success: false, 
      error: "Name and origin are required" 
    });
  }

  // Start a transaction to ensure both inserts succeed or fail together
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 2. Insert into FOOD table
    const foodSql = `
      INSERT INTO food 
      (
        name, origin, category, description, culturalSignificance, traditionalPreparation,
        Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg, 
        image, difficulty, dietaryTags, prepTime, commonIngredients,  healthTips
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const foodValues = [
      name,
      origin,
      category || "",
      foodDescription || "",
      culturalSignificance || "",
      traditionalPreparation || "",
      Energy_kcal || 0,
      Protein_g || 0,
      Fat_g || 0,
      Carbohydrates_g || 0,
      Fiber_g || 0,
      VitaminC_mg || 0,
      image || "",   
      difficulty || "Medium",
      dietaryTags || "",
      prepTime || "0",          
      commonIngredients || "",
      healthTips || ""
    ];

    const [foodResult] = await connection.query(foodSql, foodValues);
    const foodId = foodResult.insertId;
    console.log("✅ [POST] Food Created, ID:", foodId);

    // 3. Insert into RECIPE table 
    const recipeSql = `
      INSERT INTO recipe 
      (
        foodID, userProfileID, description, ingredients, steps, 
        cookTime, servings, DidYouKnow, chefTips, status, publish
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const recipeValues = [
      foodId,
      userProfileID,
      recipeDescription || "",  
      ingredients || "",
      steps || "",
      cookTime || "0",
      servings || "1",
      didYouKnow || "",
      chefTips || "", 
      'Approved',
      'publish'
    ];

    await connection.query(recipeSql, recipeValues);
    console.log("✅ [POST] Recipe Created for Food ID:", foodId);

    // 4. Commit transaction
    await connection.commit();
    
    // 5. Generate Embedding for Search 
    try {
      // Combine relevant fields from both tables for better semantic search
      const searchText = [
        name,
        foodDescription || "",
        commonIngredients || "",
        ingredients || "",
        culturalSignificance || "",
        recipeDescription || ""
      ].join(" ").trim();
      
      await embedFood(foodId, searchText);
      console.log(`✅ Embedding generated for new food: "${name}"`);
    } catch (embedErr) {
      // Non-fatal — food still created, embedding can be backfilled later
      console.warn(`⚠️ Could not generate embedding for "${name}":`, embedErr.message);
    }
    
    // 6. Return Success Response
    const adminID = req.session.user.userID;
    const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
    await logActivity(db, adminID, adminName, "food_created", `Added new food "${name}" (ID: ${foodId}).`);

    res.json({
      success: true,
      message: "Food created successfully",
      data: { 
        foodID: foodId, 
        name, 
        origin 
      },
    });

  } catch (err) {
    // Rollback transaction on error
    await connection.rollback();
    console.error("❌ [POST] Database Error:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Database error: " + (err.sqlMessage || err.message) 
    });
  } finally {
    // Release connection back to pool
    connection.release();
  }
});

// Update food
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const {
    name,
    origin,
    category,
    description,
    culturalSignificance,
    traditionalPreparation,
    Energy_kcal,
    Protein_g,
    Fat_g,
    Carbohydrates_g,
    Fiber_g,
    VitaminC_mg,
    image,
  } = req.body;

  const foodId = req.params.id;

  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [foodId]);

    if (existing.length === 0)
      return res.status(404).json({ success: false, error: "Food not found" });

    // 1. Perform the Update
    const sql = `
      UPDATE food
      SET name = ?, origin = ?, category = ?, description = ?, culturalSignificance = ?, traditionalPreparation = ?,
          Energy_kcal = ?, Protein_g = ?, Fat_g = ?, Carbohydrates_g = ?, Fiber_g = ?, VitaminC_mg = ?, image = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE foodID = ?
    `;

    const values = [
      name || existing[0].name,
      origin || existing[0].origin,
      category || existing[0].category,
      description || existing[0].description,
      culturalSignificance || existing[0].culturalSignificance,
      traditionalPreparation || existing[0].traditionalPreparation,
      Energy_kcal || existing[0].Energy_kcal || 0,
      Protein_g || existing[0].Protein_g || 0,
      Fat_g || existing[0].Fat_g || 0,
      Carbohydrates_g || existing[0].Carbohydrates_g || 0,
      Fiber_g || existing[0].Fiber_g || 0,
      VitaminC_mg || existing[0].VitaminC_mg || 0,
      image || existing[0].image || null,
      foodId,
    ];

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0)
      return res.status(400).json({ success: false, error: "No changes were made." });

    // 2. Find the User linked to this Food (via Recipe table)
    const [userResult] = await db.query(`
      SELECT u.email, u.firstname, f.name AS foodName
      FROM food f
      JOIN recipe r ON f.foodID = r.foodID
      JOIN userProfile up ON r.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE f.foodID = ?
    `, [foodId]);

    // 3. Send Email if a user is found
    if (userResult.length > 0) {
      const { email, firstname, foodName } = userResult[0];
      
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #387346; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Food Item Updated</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #387346;">Hello ${firstname},</h2>
            <p>This is a notification that an administrator has updated the details for the food item:</p>
            <h3 style="text-align:center; background:#f4f4f4; padding:10px;">${foodName}</h3>
            
            <p>These changes were made to ensure the accuracy of our food database.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              Best regards,<br>The SarawakEats Team
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: `Update: Your submission "${foodName}" has been modified`,
        html: emailHTML,
        text: `Your food submission "${foodName}" has been updated.`
      });
    }

    const adminID = req.session.user.userID;
    const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
    await logActivity(db, adminID, adminName, "food_updated", `Updated food "${name || existing[0].name}" (ID: ${foodId}).`);

    res.json({ success: true, message: "Food updated successfully." });
  } catch (err) {
    console.error("❌ Update food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to update food" });
  }
});

// Delete food
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [
      req.params.id,
    ]);

    if (existing.length === 0)
      return res.status(404).json({ success: false, error: "Food not found" });

    await db.query("DELETE FROM food WHERE foodID = ?", [req.params.id]);

    const adminID = req.session.user.userID;
    const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
    await logActivity(db, adminID, adminName, "food_deleted", `Deleted food "${existing[0].name}" (ID: ${req.params.id}).`);
    
    res.json({ success: true, message: "Food deleted successfully" });
  } catch (err) {
    console.error("❌ Delete food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to delete food" });
  }
});

// Get edit food


// ✅ ADMIN ONLY: Get all foods with ALL recipes
router.get("/admin/all", async (req, res) => {
  try {
    console.log("📋 [ADMIN] Fetching all foods with recipe details");
    
    const query = `
      SELECT 
        f.foodID,
        f.name,
        f.origin,
        f.category,
        f.updatedAt,
        r.recipeID,
        r.status,
        r.createdAt as recipeCreatedAt,
        r.updatedAt as recipeUpdatedAt
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      ORDER BY f.foodID DESC, r.recipeID DESC
    `;

    const [rows] = await db.query(query);
    
    // Group by food to handle multiple recipes
    const foodMap = new Map();
    
    rows.forEach(row => {
      const foodID = row.foodID;
      
      if (!foodMap.has(foodID)) {
        foodMap.set(foodID, {
          foodID: row.foodID,
          name: row.name,
          origin: row.origin,
          category: row.category,
          updatedAt: row.updatedAt,
          recipes: [],
          recipeCount: 0,
          latestRecipe: null
        });
      }
      
      const food = foodMap.get(foodID);
      
      if (row.recipeID) {
        const recipe = {
          recipeID: row.recipeID,
          status: row.status,
          createdAt: row.recipeCreatedAt,
          updatedAt: row.recipeUpdatedAt
        };
        
        food.recipes.push(recipe);
        food.recipeCount++;
        
        // Track latest recipe
        if (!food.latestRecipe || new Date(recipe.updatedAt) > new Date(food.latestRecipe.updatedAt)) {
          food.latestRecipe = recipe;
        }
      }
    });
    
    // Convert to array
    const foods = Array.from(foodMap.values()).map(food => ({
      ...food,
      recipeID: food.latestRecipe?.recipeID || null,
      recipeStatus: food.latestRecipe?.status || 'No recipe',
      lastUpdated: food.latestRecipe?.updatedAt || food.updatedAt
    }));
    
    console.log(`✅ [ADMIN] Returning ${foods.length} foods`);
    res.json({ 
      success: true, 
      data: foods,
      totalFoods: foods.length,
      foodsWithRecipes: foods.filter(f => f.recipeCount > 0).length
    });
    
  } catch (err) {
    console.error("❌ Admin get foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch admin foods" });
  }
});

// =============================
// POST - Select existing recipe to Add/Update food details for approved recipe
// =============================
router.post('/add-food-details', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      recipeId,
      name,
      category,
      origin,
      description,
      culturalSignificance,
      traditionalPreparation,
      Energy_kcal,
      Protein_g,
      Carbohydrates_g,
      Fat_g,
      Fiber_g,
      VitaminC_mg,
      image,
      commonIngredients,
      dietaryTags,
      healthTips
    } = req.body;

    console.log('Adding food details for approved recipe:', recipeId);

    // Validate required fields
    if (!recipeId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Recipe ID is required'
      });
    }

    if (!origin) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Origin is required'
      });
    }

    if (!category) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    // Check if recipe exists and is approved
    const [recipeCheck] = await connection.query(
      `SELECT r.recipeID, r.foodID, r.status, f.name as currentFoodName
       FROM recipe r
       INNER JOIN food f ON r.foodID = f.foodID
       WHERE r.recipeID = ?`,
      [recipeId]
    );

    if (recipeCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    if (recipeCheck[0].status !== 'Approved') {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        error: 'Only approved recipes can have food details added'
      });
    }

    const foodId = recipeCheck[0].foodID;

    // Convert arrays to comma-separated strings for database
    const dietaryTagsString = Array.isArray(dietaryTags) ? dietaryTags.join(', ') : dietaryTags;
    const commonIngredientsString = Array.isArray(commonIngredients) ? commonIngredients.join(', ') : commonIngredients;
    const categoryString = Array.isArray(category) ? category.join(', ') : (category || null);

    // Update food details
    const updateQuery = `
      UPDATE food SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        origin = ?,
        description = ?,
        culturalSignificance = ?,
        traditionalPreparation = ?,
        Energy_kcal = ?,
        Protein_g = ?,
        Carbohydrates_g = ?,
        Fat_g = ?,
        Fiber_g = ?,
        VitaminC_mg = ?,
        image = COALESCE(?, image),
        commonIngredients = ?,
        dietaryTags = ?,
        healthTips = ?,
        updatedAt = NOW()
      WHERE foodID = ?
    `;

    const updateValues = [
      name || null,
      categoryString || null,
      origin,
      description !== undefined ? description : null,
      culturalSignificance || null,
      traditionalPreparation || null,
      Energy_kcal || 0,
      Protein_g || 0,
      Carbohydrates_g || 0,
      Fat_g || 0,
      Fiber_g || 0,
      VitaminC_mg || 0,
      image || null,
      commonIngredientsString || null,
      dietaryTagsString || null,
      healthTips || null,
      foodId
    ];

    // Execute update - DECLARE THE VARIABLE HERE
    let updateResult;
    try {
      [updateResult] = await connection.query(updateQuery, updateValues);
      console.log('Update result:', updateResult);
    } catch (updateError) {
      console.error('Error in food update:', updateError);
      throw updateError;
    }

    // Update recipe publish status to 'publish'
    let publishUpdate;
    try {
      [publishUpdate] = await connection.query(
        `UPDATE recipe SET publish = 'publish' WHERE recipeID = ?`,
        [recipeId]
      );
      console.log('Publish update result:', publishUpdate);
    } catch (publishError) {
      console.error('Error in publish update:', publishError);
      throw publishError;
    }

    await connection.commit();

    console.log('✅ Food details added and recipe published for ID:', recipeId);

    res.status(200).json({
      success: true,
      message: 'Food details added successfully and recipe is now published!',
      foodId: foodId,
      recipeId: recipeId,
      affectedRows: updateResult?.affectedRows || 0
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding food details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to add food details',
      message: error.message
    });
  } finally {
    connection.release();
  }
});

// bulk import function
router.post("/bulk-import", async (req, res) => {
  console.log("📥 [BULK IMPORT] Received request body:", req.body);
  console.log("Body type:", typeof req.body);
  console.log("Is array?", Array.isArray(req.body));
  console.log("Body keys:", Object.keys(req.body));

  try {
    let importedData;
    const rawBody = req.body;
    
    console.log("Raw body keys:", Object.keys(rawBody));

    if (Array.isArray(rawBody)) {
      importedData = rawBody;
      console.log(`✅ Direct array with ${importedData.length} items`);
    } 
    else if (rawBody && typeof rawBody === 'object') {
      if (rawBody.foodItems && Array.isArray(rawBody.foodItems)) {
        importedData = rawBody.foodItems;
        console.log(`✅ foodItems array with ${importedData.length} items`);
      }
      else if (rawBody.data && Array.isArray(rawBody.data)) {
        importedData = rawBody.data;
        console.log(`✅ data array with ${importedData.length} items`);
      }
      else if (Object.keys(rawBody).length > 0) {
        importedData = [rawBody];
        console.log(`✅ Single object wrapped in array`);
      }
      else {
        return res.status(400).json({ 
          success: false, 
          error: "No valid data found in request body" 
        });
      }
    }
    else {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid request format" 
      });
    }
    
    console.log("Final imported data:", {
      length: importedData?.length || 0,
      firstItem: importedData?.[0] ? {
        name: importedData[0].name,
        origin: importedData[0].origin,
        keys: Object.keys(importedData[0])
      } : 'none'
    });
    
    if (!Array.isArray(importedData) || importedData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Data must be a non-empty array of food items" 
      });
    }

    console.log("🔍 Checking session for admin user...");
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
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
          // 1. Insert into FOOD table
          const foodSql = `
            INSERT INTO food 
            (
              name, origin, category, difficulty, dietaryTags, 
              description, image, prepTime, culturalSignificance, 
              traditionalPreparation, commonIngredients, healthTips, Energy_kcal, Protein_g, Fat_g, 
              Carbohydrates_g, Fiber_g, VitaminC_mg
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const foodValues = [
            foodItem.name,
            foodItem.origin,
            foodItem.category || "",
            foodItem.difficulty || "Medium",
            foodItem.dietaryTags || "",
            foodItem.foodDescription || foodItem.description || "",
            foodItem.image || "",
            foodItem.prepTime || 0,
            foodItem.culturalSignificance || "",
            foodItem.traditionalPreparation || "",
            foodItem.commonIngredients || "",
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
              foodID, userProfileID, description, ingredients, steps, cookTime, 
              servings, DidYouKnow, chefTips, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const recipeValues = [
            foodID,
            userProfileID, // ✅ Use the actual logged-in admin's ID
            foodItem.recipeDescription || foodItem.description || "", 
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

          // Auto-embed after bulk import
        try {
          await embedFood(foodID, foodItem.name, foodItem.description || "", foodItem.commonIngredients || "");
        } catch (embedErr) {
          console.warn(`⚠️ Embedding failed for "${foodItem.name}":`, embedErr.message);
        }

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