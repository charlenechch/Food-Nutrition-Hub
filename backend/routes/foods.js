const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

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

// ✅ Get all foods (PUBLIC - anyone can view)
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
      return res
        .status(404)
        .json({ success: false, error: "Food not found" });
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
    Energy_kcal,
    Protein_g,
    Fat_g,
    Carbohydrates_g,
    Fiber_g,
    VitaminC_mg,
    // 🌟 ADDED: Sodium_mg and image 🌟
    Sodium_mg, 
    image, 
  } = req.body;

  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [
      req.params.id,
    ]);

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Food not found" });
    }

    const sql = `
      UPDATE food 
      SET name=?, origin=?, Energy_kcal=?, Protein_g=?, Fat_g=?, Carbohydrates_g=?, Fiber_g=?, VitaminC_mg=?, 
    // 🌟 ADDED: Sodium_mg and image columns 🌟
        Sodium_mg=?, image=?
      WHERE foodID=?`;
    const values = [
      name,
      origin,
      Energy_kcal,
      Protein_g,
      Fat_g,
      Carbohydrates_g,
      Fiber_g,
      VitaminC_mg,
    // ADDED: Sodium_mg and image values
    Sodium_mg,
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

// ✅ Delete food (ADMIN ONLY)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query("SELECT * FROM food WHERE foodID = ?", [
      req.params.id,
    ]);

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Food not found" });
    }

    await db.query("DELETE FROM food WHERE foodID = ?", [req.params.id]);
    res.json({ success: true, message: "Food deleted successfully" });
  } catch (err) {
    console.error("❌ Delete food error:", err.message);
    res.status(500).json({ success: false, error: "Failed to delete food" });
  }
});

module.exports = router;
