const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

// ------------------------------
// Base64 Normalization
// ------------------------------
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

  return {
    format: "png",
    pureBase64: imageBase64,
    dataUrl: `data:image/png;base64,${imageBase64}`
  };
}

// --------------------------------------------
// Fallback Alternatives (same dish tweaks)
// --------------------------------------------
function fallbackAlternatives(food = "") {
  const f = (food || "").toLowerCase();

  if (f.includes("laksa")) {
    return [
      { title: "Vegetable oil", description: "Use vegetable oil instead of lard to reduce saturated fat." },
      { title: "Chicken or shrimp", description: "Use lean proteins instead of fatty cuts." },
      { title: "Extra vegetables", description: "Increase bean sprouts and greens for more fibre." }
    ];
  }

  if (f.includes("mee") || f.includes("noodle")) {
    return [
      { title: "Less oil", description: "Reduce frying oil or choose dry-style noodles." },
      { title: "Lean protein", description: "Use chicken breast, tofu or fish." },
      { title: "More vegetables", description: "Add leafy greens and non-starchy vegetables." }
    ];
  }

  return [
    { title: "Reduce oil", description: "Lower fat content by reducing oil used." },
    { title: "Lean protein", description: "Choose chicken, tofu or fish." },
    { title: "Add vegetables", description: "Increase fibre by adding vegetables." }
  ];
}

// ========================================
//  GPT NUTRITION ROUTE
// ========================================
router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64, foodName, ingredients } = req.body;

    if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

    const normalized = normalizeImageBase64(imageBase64);
    if (!normalized) return res.status(400).json({ error: "Invalid base64 image" });

    const { dataUrl, format } = normalized;
    if (!ACCEPTED_FORMATS.includes(format)) {
      return res.status(400).json({ error: "Unsupported image format" });
    }

    // ---------------- SYSTEM PROMPT ----------------
    const systemPrompt = `
You are a Sarawak Malaysian food expert + nutritionist.

Return ONLY valid JSON that includes:
- calories_kcal (number)
- macros { protein_g, carbs_g, fat_g }
- alternatives (2–5 healthier tweaks, not different dishes)
- health notes
`;

    const userPrompt = `
Analyze this food image. Output ONLY JSON.

${foodName ? `User hint: ${foodName}\n` : ""}
${ingredients ? `Ingredients: ${ingredients}\n` : ""}
Prefer Sarawak interpretation.
`;

    // ---------------- GPT CALL ----------------
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

    // CLEAN JSON
    let raw = response.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json|```/g, "").trim();
    raw = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

    let gpt;
    try {
      gpt = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON", raw });
    }

    // =======================================
    // FIXED NUTRITION NORMALIZER
    // =======================================
    function safeNumber(v) {
      if (v === null || v === undefined) return null;
      if (typeof v === "number") return v;
      const n = parseFloat(String(v).replace(/[^\d.-]/g, ""));
      return isNaN(n) ? null : n;
    }

    const calories =
      safeNumber(gpt.calories_kcal) ||
      safeNumber(gpt.calories) ||
      safeNumber(gpt.energy_kcal) ||
      null;

    const protein =
      safeNumber(gpt.macros?.protein_g) ||
      safeNumber(gpt.protein_g) ||
      safeNumber(gpt.protein) ||
      null;

    const carbs =
      safeNumber(gpt.macros?.carbs_g) ||
      safeNumber(gpt.carbs_g) ||
      safeNumber(gpt.carbohydrates_g) ||
      null;

    const fat =
      safeNumber(gpt.macros?.fat_g) ||
      safeNumber(gpt.fat_g) ||
      safeNumber(gpt.fat) ||
      null;

    const fiber = safeNumber(gpt.fiber_g);
    const vitaminC = safeNumber(gpt.vitaminC_mg);

    // =======================================
    // NORMALIZE ALTERNATIVES
    // =======================================
    let merged = [
      ...(gpt.alternatives || []),
      ...(gpt.alternative_names || [])
    ].filter(Boolean);

    if (merged.length < 2) merged = fallbackAlternatives(gpt.food);

    merged = merged.map((alt) =>
      typeof alt === "string"
        ? { title: alt, description: "" }
        : {
            title: alt.title || alt.name || "",
            description: alt.description || alt.details || alt.note || ""
          }
    );

    // =======================================
    // FINAL RESPONSE
    // =======================================
    const standard = {
      food: gpt.food || "",
      confidence: gpt.confidence || 0,
      portion_size: gpt.portion_size || "1 serving",

      nutrition: {
        calories_kcal: calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        fiber_g: fiber,
        vitaminC_mg: vitaminC
      },

      ingredients: gpt.ingredients || [],
      category: gpt.category || "",
      is_sarawak_local_dish: gpt.is_sarawak_local_dish || false,
      health_notes: gpt.health_notes || "",
      assumptions: gpt.assumptions || "",

      alternatives: merged,
      meta: { imageUsed: true }
    };

    return res.json({ ok: true, data: standard });

  } catch (err) {
    console.error("GPT Nutrition Error:", err);
    res.status(500).json({ error: "GPT analysis failed", details: err.message });
  }
});

module.exports = router;
