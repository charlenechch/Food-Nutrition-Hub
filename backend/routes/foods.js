const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;
const { sendEmail } = require("../config/mailer");

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

// ============================
// 🧾 FOOD ROUTES
// ============================

// Get total food count
router.get("/count", async (req, res) => {
  try {
    const [result] = await db.query("SELECT COUNT(*) AS total FROM food");
    res.json({ success: true, total: result[0].total });
  } catch (err) {
    console.error("❌ Count foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to count foods" });
  }
});

// ✅ UPDATED: Get all foods (Filtered by Approval Status)
router.get("/", async (req, res) => {
  try {
    // We join 'recipe' to check the status.
    // Logic: Show the food IF (status is 'Approved') OR (status is NULL, meaning it's not a recipe)
    const query = `
      SELECT f.*, r.status
      FROM food f
      LEFT JOIN recipe r ON f.foodID = r.foodID
      WHERE r.status = 'Approved' OR r.status IS NULL
      ORDER BY f.name ASC
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

// ============================
// FIXED CREATE NEW FOOD ROUTE
// ============================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  console.log("📥 [POST] Received Add Food Request:", req.body);

  const {
    // Frontend Fields
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
    foodType,
    difficulty,
    dietaryTags,
    prepTime,
    commonIngredients,
    alternative,
    altDescription,
    healthTips
  } = req.body;

  // 1. Validation
  if (!name || !origin) {
    console.error("❌ [POST] Validation Failed: Name or Origin missing");
    return res.status(400).json({ success: false, error: "Name and origin are required" });
  }

  try {
    // 2. Prepare SQL with ALL Database Columns
    const sql = `
      INSERT INTO food 
      (
        name, origin, category, description, culturalSignificance, traditionalPreparation,
        Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg, image,
        foodType, difficulty, dietaryTags, prepTime, commonIngredients, 
        alternative, altDescription, healthTips
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 3. Set Values & Safe Defaults for Hidden Columns
    const values = [
      name,
      origin,
      category || "",
      description || "",
      culturalSignificance || "",
      traditionalPreparation || "",
      Energy_kcal || 0,
      Protein_g || 0,
      Fat_g || 0,
      Carbohydrates_g || 0,
      Fiber_g || 0,
      VitaminC_mg || 0,
      image || "",
      foodType || "Dish",       
      difficulty || "",   
      dietaryTags || "",
      prepTime || "0",          
      commonIngredients || "",
      alternative || "",
      altDescription || "",
      healthTips || ""
    ];

    // 4. Execute
    const [result] = await db.query(sql, values);

    console.log("✅ [POST] Food Created, ID:", result.insertId);
    
    res.json({
      success: true,
      message: "Food created successfully",
      data: { foodID: result.insertId, name, origin },
    });

  } catch (err) {
    console.error("❌ [POST] Database Error:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Database error: " + (err.sqlMessage || err.message) 
    });
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
    res.json({ success: true, message: "Food deleted successfully" });
  } catch (err) {
    console.error("❌ Delete food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to delete food" });
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