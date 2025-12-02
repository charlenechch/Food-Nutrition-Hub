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

When estimating nutrition:
- Provide realistic calorie and macro estimates based on similar Malaysian dishes.
- NEVER return 0 unless the food genuinely contains zero calories (e.g., water).
- If unsure, provide your best estimate (do not use 0).
- All numeric fields MUST be numbers (no strings).

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
    const calories = safeNumber(gpt.calories_kcal);

    const protein =
      safeNumber(gpt.macros?.protein_g) ||
      safeNumber(gpt.protein_g);

    const carbs =
      safeNumber(gpt.macros?.carbs_g) ||
      safeNumber(gpt.carbs_g);

    const fat =
      safeNumber(gpt.macros?.fat_g) ||
      safeNumber(gpt.fat_g);

    const fiber = safeNumber(gpt.fiber_g);
    const vitaminC = safeNumber(gpt.vitaminC_mg);



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

// --------------------------------------------------------------
// GPT TEXT-ONLY NUTRITION ANALYSIS
// --------------------------------------------------------------
router.post("/text-nutrition", async (req, res) => {
  try {
    const { foodName, ingredients } = req.body;

    if (!foodName) {
      return res.status(400).json({ ok: false, error: "Food name required." });
    }

    const systemPrompt = `
You are a Sarawak Malaysian food expert and nutritionist.

You MUST return STRICT JSON.  
Never return 0 unless the food genuinely has 0.  
If unsure, estimate realistically.

JSON FORMAT:
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
    `;

    const userPrompt = `
Analyze this food based on the name and optional ingredients.  
Return ONLY JSON.

Food: ${foodName}
Ingredients: ${ingredients || "Not provided"}

Prefer Sarawak interpretation.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    let raw = completion.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json|```/g, "");
    raw = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

    let gpt;
    try {
      gpt = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ ok: false, error: "Invalid JSON", raw });
    }

    // Normalizing structure to match image endpoint return format
    const standard = {
      food: gpt.food || foodName,
      confidence: gpt.confidence || 0.8,
      portion_size: gpt.portion_size || "1 serving",
      nutrition: {
        Energy_kcal: gpt.calories_kcal,
        Protein_g: gpt.macros?.protein_g,
        Carbohydrates_g: gpt.macros?.carbs_g,
        Fat_g: gpt.macros?.fat_g,
        Fiber_g: gpt.fiber_g,
        VitaminC_mg: gpt.vitaminC_mg,
      },
      ingredients: gpt.ingredients || [],
      category: gpt.category || "",
      is_sarawak_local_dish: gpt.is_sarawak_local_dish || false,
      health_notes: gpt.health_notes || "",
      assumptions: gpt.assumptions || "",
      alternatives: gpt.alternatives || [],
    };

    return res.json({ ok: true, data: standard });

  } catch (err) {
    console.error("GPT TEXT Nutrition Error:", err);
    res.status(500).json({ ok: false, error: "GPT text analysis failed" });
  }
});


module.exports = router;
