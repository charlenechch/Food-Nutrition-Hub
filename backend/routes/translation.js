const express = require("express");
const router = express.Router();

// POST /api/translate
// Body: { texts: { key: "string to translate", ... }, targetLang: "ms" }
// Returns: { success: true, translations: { key: "translated string", ... } }
router.post("/", async (req, res) => {
  let { texts, targetLang } = req.body;

  // HPP middleware may stringify nested objects — parse if needed
  if (typeof texts === "string") {
    try { texts = JSON.parse(texts); } catch { texts = null; }
  }

  if (!texts || typeof texts !== "object" || Object.keys(texts).length === 0) {
    return res.status(400).json({ success: false, error: "No texts provided" });
  }

  if (targetLang !== "ms") {
    // No translation needed — return originals
    return res.json({ success: true, translations: texts });
  }

  try {
    const entries = Object.entries(texts);

    // Build a numbered list for the AI to translate
    const numbered = entries
      .map(([key, val], i) => `${i + 1}. [${key}]: ${val}`)
      .join("\n");

    const prompt = `You are a translator specializing in Malaysian Bahasa Malaysia (Sarawak context).
Translate the following texts to Bahasa Malaysia.
Keep traditional Sarawakian food names as-is (e.g. Laksa, Kolo Mee, Umai, Manok Pansoh, Midin, Pansoh).
Reply ONLY with a valid JSON object mapping each key to its Bahasa Malaysia translation.
No extra text, no markdown, no code fences.

Texts:
${numbered}

Reply format: {"key1": "translation1", "key2": "translation2"}`;

    // ---- OpenAI GPT-4o-mini ----
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", err);
      return res.status(502).json({ success: false, error: "Translation API failed" });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const translations = JSON.parse(clean);

    return res.json({ success: true, translations });

  } catch (err) {
    console.error("Translation error:", err);
    return res.status(500).json({ success: false, error: "Translation failed" });
  }
});

module.exports = router;