// routes/ai.js
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const INFERENCE_URL = process.env.INFERENCE_URL || "http://localhost:8000/ai/predict";

// session guard
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: "Login required" });
  next();
}

// map DB row -> UI response (PER SERVING)
function mapRowToResponse(row, extra = {}) {
  const tips = (row.healthTips || "")
    .split(/\r?\n|;/)
    .map(t => t.trim())
    .filter(Boolean);

  return {
    // header card
    foodName: row.name,
    servingLabel: "Per serving",           // ← important label
    image: row.image || null,
    description: row.description || null,

    // nutrition box (per serving)
    nutrition: {
      energy_kcal: row.Energy_kcal,
      protein_g: row.Protein_g,
      fat_g: row.Fat_g,
      carbs_g: row.Carbohydrates_g,
      fiber_g: row.Fiber_g,
      vitaminC_mg: row.VitaminC_mg
    },

    // meta (right column)
    origin: row.origin || null,
    commonIngredients: row.commonIngredients || null,

    // alternatives & tips
    alternatives: row.alternative
      ? [{ name: row.alternative, description: row.altDescription || "" }]
      : [],
    healthTips: tips,

    // model extras (image flow)
    predicted: extra.predicted || null,
    confidence: typeof extra.confidence === "number" ? extra.confidence : null,
    model: extra.model || null
  };
}

// exact (case-insensitive) match by name
async function fetchFoodByName(pool, name) {
  const sql = `
    SELECT foodID, name, origin, category, foodType, difficulty, dietaryTags,
           description, image, prepTime, culturalSignificance, traditionalPreparation,
           commonIngredients, alternative, altDescription, healthTips,
           Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg,
           likes_count, liked_by
    FROM food
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [name]);
  return rows?.[0] || null;
}

/**
 * POST /api/ai/analyze (SESSION REQUIRED)
 * - JSON { foodName }  -> DB lookup only (no AI)
 * - multipart/form-data { image } -> AI -> DB lookup by predicted label
 */
router.post("/analyze", requireLogin, upload.single("image"), async (req, res) => {
  const pool = req.app.get("dbPool");
  if (!pool) return res.status(500).json({ error: "DB not available" });

  try {
    // TEXT mode (DB only)
    if (req.body?.foodName && !req.file) {
      const name = String(req.body.foodName || "").trim();
      if (!name) return res.status(400).json({ error: "foodName is required" });

      const row = await fetchFoodByName(pool, name);
      if (!row) return res.status(404).json({ error: "Food not found in database" });

      return res.json(mapRowToResponse(row));
    }

    // IMAGE mode (AI -> DB)
    if (!req.file) return res.status(400).json({ error: "Provide foodName or upload image" });

    const fd = new FormData();
    fd.append("image", req.file.buffer, { filename: req.file.originalname });
    fd.append("model", req.body.model || "efficientnet"); // you chose EffB0 first

    const infer = await axios.post(INFERENCE_URL, fd, {
      headers: fd.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 30_000
    });

    const { foodName, confidence, model } = infer.data || {};
    if (!foodName) return res.status(502).json({ error: "Inference service did not return a label" });

    const row = await fetchFoodByName(pool, foodName);
    if (!row) {
      return res.status(404).json({
        error: "Predicted food not found in database",
        predicted: { foodName, confidence, model }
      });
    }

    return res.json(mapRowToResponse(row, { predicted: foodName, confidence, model }));
  } catch (err) {
    console.error("AI analyze error:", err?.response?.data || err);
    return res.status(500).json({ error: "Analyze failed", detail: String(err.message || err) });
  }
});

module.exports = router;
