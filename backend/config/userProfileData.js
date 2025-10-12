const db = require("./db");

const userProfile = [
  {userID: 1, preference: "Low Sugar", dietaryHabits: "Pescatarian", allergy: "None"},
  {userID: 2, preference: "None", dietaryHabits: "Keto", allergy: "Honey"},
  {userID: 5, preference: "Balanced Diet", dietaryHabits: "Halal", allergy: "Peanuts"},
  {userID: 6, preference: "High Protein", dietaryHabits: "Pescatarian", allergy: "None"},
  {userID: 9, preference: "Healthy fats", dietaryHabits: "Vegan", allergy: "Shellfish"},
  {userID: 10, preference: "Balanced Diet", dietaryHabits: "Omnivore", allergy: "Milk"},
  {userID: 11, preference: "None", dietaryHabits: "Vegan", allergy: "None"},
  {userID: 12, preference: "Low Sugar", dietaryHabits: "Pescatarian", allergy: "Sesame"},
  {userID: 14, preference: "Balanced Diet", dietaryHabits: "Omnivore", allergy: "None"},
  {userID: 16, preference: "Low Carb Lifestyle", dietaryHabits: "Keto", allergy: "Soy"},
  {userID: 19, preference: "Healthy fats", dietaryHabits: "Pescatarian", allergy: "None"},
  {userID: 20, preference: "High Protein", dietaryHabits: "Halal", allergy: "Wheat"}
];

(async () => {
  try {
    for (const profile of userProfile) {
      const sql = `
        INSERT INTO userProfile (userID, preference, dietaryHabits, allergy)
        VALUES (?, ?, ?, ?)
      `;

      const values = [
        profile.userID,
        profile.preference,
        profile.dietaryHabits,
        profile.allergy,
      ];

      await db.query(sql, values);
      console.log(`✅ Inserted profile for userID ${profile.userID}`);
    }

    console.log("🎉 All dummy user profiles inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting user profiles:", err.message);
    process.exit(1);
  }
})();
