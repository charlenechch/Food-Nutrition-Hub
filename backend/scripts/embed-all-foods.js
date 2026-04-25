// backend/scripts/embed-all-foods.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { pool: db } = require("../config/db");
const { embedFood, embedFoodS1, embedFoodS3, embedFoodS4 } = require("../utils/embeddings");

async function run() {
  console.log("🚀 Starting embedding generation for all 4 strategies...");
  console.log("📌 Strategy 1 (S1): name + description             → embedding_s1");
  console.log("📌 Strategy 2 (S2): name + description + ingredients → embedding (existing)");
  console.log("📌 Strategy 3 (S3): name + description + ingredients + culturalSignificance → embedding_s3");
  console.log("");

  // Fetch all foods with all needed columns
  const [rows] = await db.execute(
    `SELECT foodID, name, description, commonIngredients, culturalSignificance, traditionalPreparation FROM food`
  );

  console.log(`📋 Found ${rows.length} foods to embed\n`);

  for (const row of rows) {
    try {
      console.log(`\n🍽️  Processing: "${row.name}" (ID: ${row.foodID})`);

      // Strategy 1: name + description → embedding_s1
      await embedFoodS1(
        row.foodID,
        row.name,
        row.description || ""
      );
      await new Promise(r => setTimeout(r, 200)); // avoid rate limit

      // Strategy 2: name + description + ingredients → embedding (existing column)
      await embedFood(
        row.foodID,
        row.name,
        row.description || "",
        row.commonIngredients || ""
      );
      await new Promise(r => setTimeout(r, 200));

      // Strategy 3: name + description + ingredients + culturalSignificance → embedding_s3
      await embedFoodS3(
        row.foodID,
        row.name,
        row.description || "",
        row.commonIngredients || "",
        row.traditionalPreparation || ""
      );
      await new Promise(r => setTimeout(r, 200));

      
    } catch (err) {
      console.error(`❌ Failed to embed "${row.name}":`, err.message);
    }
  }

  console.log("\n✅ Done! All 4 strategies embedded for all foods.");
  process.exit(0);
}

run();