const likesData = [
  // Post 1 (Linut) - 5 likes
  { postID: 1, userProfileID: 2 },
  { postID: 1, userProfileID: 3 },
  { postID: 1, userProfileID: 4 },
  { postID: 1, userProfileID: 6 },
  { postID: 1, userProfileID: 8 },

  // Post 2 (Kolo Mee) - 8 likes
  { postID: 2, userProfileID: 1 },
  { postID: 2, userProfileID: 3 },
  { postID: 2, userProfileID: 5 },
  { postID: 2, userProfileID: 7 },
  { postID: 2, userProfileID: 9 },
  { postID: 2, userProfileID: 10 },
  { postID: 2, userProfileID: 4 },
  { postID: 2, userProfileID: 2 },

  // Post 3 (Umai) - 3 likes
  { postID: 3, userProfileID: 1 },
  { postID: 3, userProfileID: 2 },
  { postID: 3, userProfileID: 7 },

  // Post 4 (Nasi Aruk) - 6 likes
  { postID: 4, userProfileID: 1 },
  { postID: 4, userProfileID: 3 },
  { postID: 4, userProfileID: 5 },
  { postID: 4, userProfileID: 8 },
  { postID: 4, userProfileID: 10 },
  { postID: 4, userProfileID: 2 },

  // Post 5 (Asam Siok) - 4 likes
  { postID: 5, userProfileID: 2 },
  { postID: 5, userProfileID: 4 },
  { postID: 5, userProfileID: 9 },
  { postID: 5, userProfileID: 1 },

  // Post 6 (Belacan Bihun) - 7 likes
  { postID: 6, userProfileID: 1 },
  { postID: 6, userProfileID: 3 },
  { postID: 6, userProfileID: 5 },
  { postID: 6, userProfileID: 7 },
  { postID: 6, userProfileID: 8 },
  { postID: 6, userProfileID: 10 },
  { postID: 6, userProfileID: 2 },

  // Post 7 (Daun Ubi Tumbuk) - 2 likes
  { postID: 7, userProfileID: 4 },
  { postID: 7, userProfileID: 6 },

  // Post 8 (Manicai) - 5 likes
  { postID: 8, userProfileID: 1 },
  { postID: 8, userProfileID: 3 },
  { postID: 8, userProfileID: 7 },
  { postID: 8, userProfileID: 9 },
  { postID: 8, userProfileID: 5 },

  // Post 9 (Midin Belacan) - 9 likes
  { postID: 9, userProfileID: 1 },
  { postID: 9, userProfileID: 2 },
  { postID: 9, userProfileID: 3 },
  { postID: 9, userProfileID: 4 },
  { postID: 9, userProfileID: 5 },
  { postID: 9, userProfileID: 6 },
  { postID: 9, userProfileID: 8 },
  { postID: 9, userProfileID: 10 },
  { postID: 9, userProfileID: 7 },

  // Post 10 (Ayam Pansuh) - 6 likes
  { postID: 10, userProfileID: 2 },
  { postID: 10, userProfileID: 4 },
  { postID: 10, userProfileID: 6 },
  { postID: 10, userProfileID: 8 },
  { postID: 10, userProfileID: 10 },
  { postID: 10, userProfileID: 1 }
];


const db = require("./db");

(async () => {
  try {
    for (const like of likesData) {
      const sql = `
        INSERT INTO likes (postID, userProfileID)
        VALUES (?, ?)
      `;
      
      const values = [
        like.postID,
        like.userProfileID,
      ];
      await db.query(sql, values);
    }

    console.log("✅ All likes inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting likes:", err.message);
    process.exit(1);
  }
})();