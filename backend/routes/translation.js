const express = require("express");
const router = express.Router();

// POST /api/translate
// Body: { texts: { key: "string to translate", ... }, targetLang: "ms" }
// Returns: { translations: { key: "translated string", ... } }
router.post("/", async (req, res) => {
  const { texts, targetLang } = req.body;

  if (!texts || typeof texts !== "object" || Object.keys(texts).length === 0) {
    return res.status(400).json({ success: false, error: "No texts provided" });
  }

  if (targetLang !== "ms") {
    // If not BM, just return originals (no translation needed)
    return res.json({ success: true, translations: texts });
  }

  try {
    const entries = Object.entries(texts);

    // Build a numbered list for Claude to translate
    const numbered = entries
      .map(([key, val], i) => `${i + 1}. [${key}]: ${val}`)
      .join("\n");

    const prompt = `You are a translator. Translate the following texts to Bahasa Malaysia (Sarawak context). 
Keep food names as-is if they are traditional Sarawakian dish names (e.g. Laksa, Kolo Mee, Umai, Manok Pansoh).
Reply ONLY with a JSON object mapping each key to its translation. No extra text, no markdown.

Texts to translate:
${numbered}

Reply format: {"key1": "translation1", "key2": "translation2", ...}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.OPENAI_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return res.status(502).json({ success: false, error: "Translation API failed" });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "{}";

    // Strip markdown fences if present
    const clean = raw.replace(/```json|```/g, "").trim();
    const translations = JSON.parse(clean);

    return res.json({ success: true, translations });
  } catch (err) {
    console.error("Translation error:", err);
    return res.status(500).json({ success: false, error: "Translation failed" });
  }
});

module.exports = router;