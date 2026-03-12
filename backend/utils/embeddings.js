// backend/utils/embeddings.js
const OpenAI = require("openai");
const { pool: db } = require("../config/db");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate embedding vector for a text string
async function generateEmbedding(text) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim(),
  });
  return response.data[0].embedding; // array of floats
}

// Cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// Search DB for closest food match using embeddings
async function findClosestFood(queryText) {
  // Generate embedding for the query
  const queryVec = await generateEmbedding(queryText);

  // Fetch all foods that have embeddings
  const [rows] = await db.execute(
    `SELECT foodID, name, embedding FROM food WHERE embedding IS NOT NULL`
  );

  if (rows.length === 0) return null;

  // Score each food
  let best = null;
  let bestScore = -1;

  for (const row of rows) {
    try {
      const foodVec = JSON.parse(row.embedding);
      const score = cosineSimilarity(queryVec, foodVec);
      if (score > bestScore) {
        bestScore = score;
        best = { foodID: row.foodID, name: row.name, score };
      }
    } catch {
      continue; // skip malformed embeddings
    }
  }

  return best; // { foodID, name, score } or null
}

// Generate and save embedding for a single food row
async function embedFood(foodID, name, description = "") {
  const text = [name, description].filter(Boolean).join(" — ");
  const vector = await generateEmbedding(text);
  await db.execute(
    `UPDATE food SET embedding = ? WHERE foodID = ?`,
    [JSON.stringify(vector), text, foodID]
  );
  console.log(`✅ Embedded food: "${name}" (ID: ${foodID})`);
  console.log(`📝 Embedding text: "${text}"`);
}

module.exports = { generateEmbedding, cosineSimilarity, findClosestFood, embedFood };