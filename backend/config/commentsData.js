const commentsData = [
  // Post 1 (Linut)
  { 
    postID: 1, 
    userProfileID: 2, 
    comment: "This brings back childhood memories! My grandma used to make this every Gawai." 
  },
  { 
    postID: 1, 
    userProfileID: 4, 
    comment: "Can you share the exact measurements for the sago flour?" 
  },
  { 
    postID: 1, 
    userProfileID: 6, 
    comment: "The sambal asam looks perfect! Love the color." 
  },

  // Post 2 (Kolo Mee)
  { 
    postID: 2, 
    userProfileID: 3, 
    comment: "Best Kolo Mee recipe I've tried! The fried shallots make all the difference." 
  },
  { 
    postID: 2, 
    userProfileID: 7, 
    comment: "How long do you usually cook the egg noodles?" 
  },
  { 
    postID: 2, 
    userProfileID: 9, 
    comment: "This tastes just like the ones in Kuching! 😋" 
  },
  { 
    postID: 2, 
    userProfileID: 1, 
    comment: "Can I substitute chicken for the minced meat?" 
  },

  // Post 3 (Umai)
  { 
    postID: 3, 
    userProfileID: 1, 
    comment: "Traditional Melanau dish! So refreshing in this hot weather." 
  },
  { 
    postID: 3, 
    userProfileID: 8, 
    comment: "What's the best type of prawns to use for this?" 
  },

  // Post 4 (Nasi Aruk)
  { 
    postID: 4, 
    userProfileID: 5, 
    comment: "The anchovies and garlic combo is heavenly! My Sarawakian breakfast staple." 
  },
  { 
    postID: 4, 
    userProfileID: 10, 
    comment: "Perfect way to use leftover rice. Never fails!" 
  },

  // Post 5 (Asam Siok)
  { 
    postID: 5, 
    userProfileID: 3, 
    comment: "Bamboo cooking gives such a unique flavor. True Bidayuh heritage!" 
  },
  { 
    postID: 5, 
    userProfileID: 7, 
    comment: "How do you prevent the bamboo from burning over the fire?" 
  },

  // Post 6 (Belacan Bihun)
  { 
    postID: 6, 
    userProfileID: 4, 
    comment: "The belacan aroma fills the whole house! Love it." 
  },
  { 
    postID: 6, 
    userProfileID: 8, 
    comment: "Can I use fresh shrimp instead of dried shrimp?" 
  },
  { 
    postID: 6, 
    userProfileID: 2, 
    comment: "This is my comfort food! Reminds me of home in Santubong." 
  },

  // Post 7 (Daun Ubi Tumbuk)
  { 
    postID: 7, 
    userProfileID: 5, 
    comment: "Pounded vegetables always taste better! Traditional way is the best." 
  },

  // Post 8 (Manicai)
  { 
    postID: 8, 
    userProfileID: 2, 
    comment: "Manicai with egg is my favorite combination! Simple yet delicious." 
  },
  { 
    postID: 8, 
    userProfileID: 6, 
    comment: "How long should I salt the leaves before cooking?" 
  },

  // Post 9 (Midin Belacan)
  { 
    postID: 9, 
    userProfileID: 3, 
    comment: "Midin season is the best! Fresh from the jungle." 
  },
  { 
    postID: 9, 
    userProfileID: 7, 
    comment: "The belacan looks perfectly toasted. Great technique!" 
  },
  { 
    postID: 9, 
    userProfileID: 1, 
    comment: "Can I use spinach if I can't find midin?" 
  },

  // Post 10 (Ayam Pansuh)
  { 
    postID: 10, 
    userProfileID: 4, 
    comment: "Authentic Iban cooking! The bamboo really makes a difference." 
  },
  { 
    postID: 10, 
    userProfileID: 9, 
    comment: "What type of bamboo works best for this dish?" 
  },
  { 
    postID: 10, 
    userProfileID: 10, 
    comment: "Perfect for special occasions! The smoky flavor is incredible." 
  }
];

const db = require("./db");

(async () => {
  try {
    for (const comment of commentsData) {
      const sql = `
        INSERT INTO comments (postID, userProfileID, comment)
        VALUES (?, ?, ?)
      `;
      
      const values = [
        comment.postID,
        comment.userProfileID,
        comment.comment,
      ];
      await db.query(sql, values);
    }

    console.log("✅ All comments inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting comments:", err.message);
    process.exit(1);
  }
})();