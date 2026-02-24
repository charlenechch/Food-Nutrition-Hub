const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

// NORMALIZE BASE64 INPUT
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

function containsNutritionStuff(obj) {
      const s = JSON.stringify(obj).toLowerCase();
      return (
        s.includes("kcal") ||
        s.includes("calorie") ||
        s.includes("protein") ||
        s.includes("carb") ||
        s.includes("fat") ||
        s.includes("vitamin") ||
        /\b\d+(\.\d+)?\s?(kcal|cal|g|mg)\b/i.test(s)
      );
    }

// MAIN GPT ROUTE
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

    // PROMPTS
    const systemPrompt = `
You are a Sarawak Malaysian food identification assistant.

Goal:
- Identify the food/dish shown in the image.
- Provide alternative names / spellings commonly used in Malaysia/Sarawak.
- Provide a short assumptions note if uncertain.

CRITICAL RULES:
- DO NOT provide any nutrition values (no calories, macros, vitamins, grams, kcal, etc.).
- DO NOT estimate nutrition.
- Return STRICT JSON ONLY.
- No markdown. No extra text.

REQUIRED JSON FORMAT:
{
  "food_name": "string",
  "confidence": 0.0,
  "category": "string",
  "is_sarawak_local_dish": false,
  "alternative_names": [],
  "assumptions": "string"
}
`;

    const userPrompt = `
Identify the dish in this image. Return ONLY JSON.

${foodName ? `User hint: ${foodName}` : ""}
${ingredients ? `User-provided ingredients: ${ingredients}` : ""}

Prefer Sarawak/Malaysian interpretation.
`;

    // GPT CALL
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

  
    // CLEAN JSON OUTPUT
    let raw = completion.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json|```/g, "").trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return res.status(500).json({ error: "No JSON object returned by GPT", raw });
    }
    raw = raw.slice(start, end + 1);

    let gpt;
    try {
      gpt = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON returned by GPT", raw });
    }

    if (containsNutritionStuff(gpt)) {
      return res.status(500).json({
        error: "Nutrition values returned by model (not allowed).",
        raw: gpt
      });
    }

    const conf = typeof gpt.confidence === "number" ? gpt.confidence : 0.5;
    const confidence = Math.max(0, Math.min(1, conf));

    // BUILD FINAL RESPONSE OBJECT
    const standard = {
    food_name: gpt.food_name || "Unknown Food",
    confidence: confidence,
    category: gpt.category || "",
    is_sarawak_local_dish: !!gpt.is_sarawak_local_dish,
    alternative_names: Array.isArray(gpt.alternative_names) ? gpt.alternative_names : [],
    assumptions: gpt.assumptions || "",
    meta: { imageUsed: true }
  };

  return res.json({ ok: true, data: standard });
  } catch (err) {
    console.error("GPT Nutrition Error:", err);
    res.status(500).json({ error: "GPT analysis failed", details: err.message });
  }
});


module.exports = router;
