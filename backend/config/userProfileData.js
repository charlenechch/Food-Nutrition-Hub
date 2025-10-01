import db from './db.js';
import { userProfile } from './dummyData.js';

function insertUserProfiles() {
  userProfile.forEach(profile => {
    const sql = `
      INSERT INTO userProfile (userID, preference, dietaryHabits, allergy)
      VALUES (?, ?, ?, ?)
    `;
    const values = [profile.userID, profile.preference, profile.dietaryHabits, profile.allergy];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(`Error inserting profile for userID ${profile.userID}:`, err);
        return;
      }
      console.log(`Inserted profile for userID ${profile.userID}`);
    });
  });
}

insertUserProfiles();