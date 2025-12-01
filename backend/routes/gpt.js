const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // must be in Railway .env
});

// -------------------------------
// Utility: Validate / normalize base64 images
// -------------------------------
const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

function detectImageFormatFromDataUrl(str) {
  const m = str.match(/^data:image\/(png|jpe?g|gif|webp);base64,/i);
  return m ? m[1].toLowerCase() : null;
}

function detectImageFormatFromRawBase64(str) {
  try {
    const prefix = str.substring(0, 40).toLowerCase();
    if (prefix.includes("png")) return "png";
    if (prefix.includes("jpeg")) return "jpeg";
    if (prefix.includes("jpg")) return "jpg";
    if (prefix.includes("gif")) return "gif";
    if (prefix.includes("webp")) return "webp";
    return null;
  } catch {
    return null;
  }
}

/**
 * Normalize whatever the frontend sends into:
 *   { format, pureBase64, dataUrl }
 */
function normalizeImageBase64(imageBase64) {
  if (!imageBase64) return null;

  // Case 1: already a data URL: data:image/png;base64,AAAA...
  if (imageBase64.startsWith("data:")) {
    const fmt = detectImageFormatFromDataUrl(imageBase64);
    if (!fmt) return null;

    const pure = imageBase64.split(",")[1] || "";
    return {
      format: fmt,
      pureBase64: pure,
      dataUrl: imageBase64,
    };
  }

  // Case 2: raw base64 string without prefix
  const fmt = detectImageFormatFromRawBase64(imageBase64) || "png"; // default to png
  const dataUrl = `data:image/${fmt};base64,${imageBase64}`;
  return {
    format: fmt,
    pureBase64: imageBase64,
    dataUrl,
  };
}

// -------------------------------
// Fallback alternatives generator
// -------------------------------
function buildFallbackAlternatives(foodName = "", category = "") {
  const lower = (foodName || "").toLowerCase();
  const alts = [];

  // Very simple heuristics; you can tweak this later
  if (lower.includes("laksa")) {
    alts.push("Clear broth mee suah", "Vegetable soup noodles", "Grilled fish with ulam");
  } else if (lower.includes("mee") || lower.includes("noodle")) {
    alts.push("Kampua Mee (less oil)", "Kolo Mee (dry, less oil)", "Chicken soup noodles");
  } else if (category.toLowerCase().includes("rice")) {
    alts.push("Brown rice with grilled chicken", "Mixed vegetable rice (less oil)");
  } else {
    alts.push("Grilled fish with vegetables", "Vegetable soup with rice noodles");
  }

  // Ensure between 2–5 items
  return alts.slice(0, 5);
}

// ======================================================
// POST /api/ai/gpt/nutrition
// ======================================================
router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64, foodName, ingredients } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    // Normalize image input (supports both raw base64 and data URL)
    const normalized = normalizeImageBase64(imageBase64);
    if (!normalized) {
      return res.status(400).json({
        error: "Unsupported image format",
        details: `Allowed formats: ${JSON.stringify(ACCEPTED_FORMATS)}`,
      });
    }

    const { format, dataUrl } = normalized;

    if (!ACCEPTED_FORMATS.includes(format)) {
      return res.status(400).json({
        error: "Unsupported image format",
        details: `Allowed formats: ${JSON.stringify(ACCEPTED_FORMATS)}`,
      });
    }

    // -------------------------------
    // SYSTEM PROMPT: SARAWAK SPECIALIST
    // -------------------------------
    const systemPrompt = `
You are a Sarawak & Malaysian food nutrition expert.

Your goals:
- Correctly identify the dish (prefer Sarawak variants if possible).
- Provide realistic nutrition estimates for ONE typical portion.
- ALWAYS include at least 2 healthier alternative dishes.

Special requirements:
- "alternatives" MUST ALWAYS contain 2–5 entries.
- Alternatives must be real Malaysian or Sarawak dishes that are healthier
  OR lighter versions of the analyzed dish.
- Prefer local Sarawak dishes when suitable.

Output MUST be ONLY a valid JSON object with EXACTLY these keys:

{
  "food": "",
  "alternative_names": [],
  "confidence": 0.0,
  "portion_size": "",
  "calories_kcal": 0,
  "macros": {
    "protein_g": 0,
    "carbs_g": 0,
    "fat_g": 0
  },
  "ingredients": [],
  "category": "",
  "is_sarawak_local_dish": false,
  "health_notes": "",
  "assumptions": "",
  "alternatives": []  // length 2–5, each a string
}
`;

    // -------------------------------
    // USER PROMPT WITH HINT CONTEXT
    // -------------------------------
    const userPromptText =
      `Analyze this food image and return ONLY JSON.\n\n` +
      (foodName ? `User thinks it might be: "${foodName}". Treat this as a STRONG hint.\n` : "") +
      (ingredients ? `User listed these ingredients: ${ingredients}.\n` : "") +
      `Prefer Sarawak dish names whenever applicable.\n`;

    // -------------------------------
    // Generate nutrition analysis
    // -------------------------------
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1, // more deterministic
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPromptText },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    });

    let raw = response.choices?.[0]?.message?.content || "";

    // -------------------------------
    // Clean and parse JSON safely
    // -------------------------------
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    // If the model ever wraps JSON in extra text, try to slice between first { and last }
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.slice(firstBrace, lastBrace + 1);
    }

    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse failed, raw content:", raw);
      return res.status(500).json({
        error: "GPT returned invalid JSON",
        raw,
      });
    }

    // -------------------------------
    // Guarantee alternatives array (2–5 entries)
    // -------------------------------
    if (!Array.isArray(json.alternatives) || json.alternatives.length < 2) {
      json.alternatives = buildFallbackAlternatives(json.food, json.category);
    } else if (json.alternatives.length > 5) {
      json.alternatives = json.alternatives.slice(0, 5);
    }

    return res.status(200).json({ ok: true, data: json });
  } catch (err) {
    console.error("GPT Nutrition Error:", err);
    return res.status(500).json({
      error: "GPT analysis failed",
      details: err.message,
    });
  }
});

module.exports = router;
