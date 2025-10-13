const db = require("./db"); 

const foods = [
  {
    name: "Linut",
    origin: "Melanau",
    category: "Rice Dish",
    foodType: "main-dish",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "paleo", "high-protein", "low-fat"],
    description: "Linut is a traditional cuisine that is especially popular among the Indigenous Dayak communities.\
                  This staple dish is an important part of Dayak cuisine and is frequently served at traditional events and community feasts. \
                  The dish is made from sago, a type of starch produced from the sago palm. \
                  Sago is mixed with water to produce a thick, sticky paste, which is then steamed to get its gelatinous and chewy texture. \
                  Linut is usually bland, making it a great carrier for savoury side dishes such as meat stews, spicy sambal, or rich gravies prepared using meat or seafood.",
    image: "https://img-global.cpcdn.com/steps/1fe46f4ff8152bed/640x640sq80/photo.webp",
    prepTime: 30,
    Energy_kcal: 344.91,
    Protein_g: 21.977,
    Fat_g: 1.632,
    Carbohydrates_g: 60.528,
    Fiber_g: 1.189,
    VitaminC_mg: 11.6
  },

  {
    name: "Kolo Mee",
    origin: "Chinese",
    category: "Noodles",
    foodType: "noodles",
    difficulty: "medium",
    dietaryTags: ["dairy-free", "high-protein"],
    description: "The origin of Kolo Mee is still unclear, but it likely originated from Kuching, the capital of Sarawak. \
    “Kolo Mee” may also have derived from the Hokkien and Cantonese words for “dry mixed” noodles. \
    In Hokkien, “kolo” (干捞) means “dry mix,” while in Cantonese, “gorn lo” has a similar meaning. \
    This theory suggests that the name “Kolo Mee” come from how the dish is prepared, which involves tossing the noodles with the sauce and toppings in a dry manner.",
    image: "https://tasteasianfood.com/wp-content/uploads/2023/03/Kolo-Mee-recipe-5-square.jpeg",
    prepTime: 30,
    Energy_kcal: 1103.14,
    Protein_g: 30.764,
    Fat_g: 60.483,
    Carbohydrates_g: 27.094,
    Fiber_g: 2.786,
    VitaminC_mg: 12.54
  },

  {
    name: "Umai",
    origin: "Melanau",
    category: "Seafood",
    foodType: "appetizer",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "paleo", "high-protein", "low-fat", "low-fiber"],
    description: "Umai is a traditional Sarawakian raw fish salad popular with the Dayak and Melanau communities. \
    It highlights local methods of food preparation and preservation using fresh ingredients. \
    Raw tenggiri (mackerel) is sliced or cubed and marinated in lime juice, allowing the acidity to “cook” the fish. \
    Chopped onions, chillies, and tomatoes are added and seasoned with salt, sugar, and soy or fish sauce. \
    The dish tastes fresh and tangy with a slight heat and is served chilled or at room temperature, often alongside rice.",
    image: "https://munchmalaysia.com/wp-content/uploads/2023/10/umai-1024x512.jpg",
    prepTime: 20,
    Energy_kcal: 583.39,
    Protein_g: 70.95,
    Fat_g: 7.6,
    Carbohydrates_g: 43.43,
    Fiber_g: 3.1,
    VitaminC_mg: 109
  },

  {
    name: "Nasi Aruk",
    origin: "Malay",
    category: "Rice Dish",
    foodType: "main-dish",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat"],
    description: "Unlike typical fried rice, Nasi Aruk is prepared without any oil or fat and is tossed in a hot pan until the grains are well-toasted, creating a deep smoky, slightly charred scent. \
    Its name, “Aruk,” drawn from the Sarawakian Malay dialect, literally signifies “charred,” a nod to this distinctive method. \
    The dish is composed simply of rice combined with anchovies, fragrant torch ginger, turmeric leaves, and the heat of bird’s-eye chilli.",
    image: "https://i.ytimg.com/vi/W6Co9dMpw7o/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAfGfmofQBBYx02WeMUcjjPJxH7aw",
    prepTime: 30,
    Energy_kcal: 81,
    Protein_g: 6.88,
    Fat_g: 2.02,
    Carbohydrates_g: 9.24,
    Fiber_g: 0.2,
    VitaminC_mg: 13.8
  },

  {
    name: "Asam Siok",
    origin: "Bidayuh",
    category: "Poultry",
    foodType: "main-dish",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein"],
    description: "Asam siok, also known as chicken with rice in bamboo, is a traditional Bidayuh dish that is served during special events like Gawai, get-togethers, or the welcome of VIPs or special visitors. \
    Using bamboo is a natural cooking method that retains tastes and creates incredibly tender chicken that is scented with bamboo and lemongrass.",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgzvn3mAtq5B52L9bQtt6ZQDZcQGCXMl7rTQ0wtElx5y8NyUO8QVyCABx45sLrIPUy0qvL3J5QRZViwwJn_9t4opFUsQjJ4UGC1FZjgV_giHlOCmejb9AiRRE3otlN5qeIKZ1jmVP5MKt4/s320/ayam+pansuh+1.jpg",
    prepTime: 90,
    Energy_kcal: 1559,
    Protein_g: 204.3,
    Fat_g: 57.3,
    Carbohydrates_g: 55.99,
    Fiber_g: 1.98,
    VitaminC_mg: 81.34
  },

  {
    name: "Belacan Bihun",
    origin: "Chinese", 
    category: "Noodles",
    foodType: "noodles",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat", "high-fiber"],
    description: "Belacan bihun is a unique, flavorful rice vermicelli dish from Kuching, Sarawak, featuring rice noodles served with a spicy, umami-rich gravy made from belacan",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5ICw3THB2c69u4iOIFVFM0X79tAR6_GDfVQ&s",
    prepTime: 45,
    Energy_kcal: 1815,
    Protein_g: 190.15,
    Fat_g: 9.2,
    Carbohydrates_g: 242.29,
    Fiber_g: 7.15,
    VitaminC_mg: 52.9
  },

  {
    name: "Daun Ubi Tumbuk",
    origin: "Iban",
    category: "Vegetables",
    foodType: "side-dish",
    difficulty: "medium",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber"],
    description: "Daun ubi tumbuk (pounded cassava leaves) is a popular vegetable dish from Borneo where cassava leaves are pounded using wooden mortar and pestle and cooked in a variety of ways, often with coconut milk or in a curry. \
    This dish are widely eaten among Sarawak's native communities.",
    image: "https://st3.depositphotos.com/34780080/37246/i/450/depositphotos_372467348-stock-photo-daun-ubi-tumbuk-daun-singkong.jpg",
    prepTime: 60,
    Energy_kcal: 212.8,
    Protein_g: 26.47,
    Fat_g: 3.64,
    Carbohydrates_g: 37.3,
    Fiber_g: 4.89,
    VitaminC_mg: 84.415
  },

  {
    name: "Manicai",
    origin: "Chinese",
    category: "Vegetables",
    foodType: "side-dish",
    difficulty: "easy",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber", "low-fat"],
    description: "Manicai, also known as Sayur Manis, Cekur Manis, or Sweet Leaf, is a leafy vegetable from Southeast Asia that is eaten stir-fried or boiled, often with eggs in dishes like Mani Cai with Eggs. \
    While nutritious, containing protein and antioxidants, the leaves contain compounds that can cause severe lung damage if consumed raw or in large quantities, making thorough cooking essential",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9TBKvQXOSVwHgIOpR7WyGXpmj7Uv3Gk9f8OkrqnZh0_Xu4TrlZf0KNCNVE-gR_9AGrJw&usqp=CAU",
    prepTime: 30,
    Energy_kcal: 316.6,
    Protein_g: 27.68,
    Fat_g: 14,
    Carbohydrates_g: 19.64,
    Fiber_g: 3.98,
    VitaminC_mg: 273.12
  },

  {
    name: "Midin Belacan",
    origin: "Bidayuh",
    category: "Vegetables",
    foodType: "side-dish",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "high-fiber", "low-fat", "spicy"],
    description: "Midin Belacan is a beloved Sarawakian dish celebrated for its simplicity and flavour, prepared by blanching the crisp midin fern before stir-frying it with fragrant garlic, shallots, and belacan, \
    then finishing with seasonings like salt, sugar, and calamansi juice, with optional variations such as rice wine or red bell pepper adding depth while keeping true to its humble roots.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc1lwR63ujDfGCJq52PM8bONbSU-FZqAl3cA&s",
    prepTime: 25,
    Energy_kcal: 195,
    Protein_g: 17,
    Fat_g: 4.8,
    Carbohydrates_g: 23,
    Fiber_g: 17,
    VitaminC_mg: 25,
  },

  {
    name: "Ayam Pansuh",
    origin: "Dayak",
    category: "Meat",
    foodType: "main-dish",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein"],
    description: "Deep within the cultural tapestry of Sarawak, an iconic dish known as Manok Pansoh (also called manuk pansuh/ayam pansuh) holds a special place among the Dayak community (Iban, Bidayuh, and Ulu people of Sarawak).\
    The name itself, “Manok Pansoh,” translates to “chicken bamboo” in the Iban language, offering a glimpse into the essence of this traditional delicacy.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkbjK4YZPkQhHoK4G3g8vvDVPOTbxnPc8u_g&s",
    prepTime: 60,
    Energy_kcal: 178.04,
    Protein_g: 30.22,
    Fat_g: 5.22,
    Carbohydrates_g: 0,
    Fiber_g: 0,
    VitaminC_mg: 0,
  }

];

(async () => {
  try {
    for (const food of foods) {
      const sql = `
        INSERT INTO food 
        (name, origin, category, foodType, difficulty, dietaryTags, description, image, prepTime, Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        food.name,
        food.origin,
        food.category,
        food.foodType,
        food.difficulty,
        food.dietaryTags.join(', '),
        food.description,
        food.image,
        food.prepTime,
        food.Energy_kcal,
        food.Protein_g,
        food.Fat_g,
        food.Carbohydrates_g,
        food.Fiber_g,
        food.VitaminC_mg,
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
