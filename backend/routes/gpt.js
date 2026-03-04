const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { many } = require("../config/db");
const { findClosestFood } = require("../utils/embeddings");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

// Thresholds
const CNN_HIGH_CONFIDENCE = 0.75;  // Trust CNN result directly
const EMB_HIGH_CONFIDENCE = 0.82;  // Trust embedding match
const EMB_LOW_CONFIDENCE  = 0.60;  // Show "Did you mean?"

const CNN_API_URL = process.env.CNN_API_URL || "https://ai-production-e158.up.railway.app";

function normalizeImageBase64(imageBase64) {
  if (!imageBase64) return null;
  if (imageBase64.startsWith("data:")) {
    const match = imageBase64.match(/^data:image\/(png|jpe?g|gif|webp);base64,/i);
    if (!match) return null;
    return { format: match[1], dataUrl: imageBase64, pureBase64: imageBase64.split(",")[1] };
  }
  return { format: "png", dataUrl: `data:image/png;base64,${imageBase64}`, pureBase64: imageBase64 };
}

function containsNutritionStuff(obj) {
  const s = JSON.stringify(obj).toLowerCase();
  return (
    s.includes("kcal") || s.includes("calorie") || s.includes("protein") ||
    s.includes("carb") || s.includes("fat") || s.includes("vitamin") ||
    /\b\d+(\.\d+)?\s?(kcal|cal|g|mg)\b/i.test(s)
  );
}

async function getFoodListFromDB() {
  try {
    const rows = await many(`SELECT name FROM food`);
    return rows.map(r => r.name).filter(Boolean);
  } catch (err) {
    console.error("Failed to fetch food list from DB:", err);
    return [];
  }
}

// ✅ STEP 1: Try CNN first
async function tryWithCNN(pureBase64, format) {
  try {
    const mimeType = format === "jpg" ? "jpeg" : format;
    const blob = Buffer.from(pureBase64, "base64");

    const formData = new FormData();
    formData.append("file", new Blob([blob], { type: `image/${mimeType}` }), `upload.${format}`);

    const response = await fetch(`${CNN_API_URL}/predict`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) return null;

    const data = await response.json();
    console.log(`🤖 CNN result: "${data.pred_class}" (confidence: ${data.confidence?.toFixed(3)})`);

    return data; // { pred_class, confidence, nutrition, ... }
  } catch (err) {
    console.warn("⚠️ CNN call failed, falling back to GPT:", err.message);
    return null;
  }
}

// MAIN GPT ROUTE
router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64, foodName, ingredients } = req.body;

    if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

    const normalized = normalizeImageBase64(imageBase64);
    if (!normalized) return res.status(400).json({ error: "Invalid base64 image" });

    const { dataUrl, format, pureBase64 } = normalized;
    if (!ACCEPTED_FORMATS.includes(format))
      return res.status(400).json({ error: "Unsupported image format" });

    // ============================================
    // STEP 1: TRY CNN FIRST (fast, accurate for 7 foods)
    // ============================================
    const cnnResult = await tryWithCNN(pureBase64, format);

    if (cnnResult?.pred_class && cnnResult.confidence >= CNN_HIGH_CONFIDENCE) {
      console.log(`✅ CNN high confidence match: "${cnnResult.pred_class}"`);
      return res.json({
        ok: true,
        data: {
          food_name: cnnResult.pred_class,
          confidence: cnnResult.confidence,
          category: cnnResult.category || "",
          is_sarawak_local_dish: true,
          alternative_names: cnnResult.alternative
            ? cnnResult.alternative.split(",").map(s => s.trim())
            : [],
          assumptions: "",
          meta: { imageUsed: true, matchMethod: "cnn" },
        },
      });
    }

    console.log(`⚠️ CNN low/no confidence (${cnnResult?.confidence?.toFixed(3) ?? "n/a"}), falling back to GPT...`);

    // ============================================
    // STEP 2: GPT IDENTIFICATION
    // ============================================
    const foodList = await getFoodListFromDB();
    const foodListStr = foodList.length > 0
      ? foodList.map(f => `"${f}"`).join(", ")
      : "No list available — use your best judgment";

    const systemPrompt = `
You are a Sarawak Malaysian food identification assistant.

These foods exist in the database (use as reference):
[${foodListStr}]

Goal:
- Identify the food shown in the image.
- If it matches something from the reference list, prefer that name.
- If unsure, describe what you see as clearly as possible.
- Provide alternative names / spellings used in Malaysia/Sarawak.
- Provide a short assumptions note if uncertain.

CRITICAL RULES:
- If the image clearly contains no food, return food_name as "not_food".
- DO NOT provide any nutrition values.
- Return STRICT JSON ONLY. No markdown. No extra text.

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

    let raw = completion.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json|```/g, "").trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start)
      return res.status(500).json({ error: "No JSON object returned by GPT", raw });

    let gpt;
    try {
      gpt = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return res.status(500).json({ error: "Invalid JSON returned by GPT", raw });
    }

    if (containsNutritionStuff(gpt))
      return res.status(500).json({ error: "Nutrition values returned by model (not allowed)." });

    if ((gpt.food_name || "").toLowerCase().trim() === "not_food")
      return res.json({ ok: false, error: "No food detected in the image." });

    // ============================================
    // STEP 3: EMBEDDING SEARCH on GPT output
    // ============================================
    const queryText = [
      gpt.food_name,
      ...(gpt.alternative_names || []),
      gpt.assumptions || "",
    ].filter(Boolean).join(" ");

    console.log(`🔍 Embedding search for: "${queryText}"`);
    const match = await findClosestFood(queryText);
    console.log(`📊 Best match: "${match?.name}" (score: ${match?.score?.toFixed(3)})`);

    if (match && match.score >= EMB_HIGH_CONFIDENCE) {
      const conf = typeof gpt.confidence === "number" ? Math.max(0, Math.min(1, gpt.confidence)) : 0.5;
      return res.json({
        ok: true,
        data: {
          food_name: match.name,
          foodID: match.foodID,
          confidence: conf,
          similarity_score: match.score,
          category: gpt.category || "",
          is_sarawak_local_dish: !!gpt.is_sarawak_local_dish,
          alternative_names: Array.isArray(gpt.alternative_names) ? gpt.alternative_names : [],
          assumptions: gpt.assumptions || "",
          meta: { imageUsed: true, matchMethod: "gpt+embedding" },
        },
      });
    }

    if (match && match.score >= EMB_LOW_CONFIDENCE) {
      return res.json({
        ok: false,
        suggest: true,
        suggested_name: match.name,
        suggested_id: match.foodID,
        similarity_score: match.score,
        gpt_returned: gpt.food_name,
        message: `We think this might be "${match.name}". Is that correct?`,
      });
    }

    return res.json({
      ok: false,
      error: "Food not recognized from the available database.",
      gpt_returned: gpt.food_name,
      suggestion: "Try a clearer image or type the food name manually.",
    });

  } catch (err) {
    console.error("GPT Nutrition Error:", err);
    res.status(500).json({ error: "GPT analysis failed", details: err.message });
  }
});

module.exports = router;

