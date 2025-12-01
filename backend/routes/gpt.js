// routes/gpt.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Safe JSON parsing
function tryParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

router.post("/nutrition", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Return ONLY a valid JSON object.

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
 "assumptions": ""
}

If unsure, estimate the closest Sarawak or Malaysian dish.
`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this food and estimate nutrition. Return STRICT JSON." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    const json = tryParse(raw);

    if (!json) {
      return res.status(500).json({ error: "GPT returned invalid JSON", raw });
    }

    res.json({ ok: true, data: json });

  } catch (err) {
    console.error("GPT ERROR:", err);
    res.status(500).json({ error: "GPT analysis failed", details: err.message });
  }
});

router.get("/test", (req, res) => {
  res.json({ ok: true, message: "GPT route is working!" });
});


module.exports = router;
