const express = require("express");
const router = express.Router();
const FormData = require("form-data");

// maps DB row → JSON used by UI
function mapRow(row) {
  if (!row) return null;
  return {
    foodID: row.foodID,
    name: row.name,
    origin: row.origin,
    category: row.category,
    foodType: row.foodType,
    difficulty: row.difficulty,
    dietaryTags: row.dietaryTags,
    description: row.description,
    image: row.image,
    prepTime: row.prepTime,
    culturalSignificance: row.culturalSignificance,
    traditionalPreparation: row.traditionalPreparation,
    commonIngredients: row.commonIngredients,
    healthTips: row.healthTips,
    Energy_kcal: row.Energy_kcal,
    Protein_g: row.Protein_g,
    Fat_g: row.Fat_g,
    Carbohydrates_g: row.Carbohydrates_g,
    Fiber_g: row.Fiber_g,
    VitaminC_mg: row.VitaminC_mg,
    likes_count: row.likes_count,
    liked_by: row.liked_by,
    gram_per_serving: row.gram_per_serving,
  };
}

// GET /api/ai/lookup?name=Kolo%20Mee
router.get("/lookup", async (req, res) => {
  const name = (req.query.name || "").trim();
  if (!name) return res.json({ found: false, suggestions: [] });

  try {
    const db = req.app.get("dbPool");

    const [exact] = await db.execute(
      "SELECT * FROM food WHERE LOWER(name)=LOWER(?) LIMIT 1",
      [name]
    );
    if (exact.length) {
      return res.json({ found: true, item: mapRow(exact[0]) });
    }

    const [rows] = await db.execute(
      "SELECT name FROM food WHERE name LIKE ? ORDER BY name LIMIT 8",
      [`%${name}%`]
    );
    return res.json({
      found: false,
      suggestions: rows.map((r) => r.name),
    });
  } catch (err) {
    console.error("lookup error:", err);
    return res.status(500).json({ found: false, suggestions: [] });
  }
});

// GET /api/ai/cnn-wake — wakes the CNN service and checks health
router.get("/cnn-wake", async (req, res) => {
  try {
    const response = await fetch(`${process.env.CNN_API_URL}/health`, {
      signal: AbortSignal.timeout(30000)
    });
    const data = await response.json();
    res.json({ ok: true, cnn: data });
  } catch (err) {
    res.json({ ok: false, message: err.message });
  }
});

// POST /api/ai/cnn-predict — proxy image to CNN service
// Frontend sends multipart form with "file" field
// Node forwards it to the Python CNN service (no CSP issues)
router.post("/cnn-predict", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.json({ pred_class: null, confidence: 0, error: "No file received" });
    }

    const file = req.files.file;
    const cnnUrl = process.env.CNN_API_URL || "https://ai-production-e158.up.railway.app/";

    const form = new FormData();
    form.append("file", file.data, {
      filename: file.name,
      contentType: file.mimetype,
    });

    const cnnRes = await fetch(`${cnnUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      signal: AbortSignal.timeout(15000),
    });

    if (!cnnRes.ok) {
      return res.json({ pred_class: null, confidence: 0, error: "CNN service error" });
    }

    const data = await cnnRes.json();
    return res.json(data);

  } catch (err) {
    console.warn("CNN proxy error (falling back to GPT):", err.message);
    return res.json({ pred_class: null, confidence: 0, error: err.message });
  }
});

// POST /api/ai/analyze  { food_name, ingredients }
router.post("/analyze", async (req, res) => {
  const foodName = (req.body.food_name || "").trim();

  try {
    const db = req.app.get("dbPool");

    if (foodName) {
      const [rows] = await db.execute(
        "SELECT * FROM food WHERE LOWER(name)=LOWER(?) LIMIT 1",
        [foodName]
      );
      if (rows.length) {
        return res.json({ found: true, item: mapRow(rows[0]) });
      }

      const [sug] = await db.execute(
        "SELECT name FROM food WHERE name LIKE ? ORDER BY name LIMIT 8",
        [`%${foodName}%`]
      );
      return res.json({
        found: false,
        suggestions: sug.map((r) => r.name),
        message: "No exact match. Pick a suggestion.",
      });
    }

    return res.json({ found: false, suggestions: [], message: "Please enter a food name or upload an image." });
  } catch (err) {
    console.error("analyze error:", err);
    return res.status(500).json({ found: false, message: "Server error" });
  }
});

module.exports = router;