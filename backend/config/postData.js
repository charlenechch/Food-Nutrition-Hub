const db = require("./db");

// recipeData.js
const postData = [
  {
    foodName: "Linut",
    origin: "Melanau",
    userProfileID: 1,
    status: "Approved",
    culturalStory: "My grandmother taught me that linut represents Sarawak unity - the sticky texture symbolizes how communities stick together. \
    We traditionally eat it with our hands during special ceremonies.",
    photos: "https://www.utusansarawak.com.my/wp-content/uploads/2020/10/IMG_2340-768x1024.jpg",
    recipe: "",
  },

  {
    foodName: "Kolo Mee",
    origin: "Chinese",
    userProfileID: 2,
    status: "Approved",
    culturalStory: "This Kolo Mee recipe has been passed down for three generations in my family.",
    photos: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/05/b5/fe/ta-img-20181013-103303.jpg?w=800&h=500&s=1,\
            https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiirkqX3PaDalZcCuRBOykHi8ZdOBnpVOVVw&s",
    recipe: "",
  },

  {
    foodName: "Umai",
    origin: "Melanau",
    userProfileID: 3,
    status: "Approved",
    culturalStory: "Umai is a traditional Melanau dish that represents our connection to the sea.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwzehkJVPp0aUwgOSAp8PM5K_TwxtFR8qiqw&s",
    recipe: "",
  },

  {
    foodName: "Nasi Aruk",
    origin: "Melayu",
    userProfileID: 4,
    status: "Approved",
    culturalStory: "Nasi aruk was our family's breakfast staple - fried rice made from yesterday's leftovers. \
    My mother would wake before dawn to fry it with lots of garlic and anchovies, the aroma waking us up for school in our Kuching home.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJqvH2zx8Q0J8KgeCn5HS9BJ6gO8JzWB74-sRF3xzpyZNcqTrwonF5qRMZH0oCAKfiBM4&usqp=CAU",
    recipe: "",
  },

  {
    foodName: "Asam Siok",
    origin: "Bidayuh",
    userProfileID: 5,
    status: "Approved",
    culturalStory: "Asam siok cooked in bamboo is traditional Bidayuh cooking at its finest. \
    We prepare this during Gawai, stuffing chicken with rice and cooking it over open fire, the bamboo giving it a unique smoky flavor from our ancestors.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHcEaC9XyybDBZYr_qhVwSyosh7RWMReXcwg&s",
    recipe: "",
  },

  {
    foodName: "Belacan Bihun",
    origin: "Chinese",
    userProfileID: 6,
    status: "Approved",
    culturalStory: "This noodle dish showcases Sarawak's love for belacan. \
    My grandmother would toast the shrimp paste until fragrant, filling our kitchen with smells that reminded her of fishing villages along the Santubong coast.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMpwBPIkgryxoTxYcVj4Nd7OkFgg7y57h1TQ&s",
    recipe: "",
  },

  {
    foodName: "Daun Ubi Tumbuk",
    origin: "Iban",
    userProfileID: 10,
    status: "Approved",
    culturalStory: "Pounded cassava leaves was our village's everyday vegetable. \
    The rhythmic pounding sound in the morning meant mothers were preparing lunch, mixing the leaves with turmeric and chili from our backyard garden.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTINNf1W2rW_ZKL3yLD9KTQ4V-y2hq94ybZvg&s",
    recipe: "",
  },

  {
    foodName: "Manicai",
    origin: "Chinese",
    userProfileID: 7,
    status: "Approved",
    culturalStory: "Manicai stir-fried with garlic and egg was my comfort food after school. \
    This simple indigenous vegetable grows wild in Sarawak, and my mother taught me to salt it first to remove bitterness, just like her mother taught her.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRP1cSPw5Swe3hnZ7XXRtRzl1r6gIyq-JYnw&s",
    recipe: `Ingredients:
                   - 200g Manicai (plucked from stalks)
                   - 1 tablespoon salt
                   - 2 cloves garlic, minced
                   - 2 eggs
                   - 1 teaspoon MSG free Chicken stock powder (omit)
                   - 50ml water
                   - 1 tablespoon light soy sauce (optional)
                  steps:
                  1. Wash the leaves thoroughly and add the salt. Leave for several minutes, then squeeze all the juice out. Rinse, and squeeze again. Place the leaves on chopping board and dice into small pieces. Set aside.
                  2. In a wok/pan, heat 3-4 tablespoons of oil. Once it’s hot, cook the garlic until aromatic. Stir in the leaves and cook for about a minute till wilt. Add water when it starts to look quite dry (about halfway through).
                  3. Make a well in the middle, crack the eggs in and beat with chopsticks to mix. Once the eggs are starting to set, start mixing everything together, adding more water if needed. Turn off the heat after about a minute or so. Serve while hot.`,
  },

  {
    foodName: "Mindin Belacan",
    origin: "Bidayuh",
    userProfileID: 8,
    status: "Approved",
    culturalStory: "Midin belacan is Sarawak's iconic jungle fern dish. \
    We forage for midin after rain when the ferns are tender, then stir-fry with fiery belacan - a taste that reminds me of family meals in our Kuching home.",
    photos: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQq3aWb_8yhfnKB4QxRo6u6Da2i8nt6rXrB-g&s",
    recipe: "",
  },

  {
    foodName: "Ayam Pansuh",
    origin: "Dayak",
    userProfileID: 9,
    status: "Approved",
    culturalStory: "Ayam pansuh cooked in bamboo is true Iban heritage. \
    My father would prepare this for special occasions, stuffing chicken with lemongrass and cooking over open fire, the bamboo giving it a smoky flavor that connects us to our longhouse traditions.",
    photos: "https://i.ytimg.com/vi/43WhAxBuppQ/sddefault.jpg",
    recipe: `Ingredients:
              - 1 Chicken
              - 1 bundle of umbut tepus
              - A kantan flower
              - 10 daun ubi
              - 1 stick of lemongrass
              - 3 wite onion
              - 2 red onion
              - 50g ginger
              - 1 turmeric leaf
              - 1 bamboo stick
              - 50ml Water
              - 1tsp Aji No Moto 
              - 2tsp Salt
          Steps:       
          1. Cut the chickens into pieces
          2.Prepare all the ingredients by cutting, washing, and draining them. Mix the chicken and spices thoroughly.
          3.Clean the bamboo and place the ingredients inside. Add a little water to create the broth.
          4.Traditionally, the bamboo is cooked over an open fire. In this case, it was grilled over a gas stove due to heavy rain. Keep a steady fire and watch closely until you hear the broth bubbling inside the bamboo.
          5.Seal the top of the bamboo with yam leaves (traditional method) or aluminum foil as an alternative.
          `,
  },
];

(async () => {
  try {
    for (const posts of postData) {
    const sql = `
      INSERT INTO posts (foodName, origin, userProfileID, status, culturalStory, photos, recipe)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      posts.foodName,
      posts.origin,
      posts.userProfileID,
      posts.status,
      posts.culturalStory,
      posts.photos,
      posts.recipe,
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
