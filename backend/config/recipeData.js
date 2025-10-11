import db from './db.js';
import { recipeData } from './dummyData.js';

async function insertRecipes() {
  try {
    // Insert all recipes
    const recipeSql = `
      INSERT INTO recipe (foodID, description, ingredients, steps)
      VALUES ?
    `;
    const recipeValues = recipeData.map(r => [
      r.foodID,
      r.description,
      r.ingredients,
      r.steps
    ]);

    const [recipeResult] = await db.promise().query(recipeSql, [recipeValues]);
    console.log(`✅ Inserted ${recipeResult.affectedRows} recipes!`);

    // Prepare all image insert data
    const imageEntries = [];
    for (let i = 0; i < recipeData.length; i++) {
      const recipe = recipeData[i];
      const recipeID = recipeResult.insertId + i; // auto_increment IDs are sequential
      if (recipe.images && recipe.images.length > 0) {
        recipe.images.forEach(url => imageEntries.push([recipeID, url]));
      }
    }

    // Insert all recipe images 
    if (imageEntries.length > 0) {
      const imageSql = `
        INSERT INTO recipe_images (recipeID, imageURL)
        VALUES ?
      `;
      const [imageResult] = await db.promise().query(imageSql, [imageEntries]);
      console.log(`✅ Inserted ${imageResult.affectedRows} recipe images!`);
    } else {
      console.log('⚠️ No images to insert.');
    }

  } catch (err) {
    console.error('❌ Error inserting recipes or images:', err);
  } finally {
    db.end();
  }
}

insertRecipes();
