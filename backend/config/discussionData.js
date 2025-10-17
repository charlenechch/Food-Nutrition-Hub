const db = require("./db"); 

const discussions = [
  // Linut discussions
  {
    foodID: 1,
    userProfileID: 2,
    content: "Linut brings back so many childhood memories! The texture is perfect when made right.",
    upVotes: 15,
    downVotes: 1
  },
  {
    foodID: 1,
    userProfileID: 5,
    content: "First time trying linut and it was quite interesting. The sambal really makes a difference!",
    upVotes: 8,
    downVotes: 3
  },

  // Kolo Mee discussions
  {
    foodID: 2,
    userProfileID: 1,
    content: "Best kolo mee I've ever had! The char siu was perfectly caramelized.",
    upVotes: 22,
    downVotes: 0
  },
  {
    foodID: 2,
    userProfileID: 9,
    content: "Good kolo mee but I prefer mine with more spring onions and fried shallots.",
    upVotes: 12,
    downVotes: 2
  },

  // Umai discussions
  {
    foodID: 3,
    userProfileID: 10,
    content: "Umai is so refreshing! The combination of fresh fish, onions, and chili is amazing.",
    upVotes: 18,
    downVotes: 4
  },
  {
    foodID: 3,
    userProfileID: 9,
    content: "A bit hesitant to try raw fish at first, but umai surprised me! Very flavorful.",
    upVotes: 11,
    downVotes: 5
  },

  // Nasi Aruk discussions
  {
    foodID: 4,
    userProfileID: 11,
    content: "Nasi aruk with fried chicken is the ultimate comfort food! So fragrant and delicious.",
    upVotes: 14,
    downVotes: 1
  },
  {
    foodID: 4,
    userProfileID: 12,
    content: "Love how the rice is fried without oil. Perfect breakfast to start the day!",
    upVotes: 9,
    downVotes: 0
  },

  // Asam Siok discussions
  {
    foodID: 5,
    userProfileID: 1,
    content: "The sour and spicy flavors in asam siok are perfectly balanced! Very appetizing.",
    upVotes: 13,
    downVotes: 2
  },
  {
    foodID: 5,
    userProfileID: 3,
    content: "Great with steamed rice. The fish was cooked perfectly in the sour broth.",
    upVotes: 7,
    downVotes: 1
  },

  // Belacan Bihun discussions
  {
    foodID: 6,
    userProfileID: 4,
    content: "The belacan (shrimp paste) flavor is strong but so addictive! Love this dish.",
    upVotes: 16,
    downVotes: 3
  },
  {
    foodID: 6,
    userProfileID: 10,
    content: "Perfect balance of spicy, savory, and a bit sweet. The bihun texture was just right.",
    upVotes: 10,
    downVotes: 1
  },

  // Daun Ubi Tumbuk discussions
  {
    foodID: 7,
    userProfileID: 5,
    content: "Daun ubi tumbuk with salted fish and sambal is a classic! Comfort food at its best.",
    upVotes: 11,
    downVotes: 2
  },
  {
    foodID: 7,
    userProfileID: 9,
    content: "Never thought cassava leaves could taste this good! The texture is unique.",
    upVotes: 8,
    downVotes: 2
  },

  // Manicai discussions
  {
    foodID: 8,
    userProfileID: 2,
    content: "Manicai stir-fried with garlic and dried shrimp is simple but delicious!",
    upVotes: 9,
    downVotes: 1
  },
  {
    foodID: 8,
    userProfileID: 6,
    content: "Healthy and tasty vegetable dish. Goes well with any main course.",
    upVotes: 6,
    downVotes: 0
  },

  // Midin Belacan discussions
  {
    foodID: 9,
    userProfileID: 7,
    content: "Midin belacan is my favorite Sarawak vegetable dish! The crunch is so satisfying.",
    upVotes: 20,
    downVotes: 1
  },
  {
    foodID: 9,
    userProfileID: 8,
    content: "The belacan sauce coats the midin perfectly. Always order this when available!",
    upVotes: 15,
    downVotes: 0
  },

  // Ayam Pansuh discussions
  {
    foodID: 10,
    userProfileID: 1,
    content: "Ayam pansuh cooked in bamboo is incredibly flavorful! The lemongrass and ginger really shine.",
    upVotes: 25,
    downVotes: 1
  },
  {
    foodID: 10,
    userProfileID: 10,
    content: "Authentic Iban cuisine! The bamboo gives the chicken a unique smoky aroma.",
    upVotes: 18,
    downVotes: 2
  }
];

(async () => {
  try {
    for (const discussion of discussions) {
      const sql = `
        INSERT INTO discussion 
        (foodID, userProfileID, content, created_At, upVotes, downVotes)
        VALUES (?, ?, ?, NOW(), ?, ?)
      `;
      const values = [
        discussion.foodID,
        discussion.userProfileID,
        discussion.content,
        discussion.upVotes,
        discussion.downVotes
      ];

      await db.query(sql, values);
    }

    console.log("✅ All data inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting data:", err.message);
    process.exit(1);
  }
})();
