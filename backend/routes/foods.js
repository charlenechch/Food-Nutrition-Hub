const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ============================
// 📂 IMAGE UPLOAD SETUP
// ============================

// Create upload folder if not exists
const uploadDir = path.join(__dirname, "../uploads/food-images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created upload directory:", uploadDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

// File upload filter (only images)
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
    }
    cb(null, true);
  },
});

// ============================
// 🖼️ IMAGE UPLOAD ENDPOINT
// ============================
// URL: POST /api/foods/upload/food-image
router.post(
  "/upload/food-image",
  requireAuth,
  requireAdmin,
  upload.single("foodImage"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No image uploaded" });
      }

      const imageUrl = `/uploads/food-images/${req.file.filename}`;
      console.log("✅ Image uploaded:", imageUrl);

      res.status(200).json({ success: true, imageUrl });
    } catch (err) {
      console.error("❌ Image upload failed:", err.message);
      res.status(500).json({ success: false, error: "Image upload failed" });
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
        name=?,
        origin=?,
        category=?,
        description=?,
        culturalSignificance=?,
        traditionalPreparation=?,
        Energy_kcal=?,
        Protein_g=?,
        Fat_g=?,
        Carbohydrates_g=?,
        Fiber_g=?,
        VitaminC_mg=?,
        image=?
      WHERE foodID=?
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
