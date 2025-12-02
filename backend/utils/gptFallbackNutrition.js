const safeNumber = (v) =>
  isNaN(parseFloat(v)) ? null : parseFloat(v);

module.exports = async function getGPTFallbackNutrition(client, foodName) {
  const systemPrompt = `
You are a Sarawak Malaysian nutritionist.
Estimate nutrition for the food. 
Return STRICT JSON with numbers only:

{
  "food": "string",
  "portion_size": "string",
  "nutrition": {
    "Energy_kcal": 0,
    "Protein_g": 0,
    "Fat_g": 0,
    "Carbohydrates_g": 0,
    "Fiber_g": 0,
    "VitaminC_mg": 0
  },
  "alternatives": [
    { "title": "string", "description": "string" }
  ],
  "health_notes": "string"
}
`;

  const userPrompt = `Estimate nutrition for: ${foodName}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  let raw = completion.choices?.[0]?.message?.content || "";
  raw = raw.replace(/```json|```/g, "").trim();

  let g;
  try {
    g = JSON.parse(raw);
  } catch {
    return {
      food: foodName,
      portion_size: "1 serving",
      nutrition: {
        Energy_kcal: 300,
        Protein_g: 10,
        Fat_g: 10,
        Carbohydrates_g: 40,
        Fiber_g: 2,
        VitaminC_mg: 5,
      },
      alternatives: [],
      health_notes: "Fallback default values were used."
    };
  }

  // Ensure all numbers become numbers
  g.nutrition.Energy_kcal = safeNumber(g.nutrition.Energy_kcal);
  g.nutrition.Protein_g = safeNumber(g.nutrition.Protein_g);
  g.nutrition.Fat_g = safeNumber(g.nutrition.Fat_g);
  g.nutrition.Carbohydrates_g = safeNumber(g.nutrition.Carbohydrates_g);
  g.nutrition.Fiber_g = safeNumber(g.nutrition.Fiber_g);
  g.nutrition.VitaminC_mg = safeNumber(g.nutrition.VitaminC_mg);

  return g;
};
