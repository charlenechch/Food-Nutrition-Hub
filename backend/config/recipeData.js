const db = require("./db");

// recipeData.js
const recipeData = [
  {
    foodID: 1, //linut
    userProfileID: 1,
    status: "Approved",
    description: "The dish is made from sago, a type of starch produced from the sago palm. \
                  Sago is mixed with water to produce a thick, sticky paste, which is then steamed to get its gelatinous and chewy texture. \
                  Linut is usually bland, making it a great carrier for savoury side dishes such as meat stews, spicy sambal, or rich gravies prepared using meat or seafood.",
    ingredients: `33 g sago flour
                  67-100 ml water
                  1/3 cup anchovies
                  2 small chilies
                  1 inches belacan
                  1.5 tablespoons sugar
                  1/6 teaspoon salt
                  1/3 young mango 
                  1/6-1/3 cup hot water
                  `,
    steps: `Preparation of linut:
            1. In a pot, mix sago flour* with plain water to the sago level and mix well.
            2. Then, heat over medium heat, stirring constantly until clear and viscous (like glue), (adjust water as needed) turn off the heat and continue stirring because the heat from the pan is still there.
            Preparation of Sambal Asam:
            3. Peel the mango and chop finely. Set aside.
            4. Pound/grind the anchovies, small chilli and belacan* until smooth.
            5. Pour into a mortar and pestle or a stone mortar. Add sugar and salt. Mix well. Add chopped mango and mash.
            6. Mix well and add enough hot water. Stir well. Sambal Asam is ready.
            7. How to serve, spoon the linut/ambuyat in a small bowl and drizzle with sambal asam.
            `,
    cookTime: 15,
    servings: 1,
    DidYouKnow: "Linut is also known as ambuyat in Brunei and is considered a national dish there. The sago starch used comes from the sago palm, which is abundant in Borneo.",
    chefTips: "For the perfect linut consistency, stir continuously while cooking and adjust water gradually. The final texture should be smooth and glue-like.",
    publish: "publish",
    recipeName: "Linut1",
  },

  {
    foodID: 2, //kolo mee
    userProfileID: 2,
    status: "Approved",
    description: "The name “Kolo Mee” come from how the dish is prepared, which involves tossing the noodles with the sauce and toppings in a dry manner.",
    ingredients: `Ingredients A (The minced meat)
                  15g minced meat
                  1 tsp light soy sauce
                  1/2 tsp dark soy sauce
                  1/2 tbsp oyster sauce
                  1/8 tsp sesame oil
                  1/8 tsp white pepper
                  1/2 tbsp vegetable oil
                  
                  Ingredients B (Other ingredients for the noodles)
                  100g fresh egg noodles (weight after cooked)
                  3 slices Char siu
                  1 Fish balls
                  1 stalks Choy sum (or bok choy)
                  
                  Ingredients C (Sauce for the noodles for two servings)
                  3/4 tbsp light soy sauce
                  1/4 tbsp oyster sauce
                  1/2 tbsp fried shallot oil
                  
                  Ingredients D (Toppings)
                  1 tbsp chopped spring onions
                  1 tbsp fried shallots
                  1/2 tbsp fried garlic
                  1 tbsp pork crackles
                  Sliced chilies to garnish
                  `,
    steps:`Fried the shallot and garlic:
          1.Coarsely chop some garlic and thinly slice the shallots
          2.Fry the shallots in vegetable oil over low heat. Stir continuously. When the shallot falls slightly short of golden, pour the shallot and oil through a wire mesh strainer. 
          3.Return the strained shallot oil to the pan. Then add the garlic and repeat the same process as the shallot until the garlic turns golden and crispy. Strain again to remove the fried garlic.
          Cook the minced meat
          4.Heat the vegetable oil to medium-high heat. Add the minced meat. 
          5.Add the remaining ingredients A and stir-fry until browned. Set aside the cooked minced meat for later use.
          Cook the noodles:
          6.Cook the egg noodles in boiling according to the package instructions. When the noodles have loosened and are nearly cooked, remove and place them in a pot of cold water to cool.
          7.Return the cooled noodles to the boiling water until fully cooked.
          8.Drained and place the noodles in the serving boil.
          To serve:
          9.Combine the cooked egg noodles with the sauce for the noodles in the serving bowl.
          10.Add the minced meat sauce, sliced char siu, fish balls, and choy sum.
          11.Sprinkle the spring onions and fried shallots on top of the noodles.
          `,
    cookTime: 20,
    servings: 1,
    DidYouKnow: "Kolo Mee is unique to Sarawak and differs from Peninsular Malaysian wantan mee. The name comes from the Cantonese 'gàn lò mihn' meaning 'dry-tossed noodles'.",
    chefTips: "For authentic Kuching-style kolo mee, use fresh yellow egg noodles and don't overcook them. The noodles should be springy (QQ texture).",
    publish: "publish",
    recipeName: "KoloMee1",
  },

  {
    foodID: 3, //umai
    userProfileID: 3,
    status: "Approved",
    description: "Raw tenggiri (mackerel) is sliced or cubed and marinated in lime juice, allowing the acidity to “cook” the fish. \
    Chopped onions, chillies, and tomatoes are added and seasoned with salt, sugar, and soy or fish sauce. \
    The dish tastes fresh and tangy with a slight heat and is served chilled or at room temperature, often alongside rice.",
    ingredients: `300 g very fresh raw prawns, shelled, intestinal tract removed
                  6 limes (5 juiced, 1 thinly sliced)
                  ½ tsp salt
                  1 tsp sugar
                  2 red Asian shallots, thinly sliced
                  1 bird’s eye chilli, thinly sliced
                  2 cm piece peeled ginger, julienned
                  cucumber and tomato, to serve
                  Paste 
                  2 bird’s eye chillies
                  2 red Asian shallots, peeled
                  2 garlic cloves, peeled
                  2 cm piece peeled ginger`,
    steps:`1. Coarsely chop all the paste ingredients and pound them together into a rough paste.
           2. Chop the prawns roughly and mix them with the paste in a bowl. Add lime juice, salt, and sugar, then let it sit for 10 minutes.
           3. Just before serving, stir in the shallots, chili, ginger, and lime slices. Serve immediately with cucumber and tomato on the side.`,
    cookTime: 0,
    servings: 1,
    DidYouKnow: "Umai is often called the 'Sarawakian ceviche'. The Melanau people traditionally used freshly caught fish from the South China Sea, with the lime juice 'cooking' the protein.",
    chefTips: "Use only the freshest seafood possible. The lime juice should turn the prawns opaque within 10 minutes. If not, the prawns may not be fresh enough.",
    publish: "publish",
    recipeName: "Umai1",
  },

  {
    foodID: 4, //nasi aruk
    userProfileID: 4,
    status: "Approved",
    description: "The dish is composed simply of rice combined with anchovies, fragrant torch ginger, turmeric leaves, and the heat of bird’s-eye chilli.",
    ingredients: `A handful of anchovies (ikan bilis)
                  2 red shallots (sliced)
                  3 cloves of garlic (sliced)
                  4 bird’s-eye chillies (sliced)
                  Salt, to taste
                  Ground white pepper, to taste`,
    steps:`1. Fry the anchovies. Remove and drain the oil. Take the oil out of the pan.
           2. Sauté the shallots and garlic until fragrant.
           3. Add cold/leftover rice. Mix until evenly combined.
           4. Add the fried anchovies and bird’s-eye chillies. Season with salt and ground white pepper. Stir until everything is well mixed and the rice is fairly dry. Turn off the heat.
           5. Ready to serve.`,
    cookTime: 15,
    servings: 1,
    DidYouKnow: "Nasi Aruk is unique because it's cooked without any additional oil - the rice is toasted in its own natural oils and the residual oil from frying ingredients.",
    chefTips: "Use day-old rice for best results as it's drier. The key is to keep stirring until each grain is separate and slightly toasted.",
    publish: "publish",
    recipeName: "NasiAruk1",
  },

  {
    foodID: 5, //terung asam
    userProfileID: 5,
    status: "Approved",
    description: "Terung asam uses salted fish and sour eggplant as its main ingredients. This soup is truly delicious, with a balance of sour, salty, sweet, and spicy flavours.",
    ingredients: `1/2 large onion (sliced)
                  1 cloves garlic (sliced)
                  2 ½ small chillies (sliced)
                  1/2 inch belacan
                  ¼ salted fish
                  1 sour eggplant (thinly sliced)
                  ¼ tsp turmeric powder
                  ¼ tsp seasoning powder
                  ⅛ tsp salt
                  ¼ tsp sugar
                  ⅛ tbsp cooking oil
                  150 ml water`,
    steps:`1. Prepare all ingredients as listed. Wash them thoroughly and cut as needed.
            2. Heat cooking oil, then fry the salted terubuk fish first. Remove and set aside. In the same pan, cook the sliced ingredients together with belacan and turmeric powder until fragrant.
            3. Add sour eggplant, salted fish, water, salt and seasoning powder. Bring to a boil, then turn off the heat. Ready to serve.`,
    cookTime: 30,
    servings: 1,
    DidYouKnow: "Terung asam (also known as terung Dayak) is a native ingredient of Sarawak, commonly used in traditional soups and dishes for its natural sour taste",
    chefTips: "Cut the terung asam into wedges and adjust the amount based on your preferred sourness. You may keep the seeds for a stronger tangy flavour or remove them for a milder taste.",
    publish: "publish",
    recipeName: "TerungAsam1",
  },

  {
    foodID: 6, //belacan bihun
    userProfileID: 6,
    status: "Approved",
    description: "Featuring rice noodles served with a spicy, umami-rich gravy made from belacan.",
    ingredients: `70g rice vermicelli
                  3 small chilli
                  50g shrimp paste
                  1 tablespoon tamarind paste
                  25g soya bean sprout
                  70g dried shrimp
                  3 shallot
                  1 tablespoon brown sugar
                  1/3 fresh cuttlefish
                  1/3 cucumber`,
    steps:`1. In a frying pan, pan fry the belachan or shrimp paste until fragrant and aromatic.
           2. Properly grilled shrimp paste will give you a nice aroma. In this process, the shrimp paste may disintegrate but that is ok for the next step.
           3. Pound the chilli, soaked dry prawns and shallots until as fine as possible. Set aside. You can also use a blender if you wished.
           4. In a pot, put the water, add the pounded herbs and dried shrimps followed by toasted shrimp paste, tamarind juice and the brown sugar. 
           5. Bring to boil. Once boil, lower the heat to medium and let it simmer for at least 15-20 minutes. Take a tablespoon and taste some. Add additional sugar and salt if desired.
           6. For assembly, have a bowl or plate, put some rice vermicelli, pour some gravy on top until it covers the rice vermicelli. 
           7. Drizzle with special sauces (as explained in ingredients, if desired). Garnish with some century eggs, shredded cucumber, cuttlefish and beansprouts.`,
    cookTime: 25,
    servings: 1,
    DidYouKnow: "Belacan Bihun is a Kuching specialty that combines Chinese rice vermicelli with Malay-style belacan gravy, showcasing Sarawak's cultural fusion.",
    chefTips: "Toast the belacan properly until fragrant but not burnt. The gravy should be thick enough to coat the noodles but still pourable.",
    publish: "publish",
    recipeName: "BelacanBihun1",
  },

  {
    foodID: 7, //daun ubi tumbuk
    userProfileID: 7,
    status: "Approved",
    description: "Daun Ubi Tumbuk is a traditional vegetable dish widely enjoyed among Borneo’s native communities. It was pounded using a wooden mortar and pestle and typically stir-fried with garlic, shallots, and ikan bilis (anchovies). This daily Sarawakian dish is prized for its simplicity and clean taste. ",
    ingredients: `200 grams Daun Ubi (Cassava Leaves)
                  15 grams Anchovies
                  750 ml Water
                  1 Tbsp of Salt
                  1 stalk Lemongrass
                  20 grams Galangal 
                  50 grams Shallots
                  15 grams Bird Eyes Chili
                  15 grams Garlic
                  `,
    steps:`1. Mash the shallots, garlic and local chilli and set it aside.
           2. Mash the cassava leaves with torch ginger flower.
           3. Prepare a pan with water, then add the lemongrass, galangal, and bird-eyed anchovies. Simmer it for 10 minutes over low heat.`,
    cookTime: 20,
    servings: 1,
    DidYouKnow: "Cassava leaves must be thoroughly cooked as they contain cyanogenic glycosides which can be toxic when raw. Traditional pounding helps break down these compounds.",
    chefTips: "Young cassava leaves are more tender and less bitter. Always cook cassava leaves for at least 15-20 minutes to ensure safety.",
    publish: "publish",
    recipeName: "DaunUbiTumbuk1",
  },

  {
    foodID: 8, //manicai
    userProfileID: 8,
    status: "Approved",
    description: "Manicai is a sweet, nutty leafy vegetable prepared using a distinctive “scrunching” technique and stir-fried with garlic, dried shrimp, and eggs into a dry, smoky, and flavourful dish enjoyed daily across communities.",
    ingredients: `200g Manicai (plucked from stalks)
                  1 tablespoon salt
                  2 cloves garlic, minced
                  2 eggs
                  1 teaspoon MSG free Chicken stock powder (omit)
                  50ml water
                  1 tablespoon light soy sauce (optional)`,
    steps:`1. Wash the leaves thoroughly and add the salt. Leave for several minutes, then squeeze all the juice out. Rinse, and squeeze again. Place the leaves on chopping board and dice into small pieces. Set aside.
           2. In a wok/pan, heat 3-4 tablespoons of oil. Once it’s hot, cook the garlic until aromatic. Stir in the leaves and cook for about a minute till wilt. Add water when it starts to look quite dry (about halfway through).
           3. Make a well in the middle, crack the eggs in and beat with chopsticks to mix. Once the eggs are starting to set, start mixing everything together, adding more water if needed. Turn off the heat after about a minute or so. Serve while hot.`,
    cookTime: 10,
    servings: 1,
    DidYouKnow: "Manicai (Sauropus androgynus) is also called 'Sweet Leaf' or 'Cekur Manis'. It's rich in vitamins A, B, and C, and contains more protein than most leafy vegetables.",
    chefTips: "Don't overcook manicai as it becomes bitter. The salting process helps reduce its natural sliminess and enhances the flavor.",
    publish: "publish",
    recipeName: "Manicai1",
  },

  {
    foodID: 9, //midin belacan
    userProfileID: 9,
    status: "Approved",
    description: "Prepared by blanching the crisp midin fern before stir-frying it with fragrant garlic, shallots, and belacan,\
    then finishing with seasonings like salt, sugar, and calamansi juice, with optional variations such as rice wine or red bell pepper adding depth while keeping true to its humble roots.",
    ingredients: `2 bunch of Midin (cut to about 15cm from the curled head and washed)\
                  2 cloves of Garlic
                  1 Shallot
                  100g Anchovies
                  3 Bird eye's chillies
                  2cm cube Shrimp paste (belacan)
                  2tsp Salt to taste
                  50ml Water`,
    steps:`
          1. Pound anchovies, shallots, chillies and shrimp paste (medium coarse)
          2. Smashed garlic. Saute with skin intact until golden brown.
          3. Stir in the shrimp paste mixture until fragrant.
          4. Stir in the midin for about a minute. Careful not to overcook.
          5. Add in small amount of water. Add in salt to taste. Serve immediately. 
          `,
    cookTime: 8,
    servings: 1,
    DidYouKnow: "Midin is a wild fern found only in Sarawak and is considered a delicacy. The fiddleheads are harvested young when they're still curled up.",
    chefTips: "Midin cooks very quickly - just blanch or stir-fry for 1-2 minutes. Overcooking makes it slimy. Always choose tightly curled fiddleheads.",
    publish: "publish",
    recipeName: "MidinBelacan1",
  },

  {
    foodID: 10, //ayam pansuh
    userProfileID: 10,
    status: "Approved",
    description: "Offering a glimpse into the essence of this traditional delicacy.",
    ingredients: `1 Chicken
                  1 bundle of umbut tepus
                  A kantan flower
                  10 daun ubi
                  1 stick of lemongrass
                  3 wite onion
                  2 red onion
                  50g ginger
                  1 turmeric leaf
                  1 bamboo stick
                  50ml Water
                  1tsp Aji No Moto 
                  2tsp Salt`,
    steps:`1. Cut the chickens into pieces
          2.Prepare all the ingredients by cutting, washing, and draining them. Mix the chicken and spices thoroughly.
          3.Clean the bamboo and place the ingredients inside. Add a little water to create the broth.
          4.Traditionally, the bamboo is cooked over an open fire. In this case, it was grilled over a gas stove due to heavy rain. Keep a steady fire and watch closely until you hear the broth bubbling inside the bamboo.
          5.Seal the top of the bamboo with yam leaves (traditional method) or aluminum foil as an alternative.
          `,
    cookTime: 90,
    servings: 1,
    DidYouKnow: "Ayam Pansuh (or Manok Pansoh) is the ultimate Iban hospitality dish. It's traditionally served to honored guests during Gawai festivals and special occasions.",
    chefTips: "Use fresh bamboo for authentic flavor. The bamboo should be green and moist inside. Listen for the bubbling sound - it means the dish is cooking properly inside the sealed bamboo.",
    publish: "publish",
    recipeName: "AyamPansuh1",
  }, 

  {
    foodID: 11, //laksa
    userProfileID: 10,
    status: "Approved",
    description: "If you are looking for a Laksa that is slightly subtler compared to the full-on Assam and Curry Laksas you get in Penang and Malacca, look towards Sarawak’s version of this dish. A typical bowl of Laksa in this East Malaysian state comes fully loaded with shrimp and chicken amongst other ingredients. But the magic, as with all Laksas is in its reddish-brown broth; a delectable potion of chicken and shellfish stock, sambal (chilli paste), local Sarawak black pepper and other spices.",
    ingredients: `400g dried rice vermicelli noodles
                  750g chicken thighs on the bone
                  500g raw king prawns – shells and heads removed and reserved for stock
                  Prawn shell trimmings from above
                  1.5 litres of water
                  4 dried tamarind slices (Asam gelugor)
                  6 cardomom pods
                  4 star anise
                  250 ml coconut milk
                  3 tbsp vegetable oil
                  Spice Paste:
                  8 candlenuts
                  20 black peppercorns (Sarawak peppercorns are best if you can find them)
                  4 tbsp ground coriander
                  2 tbsp ground cumin
                  1 tbsp ground nutmeg
                  4 tbsp dried shrimp – soaked and drained
                  2 stalks lemongrass
                  5 cm length galangal (15g)
                  5 cm length ginger (15g)
                  1 tbsp belacan (fermented shrimp paste)  – toasted before use
                  20 dried chillies (20g) – soaked, deseeded and sliced
                  4 red chillies (75g) – deseeded and sliced
                  14 shallots (200g) – halved
                  4 cloves garlic
                  2 tbsp palm (or brown) sugar
                  Seasoning:
                  2 – 3 tbsp light soy sauce (to taste)
                  1 – 2 tbsp fish sauce (to taste)
                  Large pinch of salt (to taste)
                  1 – 2 tbsp palm (or brown) sugar (to taste)
                  Garnish:
                  100g beansprouts – blached for 30 seconds in boiling water then refreshed
                  100g lettuce leaves – finely sliced
                  50g mint – leaves picked`,
    steps:`1. Set the stock to cook: In a large saucepan, lightly brown the chicken thighs, prawn trimmings, star anise and cardamom in 1 tablespoon of oil. Cover with 1.5 litres of water and simmer for 35 – 40 minutes with the tamarind slices and a large pinch of salt. When ready, pass the stock through a sieve and set aside. Reserve the chicken thighs and shred the meat finely. Discard the prawn shells and spices.
            2. Cook the rice noodles in simmering water for 3 minutes (or as per the packet instructions). Refresh in cold water, drain and set aside.
            3. Process all the spice paste ingredients in a food processor until smooth. Sauté the paste in 2 tablespoons of oil for 7 to 8 minutes until fragrant. To make the Laksa broth, add the stock, coconut milk and seasonings. Bring to a simmer for 15 minutes.
            4. Poach the prawns in the broth for 5 minutes until cooked. Remove and set aside
            5. Construct the Laksa: In a soup bowl, add a bed of cooked vermicelli noodles. Ladle over a few measures of the hot broth then top as desired with the shredded chicken, prawns and vegetable garnish (lettuce and mint). Serve immediately. It’s traditional to have an extra side bowl of sambal and some wedges of lime for people to help themselves to.
          `,
    cookTime: 60,
    servings: 6,
    DidYouKnow: "Sarawak Laksa was famously called the 'Breakfast of the Gods' by the late world-renowned chef Anthony Bourdain, who visited Kuching twice just for a bowl. Unlike most laksa that rely on commercial curry powder, the Sarawakian version uses a secret "laksa paste" made from over 20 different herbs and spices that creates a flavour that is neither a typical curry nor a sour soup.",
    chefTips: "To get that deep and signature flavour, always boil the prawn heads and shells to create a concentrated stock before adding other ingredients. ",
    publish: "publish",
    recipeName: "Sarawak Laksa",
  }
];



(async () => {
  try {
    for (const recipe of recipeData) {
    const sql = `
      INSERT INTO recipe (foodID, userProfileID, description, ingredients, steps, cookTime, servings, DidYouKnow, chefTips, publish, recipeName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      recipe.foodID,
      recipe.userProfileID,
      recipe.ingredients,
      recipe.steps,
      recipe.cookTime,
      recipe.servings,
      recipe.DidYouKnow,
      recipe.chefTips,
      recipe.publish,
      recipe.recipeName
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
