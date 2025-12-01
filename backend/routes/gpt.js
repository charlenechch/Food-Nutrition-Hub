const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Accepted image formats
const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

function normalizeImageBase64(imageBase64) {
  if (!imageBase64) return null;

  if (imageBase64.startsWith("data:")) {
    const match = imageBase64.match(/^data:image\/(png|jpe?g|gif|webp);base64,/i);
    if (!match) return null;

    return {
      format: match[1],
      dataUrl: imageBase64,
      pureBase64: imageBase64.split(",")[1]
    };
  }

  // raw base64
  return {
    format: "png",
    pureBase64: imageBase64,
    dataUrl: `data:image/png;base64,${imageBase64}`
  };
}

// fallback alternatives
function fallbackAlternatives(food = "") {
  const f = food.toLowerCase();
  if (f.includes("laksa")) {
    return ["Clear broth mee suah", "Vegetable soup noodles", "Fish bee hoon"];
  }
  if (f.includes("mee")) {
    return ["Kolo Mee (less oil)", "Kampua Mee (dry)", "Chicken soup mee suah"];
  }
  return ["Vegetable soup", "Grilled fish with ulam"];
}

// ======================================================
// MAIN GPT ROUTE
// ======================================================
router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64, foodName, ingredients } = req.body;

    if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

    const normalized = normalizeImageBase64(imageBase64);
    if (!normalized) return res.status(400).json({ error: "Invalid base64 image" });

    const { dataUrl, format } = normalized;

    if (!ACCEPTED_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Unsupported format" });
    }

    // ---------------- SYSTEM PROMPT ----------------
    const systemPrompt = `
You are a Sarawak Malaysian food expert + nutritionist.

Return ONLY VALID JSON matching EXACTLY this structure:

{
  "food": "",
  "confidence": 0.0,
  "portion_size": "",
  "calories_kcal": 0,
  "macros": { "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
  "ingredients": [],
  "category": "",
  "is_sarawak_local_dish": false,
  "health_notes": "",
  "assumptions": "",
  "alternative_names": [],
  "alternatives": []
}

Rules:
- ALWAYS fill alternatives with 2–5 healthier Malaysian/Sarawak dishes.
- Prefer Sarawak dishes where relevant.
- If unsure, guess but remain realistic.
`;

    // ------------ USER PROMPT --------------
    const userPrompt = `
Analyze this food image. Output ONLY JSON, nothing else.

${foodName ? `User hint: ${foodName}\n` : ""}
${ingredients ? `Ingredients provided: ${ingredients}\n` : ""}
Prefer Sarawak dish names whenever applicable.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ]
    });

    let raw = response.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json|```/g, "").trim();
    raw = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

    let gpt;
    try {
      gpt = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON", raw });
    }

    // ======================================================
    // NORMALIZE INTO STANDARD SCHEMA
    // ======================================================
    const mergedAlternatives = [
      ...(gpt.alternatives || []),
      ...(gpt.alternative_names || [])
    ].filter(Boolean);

    const standard = {
      food: gpt.food || "",
      confidence: gpt.confidence || 0.0,
      portion_size: gpt.portion_size || "1 serving",

      nutrition: {
        calories_kcal: gpt.calories_kcal || 0,
        protein_g: gpt.macros?.protein_g || 0,
        carbs_g: gpt.macros?.carbs_g || 0,
        fat_g: gpt.macros?.fat_g || 0,
        fiber_g: gpt.fiber_g || null,
        vitaminC_mg: gpt.vitaminC_mg || null,
      },

      ingredients: gpt.ingredients || [],
      category: gpt.category || "",
      is_sarawak_local_dish: gpt.is_sarawak_local_dish || false,
      health_notes: gpt.health_notes || "",
      assumptions: gpt.assumptions || "",

      alternatives:
        mergedAlternatives.length >= 2
          ? mergedAlternatives.slice(0, 5)
          : fallbackAlternatives(gpt.food),

      meta: {
        origin: gpt.origin || "",
        foodType: gpt.foodType || "",
        difficulty: gpt.difficulty || "",
        imageUsed: true,
      }
    };

    res.json({ ok: true, data: standard });

  } catch (err) {
    console.error("GPT error:", err);
    res.status(500).json({ error: "GPT analysis failed", details: err.message });
  }
});

module.exports = router;
