const db = require("./db"); 

const foods = [
  // Linut
  {
    name: "Linut",
    origin: "Melanau",
    category: ["Rice Dish", "Fermented"],
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "paleo", "high-protein", "low-fat"],
    description: "Linut, also known as sagu in Bidayuh, is a thick, translucent, and glue-like porridge made from sago flour. It has a neutral taste and oftem paired \
                  with the bold, spicy, and tangy flavours of Sarawakian side dishes. Its unique, elastic texture also makes it one of the most distinctive traditional \
                  foods in the region.",
    image: "https://img-global.cpcdn.com/steps/1fe46f4ff8152bed/640x640sq80/photo.webp",
    prepTime: 30,
    Energy_kcal: 344.91,
    Protein_g: 21.977,
    Fat_g: 1.632,
    Carbohydrates_g: 60.528,
    Fiber_g: 1.189,
    VitaminC_mg: 11.6,
    culturalSignificance: "Linut, or Sagu, is an important traditional food that connects both coastal and inland communities in Sarawak. It was commonly eaten \
                            in the past when rice was scarce, which highlights the importance of the sago palm to the Melanau and Bidayuh people. It is also a highly \
                            communal dish, traditionally enjoyed by twirling the starch onto candas (bamboo tweezers) and dipping it into a shared bowl of sambal.",
    traditionalPreparation: "The sago flour is mixed with a small amount of room-temperature water to form a slurry. Boiling water is then added while the mixture \
                              is stirred quickly with a wooden paddle. The stirring must continue until the cloudy mixture transforms into a smooth, clear, and \
                              stretchy gel.",
    commonIngredients: ["Sago Flour, Sambal Belacan, Tempoyak"],
    alternative: "Tapioca starch",
    altDescription: "Tapioca starch can be used as a substitute, producing a slightly clearer and chewier gel.",
    healthTips: "Gluten-free. Low in vitamins, so it should be paired with other nutritious foods.",
    gram_per_serving: 367.57
  },

  // Kolo Mee
  {
    name: "Kolo Mee",
    origin: "Chinese",
    category: ["Noodles", "Meat"],
    difficulty: "medium",
    dietaryTags: ["dairy-free", "high-protein"],
    description: "Kolo Mee is a signature Sarawakian dry-tossed noodle dish, where the name is believed to come from Hokkien, where “kolo” (干捞) means “dry mixed”, \
                  which refers to noodles that are tossed without soup. The dish is typically served in two main styles: “White” (seasoned with savoury oil) and \
                  “Red” (infused with sweet char siew oil).", 
    image: "https://tasteasianfood.com/wp-content/uploads/2023/03/Kolo-Mee-recipe-5-square.jpeg",
    prepTime: 30,
    Energy_kcal: 786.94,
    Protein_g: 24.344,
    Fat_g: 28.563,
    Carbohydrates_g: 27.094,
    Fiber_g: 2.786,
    VitaminC_mg: 12.54,
    culturalSignificance: "Kolo Mee is a signature Sarawakian dry-tossed noodle dish, where the name is believed to come from Hokkien, where “kolo” (干捞) means \
                          “dry mixed”, which refers to noodles that are tossed without soup. The dish is typically served in two main styles: “White” (seasoned with \
                          savoury oil) and “Red” (infused with sweet char siew oil).",
    traditionalPreparation: "The secret to a great Kolo Mee lies in the “shocking” technique, where noodles are quickly blanched in boiling water and then dipped in \
                            cold water to lock in elasticity. The noodles are then vigorously tossed with shallot oil and seasonings to ensure every strand is evenly \
                            coated and perfectly separated.",
    commonIngredients: ["Noodle, Shallot Oil, Rendered Lard, Char Siew, Minced Meat"],
    healthTips: "Opt for a version with less lard and more vegetables to reduce saturated fat and increase fiber.",
    gram_per_serving: 262.0534
  },

  // Umai
  {
    name: "Umai",
    origin: "Melanau",
    category: "Seafood",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "paleo", "high-protein", "low-fat"],
    description: "Umai is a traditional Sarawakian raw fish salad popular with the Dayak and Melanau communities. It highlights local methods of food preparation and \
                  preservation using fresh ingredients. Raw tenggiri (mackerel) is sliced or cubed and marinated in lime juice, allowing the acidity to “cook” the fish. \
                  Chopped onions, chillies, and tomatoes are added and seasoned with salt, sugar, and soy or fish sauce. The dish tastes fresh and tangy with a \
                  slight heat and is served chilled or at room temperature, often alongside rice.",
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

  // Nasi Aruk
  {
    name: "Nasi Aruk",
    origin: "Malay",
    category: "Rice Dish",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat"],
    description: "Nasi Aruk is a signature “oil-free” fried rice from Sarawak. Unlike typical fried rice, it is dry fried in a hot wok until the grains develop a \
                  smoky, toasted aroma and a lightly charred exterior. It is valued for its light, fluffy texture and clean, savoury flavour, without the heaviness of \
                  oil or rich sauces.",
    image: "https://i.ytimg.com/vi/W6Co9dMpw7o/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAfGfmofQBBYx02WeMUcjjPJxH7aw",
    prepTime: 30,
    Energy_kcal: 286,
    Protein_g: 6.88,
    Fat_g: 2.42,
    Carbohydrates_g: 54.24,
    Fiber_g: 0.8,
    VitaminC_mg: 13.8,
    culturalSignificance: "Deeply rooted in the Sarawak Malay and Melanau communities, Nasi Aruk is a humble breakfast staple shaped by resourcefulness. Traditionally, \
                            it was a way to turn leftover rice into a fragrant meal without using cooking oil. Today, it remains a popular comfort food, often enjoyed as\
                             a “healthier” and more aromatic alternative to regular nasi goreng.",
    traditionalPreparation: "The key lies in the “aruk” (toasting) technique. Aromatics such as garlic, shallots, and dried shrimp are first heated in a hot, dry wok \
                              until fragrant. Day-old rice is then added and continuously stirred over medium-high heat. This constant movement prevents burning while \
                              allowing the rice to absorb the wok’s smoky heat (wok hei), giving the dish its distinctive toasted aroma.",
    commonIngredients: ["Overnight Rice, Dried Shrimp, Anchovies, Garlic, Chilli, Shallots"],
    healthTips: "A relatively low-fat fried rice option due to the no-oil cooking method, but high in sodium from belacan and salt.",
    gram_per_serving: 241.0
  },

  // Terung Asam
  {
    name: "Terung Asam",
    origin: "Iban",
    category: "Vegetables",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "nut-free", "halal", "spicy"],
    description: "Terung Asam, also known as terung dayak, is a round, yellow-to-orange eggplant with a tough skin and a naturally sour, tangy flesh. Unlike common purple eggplants, which become soft when cooked, this remains firm, adding a refreshing acidity to soups and stews. Often described as the “lemon of the Borneo rainforest,” it is used to balance and enhance rich or savoury dishes.",
    image: "https://img-global.cpcdn.com/recipes/74dc8e14dccfda8f/600x852cq80/ikan-masin-terong-asam-dayak-resipi-foto-utama.webp",
    prepTime: 30,
    Energy_kcal: 96.03,
    Protein_g: 6.04,
    Fat_g: 2.00,
    Carbohydrates_g: 13.42,
    Fiber_g: 1.60,
    VitaminC_mg: 26.60,
    culturalSignificance: "This fruit symbolises Dayak identity and Sarawakian agriculture. Culturally, it represents the essence of Sarawakian home cooking, especially the skill of balancing flavours using local, natural ingredients. It is a beloved comfort food that connects people to their land.",
    traditionalPreparation: "The traditional way to prepare Terung Asam is in a soup. The fruit is peeled, cut into wedges, and simmered in broth until it softens and releases its natural juices, turning the soup into a zesty, golden liquid. Due to its natural acidity, it is often paired with salty or smoky proteins to create a well-balanced flavour.",
    commonIngredients: ["Lemongrass", "Galangal", "Turmeric", "Terung Asam", "Salted Fish", "Fresh Fish", "Chili", "Garlic", "Shallots"],
    healthTips: "Terung asam is naturally rich in vitamin C and fibre. However, dishes using belacan and salted fish may be high in sodium, so it is recommended to consume in moderation and pair with vegetables for a more balanced meal.",
    gram_per_serving: 171.38
  },

  // Belacan Bihun
  {
    name: "Belacan Bihun",
    origin: "Chinese", 
    category: ["Noodles", "Soup", "Seafood"],
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "low-fat", "high-fiber"],
    description: "Belacan Bihun is an iconic Sarawakian noodle dish characterised by its pungent and savoury gravy. For many locals, its distinctive aroma brings a sense of nostalgia, while for newcomers, it can be a bold and unique flavour that captures the essence of Kuching’s food culture.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5ICw3THB2c69u4iOIFVFM0X79tAR6_GDfVQ&s",
    prepTime: 45,
    Energy_kcal: 641.75,
    Protein_g: 66.05,
    Fat_g: 3.33,
    Carbohydrates_g: 86.91,
    Fiber_g: 2.48,
    VitaminC_mg: 17.40,
    culturalSignificance: "Belacan Bihun is the go-to afternoon snack found in local eatery. The dish reflects Sarawakian identity, especially in local ingredients such as high-quality belacan from Bintulu and Miri. It is widely enjoyed across different communities for its bold flavour.",
    traditionalPreparation: "The heart of the dish lies in the gravy as the base is boiled with water, high-quality Sarawak belacan, pounded dried shrimp, and chilli paste. This mixture is simmered until the flavours combine into a light yet flavorful broth, often balanced with a touch of sugar. The rice vermicelli is briefly blanched to maintain a firm texture.",
    commonIngredients: ["Rice Vermicelli, Sarawak Belacan, Century Egg, Cuttlefish, Bean Sprouts, Cucumber"],
    healthTips: "The sodium content is high due to belacan. Balance the meal by adding side vegetables and a lean protein.",
    gram_per_serving: 399.96
  },

  // Daun Ubi Tumbuk
  {
    name: "Daun Ubi Tumbuk",
    origin: "Dayak",
    category: "Vegetables",
    difficulty: "medium",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber"],
    description: "Pounded Cassava Leaves is a traditional vegetable dish widely enjoyed among Borneo’s native communities. It is prepared by pounding young cassava leaves using a wooden mortar and pestle, resulting in a soft, finely shredded texture.",
    image: "https://st3.depositphotos.com/34780080/37246/i/450/depositphotos_372467348-stock-photo-daun-ubi-tumbuk-daun-singkong.jpg",
    prepTime: 60,
    Energy_kcal: 43.49,
    Protein_g: 4.49,
    Fat_g: 0.79,
    Carbohydrates_g: 6.32,
    Fiber_g: 1.22,
    VitaminC_mg: 21.10,
    culturalSignificance: "It is a simple, everyday dish, often made from cassava leaves. The preparation method that uses a wooden mortar and pestle is deeply rooted in tradition. The rhythmic pounding of the leaves is a familiar sound in many households, which symbolises a strong connection to ancestral cooking practices that prioritise simplicity, self-sufficiency, and heritage over modern convenience.",
    traditionalPreparation: "Cassava leaves are pounded using a wooden mortar and pestle. Unlike richer variations found elsewhere, the authentic version is simple and light, they are typically stir-fried with garlic, shallots, and ikan bilis (anchovies). This daily Sarawakian dish is prized for its simplicity, as it is prepared without coconut milk or curry spices.",
    commonIngredients: ["Cassava leaves, Ginger, Shallots, Chilli, Garlic, Lemongrass, Anchovies, Torch Ginger"],
    healthTips: "Cassava leaves must be cooked thoroughly to remove naturally occurring cyanide compounds. They are an excellent source of protein and iron.",
    gram_per_serving: 78.75
  },

  // Manicai
  {
    name: "Manicai",
    origin: "Chinese",
    category: "Vegetables",
    difficulty: "easy",
    dietaryTags: ["vegetarian", "gluten-free", "dairy-free", "high-fiber", "low-fat"],
    description: "Manicai is a dark leafy vegetable from Sarawak, known for its naturally sweet, nutty flavour and tender yet slightly chewy texture. Before cooking, the leaves are gently bruised to soften the fibres and bring out their sweetness.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9TBKvQXOSVwHgIOpR7WyGXpmj7Uv3Gk9f8OkrqnZh0_Xu4TrlZf0KNCNVE-gR_9AGrJw&usqp=CAU",
    prepTime: 30,
    Energy_kcal: 105.53,
    Protein_g: 9.22,
    Fat_g: 4.66,
    Carbohydrates_g: 6.55,
    Fiber_g: 1.33,
    VitaminC_mg: 91.04,
    culturalSignificance: "Manicai is a popular staple in Sarawak, enjoyed by both Dayak and Chinese communities. It is commonly found in home kitchens, kopitiams, and even restaurants. Simple yet nutritious, manicai is a comforting daily dish that pairs perfectly with white rice and is rarely absent from the family table.",
    traditionalPreparation: "The key to Sarawakian manicai is the scrunching technique, where the leaves are firmly rubbed and squeezed by hand to release their juices. This helps soften the leaves and reduce bitterness. After rinsing, they are stir-fried in a hot wok with garlic, shallots, dried shrimp, and scrambled eggs, which are stirred directly into the leaves. The result is a relatively dry stir-fry, where the egg coats the softened leaves.",
    commonIngredients: ["Manicai, Eggs, Onion, Garlic, Dried Shrimp"],
    healthTips: "Sweet potato leaves (Manicai) are rich in vitamins C, and contains high protein. ",
    gram_per_serving: 66.67
  },

  {
    name: "Midin Belacan",
    origin: "Bidayuh",
    category: "Vegetables",
    difficulty: "easy",
    dietaryTags: ["gluten-free", "dairy-free", "high-fiber", "low-fat", "spicy"],
    description: "Midin is a wild jungle fern native to Sarawak’s forests and swampy areas. It is easily recognised by its slender, curly fronds with a reddish-green hue. Unlike the softer paku fern, midin is valued for its crisp “snap” and crunchy texture, along with a clean, earthy flavour that reflects the freshness of the rainforest.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc1lwR63ujDfGCJq52PM8bONbSU-FZqAl3cA&s",
    prepTime: 25,
    Energy_kcal: 104.39,
    Protein_g: 14.37,
    Fat_g: 4.54,
    Carbohydrates_g: 7.85,
    Fiber_g: 6.9,
    VitaminC_mg: 10,
    culturalSignificance: "Midin is a symbol of Sarawakian pride and the state’s rich biodiversity, as it is wild-harvested in the forest. It is a must-try vegetable for visitors and a nostalgic favourite for locals, that connects traditional jungle foraging with modern urban dining.",
    traditionalPreparation: "The key to a great Midin dish is a quick, high-heat stir-fry. To preserve its signature crunch, the fern is cooked briefly over high heat. A fragrant paste of Sarawak belacan, chillies, and dried shrimp is first sautéed until “pecah minyak” (when the oil separates). The Midin is then added and tossed for just a minute or two.",
    commonIngredients: ["Fresh Midin, Garlic, Chilli, Sarawak Belacan, Dried Shrimp, Onion"],
    healthTips: "Midin is incredibly rich in natural soluble fibre, making it excellent for digestive health and blood sugar regulation. ",
    gram_per_serving: 130.00
  },

  // Ayam Pansuh
  {
    name: "Ayam Pansuh",
    origin: "Dayak",
    category: "Meat",
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "high-protein"],
    description: "Manok Pansuh, or Ayam Pansuh, is a traditional dish from Sarawak that holds a special place among the Dayak community. The name itself means 'chicken cooked in a bamboo tube over an open fire', which comes from the unique experience inspired by the Borneo rainforest, with a rich broth and a distinct earthy aroma that cannot be achieved using regular cookware.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkbjK4YZPkQhHoK4G3g8vvDVPOTbxnPc8u_g&s",
    prepTime: 60,
    Energy_kcal: 756,
    Protein_g: 59.68,
    Fat_g: 26.59,
    Carbohydrates_g: 104.88,
    Fiber_g: 12.1,
    VitaminC_mg: 55.9,
    culturalSignificance: "This dish plays an essential role during Hari Gawai as it reflects a long-standing connection between Sarawak’s indigenous communities and the natural environment. Besides, serving Pansoh is also a meaningful expression of Sarawakian hospitality, as it gives guests a genuine taste of the community’s heritage.",
    traditionalPreparation: "Chicken and aromatics are stuffed into a hollow bamboo tube, sealed with tapioca leaves (daun ubi), and roasted over an open fire. The bamboo acts as a natural pressure cooker, stewing the meat in its own juices and the fragrant sap of the wood.",
    commonIngredients: ["Chicken, Fresh Bamboo Stalk, Onion, Garlic, Lemongrass, Ginger, Torch Ginger, Wild Ginger Stalk, Tapioca leaves."],
    healthTips: "Naturally Oil-Free: Cooks in its own trapped steam with zero added cooking oils. High Protein & Low Carb: A clean, lean protein source that naturally fits into low-carb diets. Antioxidant-Rich: Native ingredients like bunga kantan are packed with natural anti-inflammatory compounds.",
    gram_per_serving: 0.0
  }, 

  // Sarawak Laksa
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
    commonIngredients: "Coconut Milk, Sambal, Rice Vermicelli, Prawn, Bean Sprout, Calamansi Lime",
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