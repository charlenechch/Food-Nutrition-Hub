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

// Get all foods (with createdAt and updatedAt)
router.get("/", async (req, res) => {
  try {
    const [foods] = await db.query(`
      SELECT foodID, name, origin, category, description, culturalSignificance, traditionalPreparation,
             Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg, image,
             createdAt, updatedAt
      FROM food
    `);
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
//  CREATE FOOD ROUTE
// ============================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  console.log("📥 [POST] Received Add Food Request:", req.body);

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
    // 2. Prepare SQL
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
      foodType || "",
      difficulty || "",
      dietaryTags || "Medium",
      prepTime || "",
      commonIngredients || "",
      alternative || "",
      altDescription || "",
      healthTips || ""
    ];

    // 3. Execute
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
      console.log(`📧 Sending update notification to ${email} for food: ${foodName}`);

      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #387346; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Food Item Updated</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #387346;">Hello ${firstname},</h2>
            <p>This is a notification that an administrator has updated the details for the food item:</p>
            <h3 style="text-align:center; background:#f4f4f4; padding:10px;">${foodName}</h3>
            
            <p>These changes were made to ensure the accuracy of our food database, such as nutritional info, cultural details, or categorization.</p>

            <p>You can view the updated details on your profile or the recipes page.</p>
            
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
        text: `Your food submission "${foodName}" has been updated by an admin to ensure database accuracy.`
      });
    } else {
      console.log("ℹ️ No user linked to this food item. Skipping email.");
    }

    res.json({ success: true, message: "Food updated successfully and notification sent (if applicable)." });
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

module.exports = router;
