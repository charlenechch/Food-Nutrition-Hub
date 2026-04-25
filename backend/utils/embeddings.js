// backend/utils/embeddings.js
const OpenAI = require("openai");
const { pool: db } = require("../config/db");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim(),
  });
  return response.data[0].embedding;
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ============================================
// ORIGINAL - searches against "embedding" column
// Strategy 2: name + description + commonIngredients
// ============================================
async function findClosestFood(queryText) {
  const queryVec = await generateEmbedding(queryText);

  const [rows] = await db.execute(
    `SELECT foodID, name, embedding FROM food WHERE embedding IS NOT NULL`
  );

  if (rows.length === 0) return null;

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
      continue;
    }
  }

  return best;
}

// ============================================
// ADDED - searches against "embedding_s1" column
// Strategy 1: name + description
// ============================================
async function findClosestFoodS1(queryText) {
  const queryVec = await generateEmbedding(queryText);

  const [rows] = await db.execute(
    `SELECT foodID, name, embedding_s1 FROM food WHERE embedding_s1 IS NOT NULL`
  );

  if (rows.length === 0) return null;

  let best = null;
  let bestScore = -1;

  for (const row of rows) {
    try {
      const foodVec = JSON.parse(row.embedding_s1);
      const score = cosineSimilarity(queryVec, foodVec);
      if (score > bestScore) {
        bestScore = score;
        best = { foodID: row.foodID, name: row.name, score };
      }
    } catch {
      continue;
    }
  }

  return best;
}

// ============================================
// ADDED - searches against "embedding_s3" column
// Strategy 3: name + description + commonIngredients + culturalSignificance
// ============================================
async function findClosestFoodS3(queryText) {
  const queryVec = await generateEmbedding(queryText);

  const [rows] = await db.execute(
    `SELECT foodID, name, embedding_s3 FROM food WHERE embedding_s3 IS NOT NULL`
  );

  if (rows.length === 0) return null;

  let best = null;
  let bestScore = -1;

  for (const row of rows) {
    try {
      const foodVec = JSON.parse(row.embedding_s3);
      const score = cosineSimilarity(queryVec, foodVec);
      if (score > bestScore) {
        bestScore = score;
        best = { foodID: row.foodID, name: row.name, score };
      }
    } catch {
      continue;
    }
  }

  return best;
}

// ============================================
// ORIGINAL embedFood - updates "embedding" column
// Strategy 2: name + description + commonIngredients
// ============================================
async function embedFood(foodID, name, description = "", commonIngredients = "") {
  const text = [name, description, commonIngredients].filter(Boolean).join(" | ");
  const vector = await generateEmbedding(text);

  await db.execute(
    `UPDATE food SET embedding = ?, embedding_text = ? WHERE foodID = ?`,
    [JSON.stringify(vector), text, foodID]
  );

  console.log(`✅ Embedded food: "${name}" (ID: ${foodID})`);
  console.log(`📝 Embedding text: "${text}"`);
}

// ============================================
// ADDED - updates "embedding_s1" column
// Strategy 1: name + description only
// ============================================
async function embedFoodS1(foodID, name, description = "") {
  const text = [name, description].filter(Boolean).join(" | ");
  const vector = await generateEmbedding(text);

  await db.execute(
    `UPDATE food SET embedding_s1 = ? WHERE foodID = ?`,
    [JSON.stringify(vector), foodID]
  );

  console.log(`✅ [S1] Embedded: "${name}" → "${text}"`);
}

// ============================================
// ADDED - updates "embedding_s3" column
// Strategy 3: name + description + commonIngredients + traditionalPreparation
// ============================================
async function embedFoodS3(foodID, name, description = "", commonIngredients = "", traditionalPreparation = "") {
  const text = [name, description, commonIngredients, traditionalPreparation].filter(Boolean).join(" | ");
  const vector = await generateEmbedding(text);

  await db.execute(
    `UPDATE food SET embedding_s3 = ? WHERE foodID = ?`,
    [JSON.stringify(vector), foodID]
  );

  console.log(`✅ [S3] Embedded: "${name}" → "${text}"`);
}


module.exports = {
  generateEmbedding,
  cosineSimilarity,
  findClosestFood,
  findClosestFoodS1,
  findClosestFoodS3,
  embedFood,
  embedFoodS1,
  embedFoodS3,
};