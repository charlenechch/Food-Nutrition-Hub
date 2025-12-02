module.exports = async function detectFoodName(client, dataUrl) {
  const systemPrompt = `
You are a Sarawak Malaysian food expert.
Your ONLY job is to IDENTIFY the food in the image.
Return STRICT JSON:

{
  "food": "string",
  "confidence": 0.0
}

DO NOT include any nutrition.
DO NOT describe the food.
Just the name.
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Identify the food." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  let raw = completion.choices?.[0]?.message?.content || "";
  raw = raw.replace(/```json|```/g, "").trim();

  try {
    const json = JSON.parse(raw);
    return json.food || null;
  } catch (err) {
    console.log("IdentifyFood JSON parse failed:", raw);
    return null;
  }
};
