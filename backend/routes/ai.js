const express = require("express");
const router = express.Router();

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
    alternative: row.alternative,
    altDescription: row.altDescription,
    healthTips: row.healthTips,
    Energy_kcal: row.Energy_kcal,
    Protein_g: row.Protein_g,
    Fat_g: row.Fat_g,
    Carbohydrates_g: row.Carbohydrates_g,
    Fiber_g: row.Fiber_g,
    VitaminC_mg: row.VitaminC_mg,
    likes_count: row.likes_count,
    liked_by: row.liked_by,
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
// Accepts { imageBase64 } — same pattern as GPT route, no extra dependencies
router.post("/cnn-predict", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.json({ pred_class: null, confidence: 0, error: "No image received" });
    }

    // Convert base64 data URL to raw buffer
    const matches = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return res.json({ pred_class: null, confidence: 0, error: "Invalid base64 format" });
    }
    const mimeType = `image/${matches[1]}`;
    const buffer = Buffer.from(matches[2], "base64");

    const cnnUrl = (process.env.CNN_API_URL || "https://ai-production-e158.up.railway.app").replace(/\/$/, "");

    // Build multipart form for the Python FastAPI /predict endpoint
    const boundary = "----FormBoundary" + Date.now();
    const CRLF = "\r\n";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="file"; filename="food.jpg"${CRLF}` +
        `Content-Type: ${mimeType}${CRLF}${CRLF}`
      ),
      buffer,
      Buffer.from(`${CRLF}--${boundary}--${CRLF}`),
    ]);

    const cnnRes = await fetch(`${cnnUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      body,
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