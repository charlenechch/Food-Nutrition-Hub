const db = require("./db");

// recipeData.js
const postData = [
  {
    foodID: 1, //linut
    recipeID: 1,
    userProfileID: 1,
    status: "Approved",
    culturalStory: "My grandmother taught me that linut represents Sarawak unity - the sticky texture symbolizes how communities stick together. \
    We traditionally eat it with our hands during special ceremonies.",
    photos: "https://www.utusansarawak.com.my/wp-content/uploads/2020/10/IMG_2340-768x1024.jpg",
  },

  {
    foodID: 2, 
    recipeID: 2,
    userProfileID: 2,
    status: "Approved",
    culturalStory: "This Kolo Mee recipe has been passed down for three generations in my family.",
    photos: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/05/b5/fe/ta-img-20181013-103303.jpg?w=800&h=500&s=1,\
            https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiirkqX3PaDalZcCuRBOykHi8ZdOBnpVOVVw&s",
  },

  {
    foodID: 3, 
    recipeID: 3,
    userProfileID: 5,
    status: "Approved",
    culturalStory: "Umai is a traditional Melanau dish that represents our connection to the sea.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwzehkJVPp0aUwgOSAp8PM5K_TwxtFR8qiqw&s",
  },

  {
    foodID: 4, 
    recipeID: 4,
    userProfileID: 6,
    status: "Approved",
    culturalStory: "Nasi aruk was our family's breakfast staple - fried rice made from yesterday's leftovers. \
    My mother would wake before dawn to fry it with lots of garlic and anchovies, the aroma waking us up for school in our Kuching home.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJqvH2zx8Q0J8KgeCn5HS9BJ6gO8JzWB74-sRF3xzpyZNcqTrwonF5qRMZH0oCAKfiBM4&usqp=CAU",
  },

  {
    foodID: 5, 
    recipeID: 5,
    userProfileID: 6,
    status: "Approved",
    culturalStory: "Asam siok cooked in bamboo is traditional Bidayuh cooking at its finest. \
    We prepare this during Gawai, stuffing chicken with rice and cooking it over open fire, the bamboo giving it a unique smoky flavor from our ancestors.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHcEaC9XyybDBZYr_qhVwSyosh7RWMReXcwg&s",
  },

  {
    foodID: 6, 
    recipeID: 6,
    userProfileID: 9,
    status: "Approved",
    culturalStory: "This noodle dish showcases Sarawak's love for belacan. \
    My grandmother would toast the shrimp paste until fragrant, filling our kitchen with smells that reminded her of fishing villages along the Santubong coast.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMpwBPIkgryxoTxYcVj4Nd7OkFgg7y57h1TQ&s",
  },

  {
    foodID: 7, 
    recipeID: 7,
    userProfileID: 10,
    status: "Approved",
    culturalStory: "Pounded cassava leaves was our village's everyday vegetable. \
    The rhythmic pounding sound in the morning meant mothers were preparing lunch, mixing the leaves with turmeric and chili from our backyard garden.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTINNf1W2rW_ZKL3yLD9KTQ4V-y2hq94ybZvg&s",
  },

  {
    foodID: 8, 
    recipeID: 8,
    userProfileID: 11,
    status: "Approved",
    culturalStory: "Manicai stir-fried with garlic and egg was my comfort food after school. \
    This simple indigenous vegetable grows wild in Sarawak, and my mother taught me to salt it first to remove bitterness, just like her mother taught her.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRP1cSPw5Swe3hnZ7XXRtRzl1r6gIyq-JYnw&s",
  },

  {
    foodID: 9, 
    recipeID: 9,
    userProfileID: 12,
    status: "Approved",
    culturalStory: "Midin belacan is Sarawak's iconic jungle fern dish. \
    We forage for midin after rain when the ferns are tender, then stir-fry with fiery belacan - a taste that reminds me of family meals in our Kuching home.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQq3aWb_8yhfnKB4QxRo6u6Da2i8nt6rXrB-g&s",
  },

  {
    foodID: 10, 
    recipeID: 10,
    userProfileID: 5,
    status: "Approved",
    culturalStory: "Ayam pansuh cooked in bamboo is true Iban heritage. \
    My father would prepare this for special occasions, stuffing chicken with lemongrass and cooking over open fire, the bamboo giving it a smoky flavor that connects us to our longhouse traditions.",
    photos: "https://i.ytimg.com/vi/43WhAxBuppQ/sddefault.jpg",
  },
];

(async () => {
  try {
    for (const posts of postData) {
    const sql = `
      INSERT INTO posts (foodID, recipeID, userProfileID, status, culturalStory, photos)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      posts.foodID,
      posts.recipeID,
      posts.userProfileID,
      posts.status,
      posts.culturalStory,
      posts.photos,
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
