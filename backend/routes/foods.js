const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { pool: db } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// 🧩 Ensure upload folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🧩 MULTER CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
  },
});

// ================= Routes =================

// ✅ Upload food image
router.post("/upload/food-image", requireAuth, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error("❌ Image upload error:", err.message);
    res.status(500).json({ success: false, error: "Failed to upload image" });
  }
});

// ✅ Get total food count
router.get("/count", async (req, res) => {
  try {
    const [result] = await db.query("SELECT COUNT(*) AS total FROM food");
    res.json({ success: true, total: result[0].total });
  } catch (err) {
    console.error("❌ Count foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to count foods" });
  }
});

// ✅ Get all foods
router.get("/", async (req, res) => {
  try {
    const [foods] = await db.query("SELECT * FROM food");
    res.json({ success: true, data: foods });
  } catch (err) {
    console.error("❌ Get foods error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch foods" });
  }
});

// ✅ Get single food by ID
router.get("/:id", async (req, res) => {
  try {
    const [foods] = await db.query("SELECT * FROM food WHERE foodID = ?", [req.params.id]);
    if (foods.length === 0)
      return res.status(404).json({ success: false, error: "Food not found" });
    res.json({ success: true, data: foods[0] });
  } catch (err) {
    console.error("❌ Get food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch food" });
  }
});

// ✅ Create food
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
    cultural_significance,
    description,
    traditional_preparation,
    category,
    image,
  } = req.body;

  if (!name || !origin)
    return res.status(400).json({ success: false, error: "Name and origin are required" });

  try {
    const sql = `
      INSERT INTO food 
      (name, origin, Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg,
       cultural_significance, description, traditional_preparation, category, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      cultural_significance,
      description,
      traditional_preparation,
      category,
      image,
    ];
    const [result] = await db.query(sql, values);
    res.json({ success: true, message: "Food created successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Create food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to create food" });
  }
});

// ✅ Update food
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const {
    name,
    origin,
    Energy_kcal,
    Protein_g,
    Fat_g,
    Carbohydrates_g,
    Fiber_g,
    VitaminC_mg,
    cultural_significance,
    description,
    traditional_preparation,
    category,
    image,
  } = req.body;

  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [req.params.id]);
    if (existing.length === 0)
      return res.status(404).json({ success: false, error: "Food not found" });

    const sql = `
      UPDATE food SET 
        name=?, origin=?, Energy_kcal=?, Protein_g=?, Fat_g=?, 
        Carbohydrates_g=?, Fiber_g=?, VitaminC_mg=?, 
        cultural_significance=?, description=?, traditional_preparation=?, 
        category=?, image=? 
      WHERE foodID=?
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
      cultural_significance,
      description,
      traditional_preparation,
      category,
      image,
      req.params.id,
    ];
    await db.query(sql, values);
    res.json({ success: true, message: "Food updated successfully" });
  } catch (err) {
    console.error("❌ Update food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to update food" });
  }
});

// ✅ Delete food
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [req.params.id]);
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
