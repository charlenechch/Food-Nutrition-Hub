const db = require("./db"); 

const foods = [
  {
    name: "Linut",
    origin: "Melanau",
    category: ["Rice Dish", "Fermented"],
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein", "low-fat"],
    description: "Linut is a traditional cuisine that is especially popular among the Indigenous Dayak communities.\
                  This staple dish is an important part of Dayak cuisine and is frequently served at traditional events and community feasts.",
    image: "https://img-global.cpcdn.com/steps/1fe46f4ff8152bed/640x640sq80/photo.webp",
    prepTime: 30,
    Energy_kcal: 344.91,
    Protein_g: 21.977,
    Fat_g: 1.632,
    Carbohydrates_g: 60.528,
    Fiber_g: 1.189,
    VitaminC_mg: 11.6,
    culturalSignificance: "A traditional staple of the Melanau people, Linut is a direct link to Sarawak's sago-producing heritage, representing a time when sago was a primary carbohydrate source in the coastal regions.",
    traditionalPreparation: "It is made by gradually mixing hot water into sago starch and vigorously stirring it with a special fork until it achieves a unique, sticky, and translucent gel-like consistency, often eaten with your hands.",
    commonIngredients: ["Sago flour, Anchovies, Chilies, Belacan, Mango"],
    alternative: "Tapioca starch",
    altDescription: "Tapioca starch can be used as a substitute, producing a slightly clearer and chewier gel.",
    healthTips: "Gluten-free. Low in vitamins, so it should be paired with other nutritious foods.",
    gram_per_serving: 367.57
  },

  {
    name: "Kolo Mee",
    origin: "Chinese",
    category: ["Noodles", "Meat"],
    difficulty: "medium",
    dietaryTags: ["dairy-free", "high-protein"],
    description: "The origin of Kolo Mee is still unclear, but it likely originated from Kuching, the capital of Sarawak. \
    “Kolo Mee” may also have derived from the Hokkien and Cantonese words for “dry mixed” noodles. \
    In Hokkien, “kolo” (干捞) means “dry mix,” while in Cantonese, “gorn lo” has a similar meaning",
    image: "https://tasteasianfood.com/wp-content/uploads/2023/03/Kolo-Mee-recipe-5-square.jpeg",
    prepTime: 30,
    Energy_kcal: 786.94,
    Protein_g: 24.344,
    Fat_g: 28.563,
    Carbohydrates_g: 27.094,
    Fiber_g: 2.786,
    VitaminC_mg: 12.54,
    culturalSignificance: "The quintessential everyday food of Sarawak, Kolo Mee is a symbol of Kuching's food culture. Its Chinese origins are deeply woven into the state's identity, commonly eaten for breakfast and a must-try for visitors.",
    traditionalPreparation: "Springy egg noodles are blanched and tossed in a simple seasoning of lard (or oil), light soy sauce, and vinegar, then topped with seasoned minced pork, sliced char siu, and spring onions.",
    commonIngredients: ["Egg noodles (curly), Char siu, Minced Pork"],
    healthTips: "Opt for a version with less lard and more vegetables to reduce saturated fat and increase fiber.",
    gram_per_serving: 262.0534
  },

  {
    name: "Umai",
    origin: "Melanau",
    category: "Seafood",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein", "low-fat"],
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
    VitaminC_mg: 109,
    culturalSignificance: "Known as the 'Sarawakian ceviche', Umai is a traditional Melanau fisherman's dish, prepared fresh on boats as a quick and nutritious meal. It showcases the reliance on the state's abundant fresh seafood.",
    traditionalPreparation: "Thinly sliced raw fish (like mackerel or bawal) is 'cooked' by marinating it in a mixture of lime juice, onions, chillies, and salt. It is often mixed with grated dried sago powder for texture.",
    commonIngredients: ["Prawns, Chilies, Ginger, Shallots, Cucumber"],
    healthTips: "Ensure the fish is extremely fresh and handled hygienically to avoid foodborne illness. Rich in protein and omega-3 fatty acids.",
    gram_per_serving: 815.0
  },

  {
    name: "Nasi Aruk",
    origin: "Malay",
    category: "Rice Dish",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat"],
    description: "Unlike typical fried rice, Nasi Aruk is prepared without any oil or fat and is tossed in a hot pan until the grains are well-toasted, creating a deep smoky, slightly charred scent. \
    Its name, “Aruk,” drawn from the Sarawakian Malay dialect, literally signifies “charred,” a nod to this distinctive method. \
    The dish is composed simply of rice combined with anchovies, fragrant torch ginger, turmeric leaves, and the heat of bird’s-eye chilli.",
    image: "https://i.ytimg.com/vi/W6Co9dMpw7o/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAfGfmofQBBYx02WeMUcjjPJxH7aw",
    prepTime: 30,
    Energy_kcal: 334.6,
    Protein_g: 21.72,
    Fat_g: 3.044,
    Carbohydrates_g: 68.24,
    Fiber_g: 2.18,
    VitaminC_mg: 5.12,
    culturalSignificance: "Sarawak's version of fried rice, Nasi Aruk is distinct for being a Malay community specialty. It is a beloved dish for supper and gatherings, known for its intense, smoky flavour without using any oil or liquid in the frying process.",
    traditionalPreparation: "Day-old rice is fried in a dry wok with garlic, shallots, and belacan (shrimp paste), constantly stirred over high heat until it becomes fragrant, dry, and slightly toasted.",
    commonIngredients: ["Anchovies, Garlic, Chilies, White pepper, Day-old rice"],
    healthTips: "A relatively low-fat fried rice option due to the no-oil cooking method, but high in sodium from belacan and salt.",
    gram_per_serving: 313.38
  },

  {
    name: "Terung Asam",
    origin: "Iban",
    category: "Vegetables",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "halal", "spicy"],
    description: "Terung asam uses salted fish and terung sour eggplant as its main ingredients. This soup is truly delicious, with a balance of sour, salty, sweet, and spicy flavours.",
    image: "https://img-global.cpcdn.com/recipes/74dc8e14dccfda8f/600x852cq80/ikan-masin-terong-asam-dayak-resipi-foto-utama.webp",
    prepTime: 30,
    Energy_kcal: 96.03,
    Protein_g: 6.04,
    Fat_g: 2.00,
    Carbohydrates_g: 13.42,
    Fiber_g: 1.60,
    VitaminC_mg: 26.60,
    culturalSignificance: "Terung asam is a traditional ingredient widely used in Sarawak, especially among Dayak communities. It is valued for its distinctive sour taste and is commonly used in local soups and dishes, reflecting the use of indigenous ingredients in Sarawak cuisine.",
    traditionalPreparation: "The dish is typically prepared by slicing terung asam and cooking it in a light broth with aromatics such as chilli, lemongrass, and onion. It is often combined with fish or seafood, allowing the natural sourness of the fruit to flavour the soup.",
    commonIngredients: ["Terung asam (sour eggplant)", "Salted fish or fresh fish", "Chilli", "Onion", "Lemongrass", "Belacan"],
    healthTips: "Terung asam is naturally rich in vitamin C and fibre. However, dishes using belacan and salted fish may be high in sodium, so it is recommended to consume in moderation and pair with vegetables for a more balanced meal.",
    gram_per_serving: 171.38
  },

  {
    name: "Belacan Bihun",
    origin: "Chinese", 
    category: ["Noodles", "Soup", "Seafood"],
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat", "high-fiber"],
    description: "Belacan bihun is a unique, flavorful rice vermicelli dish from Kuching, Sarawak, featuring rice noodles served with a spicy, umami-rich gravy made from belacan",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5ICw3THB2c69u4iOIFVFM0X79tAR6_GDfVQ&s",
    prepTime: 45,
    Energy_kcal: 641.75,
    Protein_g: 66.05,
    Fat_g: 3.33,
    Carbohydrates_g: 86.91,
    Fiber_g: 2.48,
    VitaminC_mg: 17.40,
    culturalSignificance: "A simple yet powerful noodle dish that highlights the central role of belacan in Sarawakian cuisine. It's a common and comforting meal found in many local eateries.",
    traditionalPreparation: "Rice vermicelli (bihun) is typically blanched and served with a rich, tangy belacan-based gravy made from chillies, dried shrimp, and souring agents, creating a spicy, salty, and umami-rich flavour.",
    commonIngredients: ["Soya bean sprout, Shrimp, Shallot, Rice vermicelli, Chili, Tamarind paste, Brown sugar, Cucumber, Cuttlefish"],
    healthTips: "The sodium content is high due to belacan. Balance the meal by adding side vegetables and a lean protein.",
    gram_per_serving: 399.96
  },

  {
    name: "Daun Ubi Tumbuk",
    origin: "Dayak",
    category: "Vegetables",
    difficulty: "medium",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber"],
    description: "Daun ubi tumbuk (pounded cassava leaves) is a traditional vegetable dish widely enjoyed among Borneo’s native communities, particularly in Sarawak. It is prepared by pounding young cassava leaves using a wooden mortar and pestle, resulting in a soft, finely shredded texture. Unlike richer variations found elsewhere, the authentic Sarawakian version is simple and light, without the use of coconut milk or curry spices. Instead, it is typically stir-fried with basic ingredients such as garlic, shallots, and ikan bilis (anchovies).",
    image: "https://st3.depositphotos.com/34780080/37246/i/450/depositphotos_372467348-stock-photo-daun-ubi-tumbuk-daun-singkong.jpg",
    prepTime: 60,
    Energy_kcal: 173.95,
    Protein_g: 17.965,
    Fat_g: 3.175,
    Carbohydrates_g: 25.27,
    Fiber_g: 4.89,
    VitaminC_mg: 84.415,
    culturalSignificance: "A staple in Dayak communities, especially among the Iban and Bidayuh, daun ubi tumbuk reflects Sarawak’s “forest-to-table” way of life. It is a simple, everyday dish, often made from cassava leaves grown just outside the home, which are easily harvested for a quick, nutritious meal. The preparation method that uses a wooden mortar and pestle is deeply rooted in tradition. The rhythmic pounding of the leaves is a familiar sound in many households, which symbolises a strong connection to ancestral cooking practices that prioritise simplicity, self-sufficiency, and heritage over modern convenience.",
    traditionalPreparation: "Cassava leaves are pounded using a wooden mortar and pestle to soften the tough fibres and release their natural, earthy aroma. They are then typically stir-fried with garlic, shallots, and ikan bilis (anchovies). This daily Sarawakian dish is prized for its simplicity and clean taste, as it is prepared without coconut milk or curry spices.",
    commonIngredients: ["Cassava leaves, Galangal, Shallots, Chili, Garlic, Salt, Water"],
    healthTips: "Cassava leaves must be cooked thoroughly to remove naturally occurring cyanide compounds. They are an excellent source of protein and iron.",
    gram_per_serving: 0.0
  },

  {
    name: "Manicai",
    origin: "Chinese",
    category: "Vegetables",
    difficulty: "easy",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber", "low-fat"],
    description: "Manicai is a dark green leafy shrub known for its naturally sweet, nutty flavour and its distinctive, tender yet slightly chewy texture. In Sarawak, it is uniquely prepared using a manual bruising technique, which softens the leaves and enhances their flavour. Rather than simply being chopped, the leaves are carefully bruised before being stir-fried until fragrant and dry, which results in a rich, flavourful dish with a deep forest-green appearance.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9TBKvQXOSVwHgIOpR7WyGXpmj7Uv3Gk9f8OkrqnZh0_Xu4TrlZf0KNCNVE-gR_9AGrJw&usqp=CAU",
    prepTime: 30,
    Energy_kcal: 316.6,
    Protein_g: 27.68,
    Fat_g: 14,
    Carbohydrates_g: 19.64,
    Fiber_g: 3.98,
    VitaminC_mg: 273.12,
    culturalSignificance: "Manicai is a beloved staple in Sarawak, enjoyed by both Dayak and Chinese communities. It is often described as an “everyday vegetable,” as it can be found everywhere, from home kitchens and kopitiam to upscale restaurants. For many Sarawakians, it carries a sense of nostalgia as a hardy backyard crop, which symbolises resourcefulness and self-sufficiency. Simple yet nutritious, manicai is a comforting daily dish that pairs perfectly with white rice and is rarely absent from the family table.",
    traditionalPreparation: "The hallmark of Sarawakian manicai lies in its distinctive “scrunching” technique. Before cooking, the leaves are vigorously rubbed and squeezed by hand until bruised, releasing their dark green juices. This process softens the leaves and removes bitterness. After rinsing, they are stir-fried in a hot wok with garlic and shallots for aroma, dried shrimp (udang kering) for umami, and eggs that are scrambled directly into the leaves. The result is a “dry” stir-fry where the egg clings to the softened leaves, creating a smoky, slightly sweet, and deeply savoury dish that is both simple and highly addictive.",
    commonIngredients: ["Eggs, Soy sauce, Salt, Manicai"],
    healthTips: "Sweet potato leaves (Manicai) are rich in vitamins C, and contains high protein. ",
    gram_per_serving: 0.0
  },

  {
    name: "Midin Belacan",
    origin: "Bidayuh",
    category: "Vegetables",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "high-fiber", "low-fat", "spicy"],
    description: "Midin Belacan is a beloved Sarawakian dish celebrated for its simplicity and flavour, prepared by blanching the crisp midin fern before stir-frying it with fragrant garlic, shallots, and belacan,\
    then finishing with seasonings like salt, sugar, and calamansi juice, with optional variations such as rice wine or red bell pepper adding depth while keeping true to its humble roots.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc1lwR63ujDfGCJq52PM8bONbSU-FZqAl3cA&s",
    prepTime: 25,
    Energy_kcal: 313.17,
    Protein_g: 43.11,
    Fat_g: 4.8,
    Carbohydrates_g: 23.56,
    Fiber_g: 20.7,
    VitaminC_mg: 30,
    culturalSignificance: "This is the most iconic jungle fern dish of Sarawak. Midin is foraged from the wild, representing the close relationship between Sarawakians and their rich rainforest ecosystem.",
    traditionalPreparation: "The crisp midin ferns are quickly stir-fried in a hot wok with a pungent and savoury paste made from chillies, garlic, and belacan (shrimp paste).",
    commonIngredients: ["Midin, Garlic, Chilies, Shrimp paste, Salt, Shallot"],
    healthTips: "Fibre Powerhouse: Midin is incredibly rich in natural soluble fibre, making it excellent for digestive health and blood sugar regulation. High Protein: The generous addition of anchovies transforms this vegetable side dish into a highly functional, protein-rich option. Natural Umami: By omitting added table salt, this recipe smartly relies entirely on the rich, savory depth of belacan and anchovies, preventing unnecessary sodium overload.",
    gram_per_serving: 0.0
  },

  {
    name: "Ayam Pansuh",
    origin: "Dayak",
    category: "Meat",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein"],
    description: "Deep within the cultural tapestry of Sarawak, an iconic dish known as Manok Pansoh (also called manuk pansuh/ayam pansuh) holds a special place among the Dayak community (Iban, Bidayuh, and Ulu people of Sarawak).\
    The name itself, “Manok Pansoh,” translates to “chicken bamboo” in the Iban language, offering a glimpse into the essence of this traditional delicacy.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkbjK4YZPkQhHoK4G3g8vvDVPOTbxnPc8u_g&s",
    prepTime: 60,
    Energy_kcal: 756,
    Protein_g: 59.68,
    Fat_g: 26.59,
    Carbohydrates_g: 104.88,
    Fiber_g: 12.1,
    VitaminC_mg: 55.9,
    culturalSignificance: "An iconic Dayak dish essential to celebrations like Hari Gawai. Serving pansuh symbolizes Sarawakian hospitality and the indigenous communities' deep, sustainable connection to the rainforest's natural resources.",
    traditionalPreparation: "Chicken and herbs are stuffed into a hollow green bamboo stalk, sealed with tapioca leaves (daun ubi), and slow-roasted over an open fire. The fresh bamboo acts as a natural pressure cooker, stewing the meat entirely in its own natural juices.",
    commonIngredients: ["Chicken, fresh hollow bamboo stalk, Umbut tepus (wild ginger shoot), bunga kantan (torch ginger flower), turmeric leaves, Lemongrass, ginger, shallots, garlic, Tapioca leaves."],
    healthTips: "Naturally Oil-Free: Cooks in its own trapped steam with zero added cooking oils. High Protein & Low Carb: A clean, lean protein source that naturally fits into low-carb diets. Antioxidant-Rich: Native ingredients like bunga kantan are packed with natural anti-inflammatory compounds.",
    gram_per_serving: 0.0
  }, 

  {
    name: "Sarawak Laksa",
    origin: "Chinese",
    category: "Noodle",
    difficulty: "hard",
    dietaryTags: [""],
    description: "Sarawak Laksa is an iconic noodle soup featuring thin rice vermicelli submerged in a fragrant broth. Unlike other Malaysian laksas, it strikes a unique balance between a spicy sambal base and a tangy tamarind kick, smoothed over with a light touch of coconut milk. It is famously topped with a standard set of fresh ingredients.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkbjK4YZPkQhHoK4G3g8vvDVPOTbxnPc8u_g&s",
    prepTime: 30,
    Energy_kcal: 869.21,
    Protein_g: 39.12,
    Fat_g: 45.69,
    Carbohydrates_g: 75.50,
    Fiber_g: 3.25,
    VitaminC_mg: 34.81,
    culturalSignificance: "While many laksa recipes in Malaysia come from various regions such as Penang and Johor, the Sarawak Laksa is the undisputed crown jewel of Kuching. It is a unique hybrid of Chinese and Malay culinary influences that evolved in the mid-20th century. Whether at a corner kopitiam or a high-end hotel, Sarawakians from all walks of life gather over this dish, representing  the state's spirit of unity. For many Sarawakians, it is a shared obsession to travel across town to find the perfect bowl.",
    traditionalPreparation: "Rice vermicelli is blanched and submerged in a fragrant broth made from a complex paste of sambal belacan, tamarind, and local aromatics, enriched with a light touch of coconut milk. It is typically topped with prawns, shredded chicken, omelette strips, and bean sprouts, and is traditionally served with a side of sambal belacan and calamansi lime to sharpen the flavors.",
    commonIngredients: "Prawn",
    healthTips: "The broth contains sodium and saturated fat (from coconut milk). Enjoy the noodles and toppings, but try not to drink the whole bowl of soup if you’re watching your heart health.",
    gram_per_serving: 400.0
  }


];

(async () => {
  try {
    for (const food of foods) {
      const sql = `
        INSERT INTO food (
          name, origin, category, difficulty, dietaryTags, description, image, 
          prepTime, Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, 
          VitaminC_mg, culturalSignificance, traditionalPreparation, 
          commonIngredients, healthTips, gram_per_serving,
          likes_count, liked_by, updatedAt, createdAt, 
          embedding, embedding_text, embedding_s1, embedding_s3
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        food.name,
        food.origin,
        Array.isArray(food.category) ? food.category.join(', ') : food.category,
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
        food.culturalSignificance,
        food.traditionalPreparation,
        Array.isArray(food.commonIngredients) ? food.commonIngredients.join(', ') : food.commonIngredients,
        food.healthTips,
        food.gram_per_serving,
        0,      // likes_count
        null,   // liked_by
        new Date(), // updatedAt
        new Date(), // createdAt
        null,   // embedding
        null,   // embedding_text
        null,   // embedding_s1
        null    // embedding_s3
      ];

      console.log(`Inserting: ${food.name}`);
      console.log(`Values count: ${values.length}`); // Should show 27
      
      await db.pool.query(sql, values);
    }

    console.log("✅ All data inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting data:", err.message);
    console.error("SQL:", sql);
    console.error("Values count:", values ? values.length : 'undefined');
    process.exit(1);
  }
})();