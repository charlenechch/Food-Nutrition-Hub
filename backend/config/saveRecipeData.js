const db = require("./db");

const saveRecipeData = [
  { recipeID: 1, userProfileID: 1 },
  { recipeID: 2, userProfileID: 1 },
  { recipeID: 3, userProfileID: 2 },
  { recipeID: 4, userProfileID: 2 },
  { recipeID: 5, userProfileID: 5 },
  { recipeID: 6, userProfileID: 5 },
  { recipeID: 7, userProfileID: 9 },
  { recipeID: 8, userProfileID: 9 },
  { recipeID: 9, userProfileID: 10 },
  { recipeID: 10, userProfileID: 10 },
  { recipeID: 1, userProfileID: 11 },
  { recipeID: 3, userProfileID: 11 },
  { recipeID: 5, userProfileID: 12 },
  { recipeID: 7, userProfileID: 12 },
  { recipeID: 9, userProfileID: 3 },
  { recipeID: 2, userProfileID: 6 },
  { recipeID: 4, userProfileID: 7 },
  { recipeID: 6, userProfileID: 8 },
  { recipeID: 8, userProfileID: 1 },
  { recipeID: 10, userProfileID: 2 }
];

(async () => {
  try {
    for (const save of saveRecipeData) {
      const sql = `
        INSERT INTO saveRecipe 
        (recipeID, userProfileID)
        VALUES (?, ?)
      `;
      const values = [
        save.recipeID,
        save.userProfileID
      ];

      await db.query(sql, values);
    }

    console.log("✅ All saveRecipe data inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting saveRecipe data:", err.message);
    process.exit(1);
  }
})();