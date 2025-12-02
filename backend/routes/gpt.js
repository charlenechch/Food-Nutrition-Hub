const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const db = require("../db"); // your DB connection
const detectFoodName = require("../utils/gptIdentifyFood");
const getGPTFallbackNutrition = require("../utils/gptFallbackNutrition");
const shapeResultFromDB = require("../utils/shapeResultFromDB");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------------------------------
// Normalize Base64
// -------------------------------------------
function normalizeBase64(imageBase64) {
  if (!imageBase64) return null;
  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }
  return `data:image/png;base64,${imageBase64}`;
}

// -------------------------------------------
// MAIN IMAGE → GPT → DB LOOKUP ENDPOINT
// -------------------------------------------
router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "Missing imageBase64" });
    }

    const dataUrl = normalizeBase64(imageBase64);

    // 1️⃣ STEP 1 — GPT identifies food name from the image
    const foodName = await detectFoodName(client, dataUrl);

    if (!foodName) {
      return res.json({
        ok: false,
        error: "GPT could not identify the food.",
      });
    }

    console.log("Identified food:", foodName);

    // 2️⃣ STEP 2 — Look for food in MySQL database
    const [rows] = await db.query(
      "SELECT * FROM foods WHERE name LIKE ?",
      [`%${foodName}%`]
    );

    // 3️⃣ STEP 3 — If found, return accurate DB nutrition
    if (rows.length > 0) {
      return res.json({
        ok: true,
        source: "database",
        data: shapeResultFromDB(rows[0])
      });
    }

    console.log("Food not found in DB → using GPT fallback nutrition");

    // 4️⃣ STEP 4 — If not found, get GPT estimated nutrition
    const fallback = await getGPTFallbackNutrition(client, foodName);

    return res.json({
      ok: true,
      source: "gpt_fallback",
      data: fallback,
    });

  } catch (err) {
    console.error("GPT Nutrition Error:", err);
    res.status(500).json({ ok: false, error: "GPT analysis failed" });
  }
});

module.exports = router;
