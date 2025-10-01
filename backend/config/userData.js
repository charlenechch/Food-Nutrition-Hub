import db from './db.js';
import { userData } from './dummyData.js';

function insertUsers() {
  let index = 0;

  function insertNext() {
    if (index >= userData.length) {
      console.log('✅ Finished inserting all users!');
      db.end();
      return;
    }

    const user = userData[index];
    const sql = `
      INSERT INTO user (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
    const values = [user.username, user.email, user.password, user.role];

    db.query(sql, values, (err) => {
      if (err) {
        console.error(`❌ Error inserting user ${user.username}:`, err);
      } else {
        console.log(`Inserted user ${index + 1}: ${user.username}`);
      }
      index++;
      insertNext();
    });
  }

  insertNext();
}

insertUsers();
