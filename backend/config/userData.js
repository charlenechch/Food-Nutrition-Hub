import db from './db.js';
import { userData } from './dummyData.js';

function insertUsers() {
  const sql = `
    INSERT INTO user (firstname, lastname, email, password, role)
    VALUES ?
  `;

  // Convert JSON array to array of arrays
  const values = userData.map(user => [
    user.firstname,
    user.lastname,
    user.email,
    user.password,
    user.role
  ]);

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('❌ Error inserting users:', err);
    } else {
      console.log(`✅ Successfully inserted ${result.affectedRows} users!`);
    }
    db.end();
  });
}

insertUsers();
