const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // must be in Railway .env
});

// -------------------------------
// Utility: Validate base64 images
// -------------------------------
const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

function detectImageFormat(base64) {
  try {
    const prefix = base64.substring(0, 20);
    if (prefix.includes("png")) return "png";
    if (prefix.includes("jpg")) return "jpg";
    if (prefix.includes("jpeg")) return "jpeg";
    if (prefix.includes("gif")) return "gif";
    if (prefix.includes("webp")) return "webp";
    return null;
  } catch {
    return null;
  }
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

    // Validate file format
    const format = detectImageFormat(imageBase64);
    if (!format || !ACCEPTED_FORMATS.includes(format)) {
      return res.status(400).json({
        error: "Unsupported image format",
        details: `Allowed formats: ${JSON.stringify(ACCEPTED_FORMATS)}`
      });
    }

    // -------------------------------
    // SYSTEM PROMPT: SARAWAK SPECIALIST
    // -------------------------------
    const systemPrompt = `
You are a Sarawak & Malaysian food nutrition expert.

Your goals:
- Correctly identify the dish (prefer Sarawak variants).
- Provide realistic nutrition.
- ALWAYS include **at least 2 healthier alternative dishes**.

Special requirement:
- "alternatives" must ALWAYS contain 2–5 entries.
- Alternatives must be real Malaysian or Sarawak dishes that are healthier
  OR lighter versions of the analyzed dish.

Examples:
Laksa Sarawak → Alternatives: ["Clear broth mee suah", "Vegetable soup mee", "Fish bee hoon"]
Mee Goreng → Alternatives: ["Kampua Mee (less oil)", "Kolo Mee (dry)", "Chicken soup noodles"]

JSON schema MUST match exactly:

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
 "alternatives": []   // MUST contain 2–5 entries
}
`;


    // -------------------------------
    // USER PROMPT WITH HINT CONTEXT
    // -------------------------------
    const userPromptText =
      `Analyze this food image. Return ONLY JSON.\n\n` +
      (foodName ? `User thinks it might be: "${foodName}". Treat this as a strong hint.\n` : "") +
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
              image_url: { url: `data:image/${format};base64,${imageBase64}` }
            }
          ]
        }
      ]
    });

    let raw = response.choices?.[0]?.message?.content || "";

    // -------------------------------
    // Clean and parse JSON safely
    // -------------------------------
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        error: "GPT returned invalid JSON",
        raw
      });
    }

    return res.status(200).json({ ok: true, data: json });

  } catch (err) {
    console.error("GPT Nutrition Error:", err);
    return res.status(500).json({
      error: "GPT analysis failed",
      details: err.message
    });
  }
});

module.exports = router;
