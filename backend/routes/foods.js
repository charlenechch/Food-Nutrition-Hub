const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
// removed multer/fs/path since we now use Cloudinary

// ============================
// 📂 IMAGE UPLOAD SETUP
// ============================

// Cloudinary setup (NEW: Base64 -> Cloudinary)
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CloudINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CloudINARY_API_SECRET || "",
});
console.log("🔧 Cloudinary configured:", {
  cloud_name: cloudinary.config().cloud_name ? "✅ Set" : "❌ Missing",
  api_key: cloudinary.config().api_key ? "✅ Set" : "❌ Missing",
});

// ============================
// 🖼️ IMAGE UPLOAD ENDPOINT
// ============================
// URL: POST /api/foods/upload/food-image
// Replaced Multer + local uploads with Base64 -> Cloudinary
router.post(
  "/upload/food-image",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      // Expect JSON body: { image: "data:image/png;base64,..." }
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ success: false, error: "No image received" });
      }

      // Optional: basic validation for data URI
      if (typeof image !== "string" || !image.startsWith("data:image")) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid image format; expected data URI" });
      }

      // Optional: estimate base64 size and reject large uploads (example: 10MB)
      try {
        const estimatedBytes = Math.ceil((image.length * 3) / 4);
        const maxBytes = 10 * 1024 * 1024; // 10 MB
        if (estimatedBytes > maxBytes) {
          return res.status(400).json({
            success: false,
            error: "Image too large. Please use an image smaller than 10MB.",
          });
        }
      } catch (sizeErr) {
        console.warn("Could not estimate image size:", sizeErr && sizeErr.message);
      }

      console.log("📤 Uploading image to Cloudinary (food-images folder)...");
      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "food-images",
        resource_type: "image",
        timeout: 30000,
        // you can add transformations or public_id here if desired
      });

      console.log("✅ Image uploaded to Cloudinary:", uploaded.secure_url);
      return res.status(200).json({ success: true, imageUrl: uploaded.secure_url });
    } catch (err) {
      console.error("❌ Cloudinary upload failed:", err && err.message ? err.message : err);
      return res.status(500).json({ success: false, error: "Cloudinary upload failed" });
    }
  }
);

// ============================
// 🧾 EXISTING FOOD ROUTES
// ============================

// ✅ Get total food count (for Admin Dashboard)
router.get("/count", async (req, res) => {
  try {
    const [result] = await db.query("SELECT COUNT(*) AS total FROM food");
    res.json({ success: true, total: result[0].total });
  } catch (err) {
    console.error("❌ Count foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to count foods" });
  }
});

// ✅ Get all foods (PUBLIC)
router.get("/", async (req, res) => {
  try {
    const [foods] = await db.query("SELECT * FROM food");
    res.json({ success: true, data: foods });
  } catch (err) {
    console.error("❌ Get foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch foods" });
  }
});

// ✅ Get single food by ID (PUBLIC)
router.get("/:id", async (req, res) => {
  try {
    const [foods] = await db.query(
      "SELECT * FROM food WHERE foodID = ?",
      [req.params.id]
    );

    if (foods.length === 0) {
      return res.status(404).json({ success: false, error: "Food not found" });
    }

    res.json({ success: true, data: foods[0] });
  } catch (err) {
    console.error("❌ Get food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch food" });
  }
});

// ✅ Create new food (ADMIN ONLY)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    name,
    origin,
    Energy_kcal,
    Protein_g,
    Fat_g,
    Carbohydrates_g,
    Fiber_g,
    VitaminC_mg,
  } = req.body;

  if (!name || !origin) {
    return res
      .status(400)
      .json({ success: false, error: "Name and origin are required" });
  }

  try {
    const sql = `
      INSERT INTO food 
      (name, origin, Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      name,
      origin,
      Energy_kcal,
      Protein_g,
      Fat_g,
      Carbohydrates_g,
      Fiber_g,
      VitaminC_mg,
    ];

    const [result] = await db.query(sql, values);
    res.json({
      success: true,
      message: "Food created successfully",
      data: { foodID: result.insertId, name, origin },
    });
  } catch (err) {
    console.error("❌ Create food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to create food" });
  }
});

// ✅ Update food (ADMIN ONLY)
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

  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [
      req.params.id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Food not found" });
    }

      const sql = `
    UPDATE food
    SET 
      name = ?,        
      origin = ?,
      category = ?,            
      description = ?,         
      culturalSignificance = ?,
      traditionalPreparation = ?, 
      Energy_kcal = ?,
      Protein_g = ?,
      Fat_g = ?,
      Carbohydrates_g = ?,
      Fiber_g = ?,
      VitaminC_mg = ?,
      image = ?
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
    req.params.id,
  ];


    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: "No changes were made. Check data types or values.",
      });
    }

    res.json({ success: true, message: "Food updated successfully" });
  } catch (err) {
    console.error("❌ Update food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to update food" });
  }
});

// ✅ Delete food (ADMIN ONLY)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [
      req.params.id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Food not found" });
    }

    await db.query("DELETE FROM food WHERE foodID = ?", [req.params.id]);
    res.json({ success: true, message: "Food deleted successfully" });
  } catch (err) {
    console.error("❌ Delete food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to delete food" });
  }
});

module.exports = router;
