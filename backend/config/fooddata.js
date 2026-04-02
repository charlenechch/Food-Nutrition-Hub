const db = require("./db"); 

const foods = [
  {
    name: "Linut",
    origin: "Melanau",
    category: ["Rice Dish", "Fermented"],
    difficulty: "medium",
    dietaryTags: ["gluten-free", "dairy-free", "paleo", "high-protein", "low-fat"],
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
    commonIngredients: ["Sago flour, Water, Anchovies, Chilies, Belacan, Sugar, Salt, Mango"],
    alternative: "Tapioca starch",
    altDescription: "Tapioca starch can be used as a substitute, producing a slightly clearer and chewier gel.",
    healthTips: "High in carbohydrates but gluten-free. Low in protein and vitamins, so it should be paired with other nutritious foods.",
    gram_per_serving: 328.07
  },

  {
    name: "Kolo Mee",
    origin: "Chinese",
    category: ["Noodles", "Meat"],
    difficulty: "medium",
    dietaryTags: ["dairy-free", "high-protein"],
    description: "The origin of Kolo Mee is still unclear, but it likely originated from Kuching, the capital of Sarawak. \
    “Kolo Mee” may also have derived from the Hokkien and Cantonese words for “dry mixed” noodles. \
    In Hokkien, “kolo” (干捞) means “dry mix,” while in Cantonese, “gorn lo” has a similar meaning. \
    This theory suggests that the name “Kolo Mee” come from how the dish is prepared, which involves tossing the noodles with the sauce and toppings in a dry manner.",
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
    commonIngredients: ["Soy sauce, Egg noodles, Char siu, Spring onions, Shallot oil"],
    alternative: "Vegetable oil, Chicken or shrimp, Dried mushrooms (vegetarian)",
    altDescription: "For a healthier version, use vegetable oil instead of lard and chicken or mushrooms instead of pork.",
    healthTips: "Opt for a version with less lard and more vegetables to reduce saturated fat and increase fiber.",
    gram_per_serving: 248.6704
  },

  {
    name: "Umai",
    origin: "Melanau",
    category: "Seafood",
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
    VitaminC_mg: 109,
    culturalSignificance: "Known as the 'Sarawakian ceviche', Umai is a traditional Melanau fisherman's dish, prepared fresh on boats as a quick and nutritious meal. It showcases the reliance on the state's abundant fresh seafood.",
    traditionalPreparation: "Thinly sliced raw fish (like mackerel or bawal) is 'cooked' by marinating it in a mixture of lime juice, onions, chillies, and salt. It is often mixed with grated dried sago powder for texture.",
    commonIngredients: ["Prawns, Chilies, Ginger, Sugar, Salt, Shallots, Cucumber"],
    alternative: "Fresh salmon or tuna, Lemon juice",
    altDescription: "Any very fresh, sashimi-grade fish can be used. Lemon juice can replace lime for a different citrus note.",
    healthTips: "Ensure the fish is extremely fresh and handled hygienically to avoid foodborne illness. Rich in protein and omega-3 fatty acids.",
    gram_per_serving: 0.0
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
    Energy_kcal: 81,
    Protein_g: 6.88,
    Fat_g: 2.02,
    Carbohydrates_g: 9.24,
    Fiber_g: 0.2,
    VitaminC_mg: 13.8,
    culturalSignificance: "Sarawak's version of fried rice, Nasi Aruk is distinct for being a Malay community specialty. It is a beloved dish for supper and gatherings, known for its intense, smoky flavour without using any oil or liquid in the frying process.",
    traditionalPreparation: "Day-old rice is fried in a dry wok with garlic, shallots, and belacan (shrimp paste), constantly stirred over high heat until it becomes fragrant, dry, and slightly toasted.",
    commonIngredients: ["Anchovies, Garlic, Chilies, Salt, White pepper, Day-old rice"],
    alternative: "Fresh rice (dried out in the fridge), Dried shrimp powder (if belacan is unavailable)",
    altDescription: "If cannot achieve the dry texture without oil, a minimal amount of oil can be used. Dried shrimp can add a similar umami if belacan is unavailable.",
    healthTips: "A relatively low-fat fried rice option due to the no-oil cooking method, but high in sodium from belacan and salt.",
    gram_per_serving: 0.0
  },

  {
    name: "Asam Siok",
    origin: "Bidayuh",
    category: "Poultry",
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
    VitaminC_mg: 81.34,
    culturalSignificance: "A specialty of the Sarawakian Chinese community, particularly in Sibu, known for its bold and tangy profile. It reflects the local adaptation of Chinese noodle dishes using indigenous ingredients like asam (sour) fruits.",
    traditionalPreparation: "A rich, sour, and spicy broth is made from tamarind (asam jawa) or other souring agents, then poured over noodles and topped with shredded chicken, prawns, and mint leaves.",
    commonIngredients: ["Chicken, Ginger, Shallot, Garlic, Tapioca leaves, Rice"],
    alternative: "Lime or calamansi juice, Fish or tofu, Vermicelli or egg noodles",
    altDescription: "Other souring agents like lime can be used if tamarind is unavailable. The protein can be easily swapped to preference or dietary needs.",
    healthTips: "The tamarind-based broth is low in fat. Using skinless chicken and adding more vegetables can make this a very balanced and healthy meal.",
    gram_per_serving: 0.0
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
    Energy_kcal: 1815,
    Protein_g: 190.15,
    Fat_g: 9.2,
    Carbohydrates_g: 242.29,
    Fiber_g: 7.15,
    VitaminC_mg: 52.9,
    culturalSignificance: "A simple yet powerful noodle dish that highlights the central role of belacan in Sarawakian cuisine. It's a common and comforting meal found in many local eateries.",
    traditionalPreparation: "Rice vermicelli (bihun) is blanched and then tossed or stir-fried with a robust sauce made primarily from pounded chillies and belacan, creating a spicy, salty, and umami-rich flavour.",
    commonIngredients: ["Soya bean sprout, Shrimp, Shallot, Rice vermicelli, Chili, Tamarind paste, Brown sugar, Cucumber, Cuttlefish"],
    alternative: "Rice noodles or angel hair pasta, Sambal oelek or chili-garlic paste",
    altDescription: "Other thin noodles can be used. A prepared chili paste can be a quick substitute for the belacan mixture.",
    healthTips: "The sodium content is high due to belacan. Balance the meal by adding side vegetables and a lean protein.",
    gram_per_serving: 0.0
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
    alternative: "Spinach or kale (no need pounding), Chicken or turkey",
    altDescription: "Less fibrous greens can be used but will result in a different texture. Various proteins can be used based on preference.",
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
    alternative: "Spinach or water spinach, Fresh shrimp or anchovies",
    altDescription: "Almost any tender leafy green can be prepared using this method. Fresh seafood can be used instead of dried.",
    healthTips: "Sweet potato leaves (Manicai) are rich in vitamins A, C, and K. A very nutritious and low-calorie dish, especially when prepared with little oil.",
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
    Energy_kcal: 195,
    Protein_g: 17,
    Fat_g: 4.8,
    Carbohydrates_g: 23,
    Fiber_g: 17,
    VitaminC_mg: 25,
    culturalSignificance: "This is the most iconic jungle fern dish of Sarawak. Midin is foraged from the wild, representing the close relationship between Sarawakians and their rich rainforest ecosystem.",
    traditionalPreparation: "The crisp midin ferns are quickly stir-fried in a hot wok with a pungent and savoury paste made from chillies, garlic, and belacan (shrimp paste).",
    commonIngredients: ["Midin, Garlic, Chilies, Shrimp paste, Salt, Shallot"],
    alternative: "Water spinach (kangkung) or other sturdy greens, Dried shrimp paste in oil (as a belacan substitute)",
    altDescription: "If midin is unavailable, kangkung makes a good alternative, though the texture will be softer.",
    healthTips: "Midin is a good source of fiber. Using less belacan can help control sodium intake.",
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
    Energy_kcal: 178.04,
    Protein_g: 30.22,
    Fat_g: 5.22,
    Carbohydrates_g: 0,
    Fiber_g: 0,
    VitaminC_mg: 0,
    culturalSignificance: "The most famous Iban ceremonial dish, traditionally prepared during Gawai. Cooking in a bamboo tube over an open fire imparts a unique aroma and symbolizes unity, skill, and connection to nature.",
    traditionalPreparation: "Chicken is marinated with lemongrass, ginger, tapioca leaves, and minimal water, then stuffed into a bamboo tube sealed with tapioca leaves. The tube is then slanted over an open fire to cook.",
    commonIngredients: ["Chicken, Kantan flower, Lemongrass, Umbut tepus, White onion, Ginger, Bamboo stick, Aji No Moto, Salt, Red onion, Daun ubi"],
    alternative: "Fish or prawns, Banana leaves (if bamboo is unavailable), Spring onions",
    altDescription: "The cooking method can be simulated in a steamer or oven-safe dish wrapped in banana leaves if bamboo is not available.",
    healthTips: "A very healthy cooking method as it uses no oil, steaming the chicken in its own juices, resulting in a lean and flavorful dish.",
    gram_per_serving: 0.0
  }

];

(async () => {
  try {
    for (const food of foods) {
      const sql = `
        INSERT INTO food 
        (name, origin, category, difficulty, dietaryTags, description, image, prepTime, Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg, culturalSignificance, traditionalPreparation, commonIngredients, alternative, altDescription, healthTips, gram_per_serving)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        food.name,
        food.origin,
        food.category,
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
        food.commonIngredients,
        food.alternative,
        food.altDescription,
        food.healthTips,
        food.gram_per_serving,
      ];

      await db.pool.query(sql, values);
    }

    console.log("✅ All data inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting data:", err.message);
    process.exit(1);
  }
})();
