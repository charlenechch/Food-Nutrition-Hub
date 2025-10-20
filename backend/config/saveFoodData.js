const db = require("./db");

const saveFoodData = [
  { foodID: 1, userProfileID: 1 },
  { foodID: 2, userProfileID: 1 },
  { foodID: 3, userProfileID: 2 },
  { foodID: 4, userProfileID: 2 },
  { foodID: 5, userProfileID: 5 },
  { foodID: 6, userProfileID: 5 },
  { foodID: 7, userProfileID: 9 },
  { foodID: 8, userProfileID: 9 },
  { foodID: 9, userProfileID: 10 },
  { foodID: 10, userProfileID: 10 },
  { foodID: 1, userProfileID: 3 },
  { foodID: 3, userProfileID: 3 },
  { foodID: 5, userProfileID: 4 },
  { foodID: 7, userProfileID: 4 },
  { foodID: 9, userProfileID: 6 },
  { foodID: 2, userProfileID: 7 },
  { foodID: 4, userProfileID: 8 },
  { foodID: 6, userProfileID: 8 },
  { foodID: 8, userProfileID: 1 },
  { foodID: 10, userProfileID: 2 }
];

(async () => {
  try {
    for (const save of saveFoodData) {
      const sql = `
        INSERT INTO saveFood 
        (foodID, userProfileID)
        VALUES (?, ?)
      `;
      const values = [
        save.foodID,
        save.userProfileID
      ];

      await db.query(sql, values);
    }

    console.log("✅ All saveFood data inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting saveFood data:", err.message);
    process.exit(1);
  }
})();