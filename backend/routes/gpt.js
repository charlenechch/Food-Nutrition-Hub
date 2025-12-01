const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

// --------------------------------------------------------------
// NORMALIZE BASE64 INPUT
// --------------------------------------------------------------
function normalizeImageBase64(imageBase64) {
  if (!imageBase64) return null;

  if (imageBase64.startsWith("data:")) {
    const match = imageBase64.match(/^data:image\/(png|jpe?g|gif|webp);base64,/i);
    if (!match) return null;

    return {
      format: match[1],
      dataUrl: imageBase64,
      pureBase64: imageBase64.split(",")[1],
    };
  }

  return {
    format: "png",
    pureBase64: imageBase64,
    dataUrl: `data:image/png;base64,${imageBase64}`,
  };
}

// --------------------------------------------------------------
// FALLBACK ALTERNATIVES (dish tweaks)
// --------------------------------------------------------------
function fallbackAlternatives(food = "") {
  const f = (food || "").toLowerCase();

  if (f.includes("laksa")) {
    return [
      { title: "Use whole grain noodles", description: "Swap vermicelli with whole grain noodles for added fibre." },
      { title: "Low-fat coconut milk", description: "Use low-fat or diluted coconut milk to reduce calories." },
      { title: "Add leafy vegetables", description: "Increase bok choy or spinach for added nutrients." },
      { title: "Reduce oil", description: "Use less oil when preparing the broth." },
    ];
  }

  if (f.includes("mee") || f.includes("noodle")) {
    return [
      { title: "Use less oil", description: "Reduce frying oil to lower fat content." },
      { title: "Add vegetables", description: "Include more leafy greens for fibre." },
      { title: "Switch to lean proteins", description: "Choose chicken breast, tofu, or shrimp." },
    ];
  }

  return [
    { title: "Reduce oil", description: "Cut down cooking oil to reduce calories." },
    { title: "Add more vegetables", description: "Boost fibre with leafy greens and non-starchy vegetables." },
    { title: "Switch to lean protein", description: "Use tofu, chicken breast, or fish." },
  ];
}

// --------------------------------------------------------------
// SAFE NUMBER PARSER
// --------------------------------------------------------------
function safeNumber(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;

  // remove commas, units, dashes
  const cleaned = String(v).replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);

  return isNaN(n) ? null : n;
}


// --------------------------------------------------------------
// MAIN GPT ROUTE
// --------------------------------------------------------------
router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64, foodName, ingredients } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const normalized = normalizeImageBase64(imageBase64);
    if (!normalized) {
      return res.status(400).json({ error: "Invalid base64 image" });
    }

    const { dataUrl, format } = normalized;
    if (!ACCEPTED_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Unsupported image format" });
    }

    // ----------------------------------------------------------
    // PROMPTS
    // ----------------------------------------------------------
    const systemPrompt = `
You are a Sarawak Malaysian food expert + nutritionist.

You MUST return STRICT JSON.  
If you cannot estimate a number, ALWAYS return 0 — NOT null, NOT empty, NOT “—”.

REQUIRED JSON FORMAT (all fields mandatory):

{
  "food": "string",
  "confidence": 0.0,
  "portion_size": "string",
  "calories_kcal": 0,
  "macros": {
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 0
  },
  "fiber_g": 0,
  "vitaminC_mg": 0,
  "ingredients": [],
  "category": "string",
  "is_sarawak_local_dish": false,
  "health_notes": "string",
  "assumptions": "string",
  "alternative_names": [],
  "alternatives": [
    { "title": "string", "description": "string" }
  ]
}

RULES:
- ALL numeric fields must be numbers (example: 0, 120, 6.5).
- NEVER return "—", "unknown", "", or null for any number.
- If unsure, give a reasonable estimated number.
- Always include 2–5 healthier tweaks for the SAME dish (not different dishes).
- Use Sarawak Malaysian food context where applicable.
  }
    `;

    const userPrompt = `
Analyze this food image and return ONLY JSON.

${foodName ? `User hint: ${foodName}` : ""}
${ingredients ? `Ingredients: ${ingredients}` : ""}
Prefer Sarawak interpretation.
    `;

    // ----------------------------------------------------------
    // GPT CALL
    // ----------------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    // ----------------------------------------------------------
    // CLEAN JSON OUTPUT
    // ----------------------------------------------------------
    let raw = completion.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json|```/g, "").trim();
    raw = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

    let gpt;
    try {
      gpt = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON returned by GPT", raw });
    }

    // ----------------------------------------------------------
    // FIX NUTRITION FIELDS
    // ----------------------------------------------------------
    const calories =
    safeNumber(gpt.nutrition?.calories_kcal) ||
    safeNumber(gpt.calories_kcal) ||
    safeNumber(gpt.calories) ||
    safeNumber(gpt.energy_kcal) ||
    null;

  const protein =
    safeNumber(gpt.nutrition?.protein_g) ||
    safeNumber(gpt.macros?.protein_g) ||
    safeNumber(gpt.protein_g) ||
    null;

  const carbs =
    safeNumber(gpt.nutrition?.carbs_g) ||
    safeNumber(gpt.macros?.carbs_g) ||
    safeNumber(gpt.carbs_g) ||
    null;

  const fat =
    safeNumber(gpt.nutrition?.fat_g) ||
    safeNumber(gpt.macros?.fat_g) ||
    safeNumber(gpt.fat_g) ||
    null;

  const fiber =
    safeNumber(gpt.nutrition?.fiber_g) ||
    safeNumber(gpt.fiber_g) ||
    null;

  const vitaminC =
    safeNumber(gpt.nutrition?.vitaminC_mg) ||
    safeNumber(gpt.vitaminC_mg) ||
    null;


    // ----------------------------------------------------------
    // NORMALIZE ALTERNATIVES
    // ----------------------------------------------------------
    let altList = [...(gpt.alternatives || [])].filter(Boolean);

    if (altList.length < 2) {
      altList = fallbackAlternatives(gpt.food);
    }

    altList = altList.map((alt) =>
      typeof alt === "string"
        ? { title: alt, description: "" }
        : {
            title: alt.title || alt.name || "",
            description: alt.description || alt.details || alt.note || "",
          }
    );

    // ----------------------------------------------------------
    // BUILD FINAL RESPONSE OBJECT
    // ----------------------------------------------------------
    const standard = {
      food: gpt.food || "Unknown Food",
      confidence: gpt.confidence || 0,
      portion_size: gpt.portion_size || "1 serving",

      nutrition: {
        Energy_kcal: calories,
        Protein_g: protein,
        Carbohydrates_g: carbs,
        Fat_g: fat,
        Fiber_g: fiber,
        VitaminC_mg: vitaminC,
      },

      ingredients: gpt.ingredients || [],
      category: gpt.category || "",
      is_sarawak_local_dish: gpt.is_sarawak_local_dish || false,
      health_notes: gpt.health_notes || "",
      assumptions: gpt.assumptions || "",
      alternatives: altList,

      meta: {
        imageUsed: true,
      },
    };

    return res.json({ ok: true, data: standard });
  } catch (err) {
    console.error("GPT Nutrition Error:", err);
    res.status(500).json({ error: "GPT analysis failed", details: err.message });
  }
});

module.exports = router;
