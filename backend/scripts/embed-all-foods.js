// backend/scripts/embed-all-foods.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { pool: db } = require("../config/db");
const { embedFood } = require("../utils/embeddings");

async function run() {
  console.log("🚀 Starting embedding generation for all foods...");

  const [rows] = await db.execute(
    `SELECT foodID, name, description FROM food WHERE embedding IS NULL`
  );

  console.log(`📋 Found ${rows.length} foods without embeddings`);

  for (const row of rows) {
    try {
      await embedFood(row.foodID, row.name, row.description || "");
      // Small delay to avoid hitting OpenAI rate limits
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ Failed to embed "${row.name}":`, err.message);
    }
  }

  console.log("✅ Done! All foods embedded.");
  process.exit(0);
}

run();