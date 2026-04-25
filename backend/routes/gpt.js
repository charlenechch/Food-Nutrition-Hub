const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { many } = require("../config/db");
const { findClosestFood, findClosestFoodS1, findClosestFoodS3, findClosestFoodS4 } = require("../utils/embeddings");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ACCEPTED_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"];

// Thresholds
const EMB_HIGH_CONFIDENCE = 0.80;  // Very confident auto-match
const EMB_MID_CONFIDENCE  = 0.65;  // Auto-match but warn user
const EMB_LOW_CONFIDENCE  = 0.50;  // Show "Did you mean?"

function normalizeImageBase64(imageBase64) {
  if (!imageBase64) return null;
  if (imageBase64.startsWith("data:")) {
    const match = imageBase64.match(/^data:image\/(png|jpe?g|gif|webp);base64,/i);
    if (!match) return null;
    return { format: match[1], dataUrl: imageBase64 };
  }
  return { format: "png", dataUrl: `data:image/png;base64,${imageBase64}` };
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

// MAIN GPT ROUTE
router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64, foodName, ingredients } = req.body;

    if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

    const normalized = normalizeImageBase64(imageBase64);
    if (!normalized) return res.status(400).json({ error: "Invalid base64 image" });

    const { dataUrl, format } = normalized;
    if (!ACCEPTED_FORMATS.includes(format))
      return res.status(400).json({ error: "Unsupported image format" });

    // ============================================
    // STEP 1: GPT IDENTIFICATION
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
    // STEP 2: ENSEMBLE EMBEDDING SEARCH
    //
    // We search against 4 different DB embeddings
    // and average their scores for better accuracy:
    //
    // S1 (embedding_s1): name + desc
    // S2 (embedding):    name + desc + ingredients
    // S3 (embedding_s3): name + desc + ingredients + culturalSignificance
    // S4 (embedding_s4): name + desc + traditionalPreparations
    //
    // Query used for all 4: food name only (clean, no noise)
    // ============================================

    const queryText = gpt.food_name;
    console.log(`\n🔍 Searching all 4 embedding strategies for: "${queryText}"`);

    // Run all 4 searches in parallel
    const [resultS1, resultS2, resultS3, resultS4] = await Promise.all([
      findClosestFoodS1(queryText),  // searches embedding_s1
      findClosestFood(queryText),    // searches embedding (S2)
      findClosestFoodS3(queryText),  // searches embedding_s3
      findClosestFoodS4(queryText),  // searches embedding_s4
    ]);

    console.log(`📊 S1 (name+desc):              "${resultS1?.name}" → ${resultS1?.score?.toFixed(3)}`);
    console.log(`📊 S2 (name+desc+ingr):         "${resultS2?.name}" → ${resultS2?.score?.toFixed(3)}`);
    console.log(`📊 S3 (name+desc+ingr+culture): "${resultS3?.name}" → ${resultS3?.score?.toFixed(3)}`);
    console.log(`📊 S4 (name+desc+trad):         "${resultS4?.name}" → ${resultS4?.score?.toFixed(3)}`);

    // Group results by foodID and average their scores
    const scoreMap = {};
    for (const m of [resultS1, resultS2, resultS3, resultS4]) {
      if (!m) continue;
      if (!scoreMap[m.foodID]) {
        scoreMap[m.foodID] = { ...m, totalScore: 0, count: 0 };
      }
      scoreMap[m.foodID].totalScore += m.score;
      scoreMap[m.foodID].count += 1;
    }

    // Pick food with highest average score
    let bestMatch = null;
    for (const entry of Object.values(scoreMap)) {
      const avgScore = entry.totalScore / entry.count;
      if (!bestMatch || avgScore > bestMatch.score) {
        bestMatch = { ...entry, score: avgScore };
      }
    }

    console.log(`✅ Best match: "${bestMatch?.name}" (avg score: ${bestMatch?.score?.toFixed(3)})\n`);

    // ============================================
    // STEP 3: 3-TIER CONFIDENCE CHECK
    // ============================================

    if (bestMatch && bestMatch.score >= EMB_HIGH_CONFIDENCE) {
      // ✅ Very confident match
      const conf = typeof gpt.confidence === "number" ? Math.max(0, Math.min(1, gpt.confidence)) : 0.5;
      return res.json({
        ok: true,
        data: {
          food_name: bestMatch.name,
          foodID: bestMatch.foodID,
          confidence: conf,
          confidence_level: "high",
          similarity_score: bestMatch.score,
          category: gpt.category || "",
          is_sarawak_local_dish: !!gpt.is_sarawak_local_dish,
          alternative_names: Array.isArray(gpt.alternative_names) ? gpt.alternative_names : [],
          assumptions: gpt.assumptions || "",
          meta: { imageUsed: true, matchMethod: "gpt+embedding_ensemble" },
        },
      });
    }

    if (bestMatch && bestMatch.score >= EMB_MID_CONFIDENCE) {
      // ⚠️ Decent match — return result but warn frontend
      const conf = typeof gpt.confidence === "number" ? Math.max(0, Math.min(1, gpt.confidence)) : 0.5;
      return res.json({
        ok: true,
        data: {
          food_name: bestMatch.name,
          foodID: bestMatch.foodID,
          confidence: conf,
          confidence_level: "low",
          similarity_score: bestMatch.score,
          category: gpt.category || "",
          is_sarawak_local_dish: !!gpt.is_sarawak_local_dish,
          alternative_names: Array.isArray(gpt.alternative_names) ? gpt.alternative_names : [],
          assumptions: gpt.assumptions || "",
          meta: { imageUsed: true, matchMethod: "gpt+embedding_ensemble" },
        },
        warning: "Match confidence is moderate. Please verify the food name.",
      });
    }

    if (bestMatch && bestMatch.score >= EMB_LOW_CONFIDENCE) {
      // ❓ Weak match — ask user to confirm
      return res.json({
        ok: false,
        suggest: true,
        suggested_name: bestMatch.name,
        suggested_id: bestMatch.foodID,
        similarity_score: bestMatch.score,
        gpt_returned: gpt.food_name,
        message: `We think this might be "${bestMatch.name}". Is that correct?`,
      });
    }

    // ❌ Nothing matched
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