import db from './db.js';
import { recipeData } from './dummyData.js';

function insertRecipes() {
  let index = 0;

  function insertNext() {
    if (index >= recipeData.length) {
      console.log('✅ Finished inserting all recipes!');
      db.end();
      return;
    }

    const recipe = recipeData[index];

    // Insert into recipe table (without images)
    const recipeSql = `
      INSERT INTO recipe (foodID, description, ingredients, steps)
      VALUES (?, ?, ?, ?)
    `;
    const recipeValues = [recipe.foodID, recipe.description, recipe.ingredients, recipe.steps];

    db.query(recipeSql, recipeValues, (err, result) => {
      if (err) {
        console.error(`❌ Error inserting recipe for foodID ${recipe.foodID}:`, err);
        index++;
        insertNext();
        return;
      }

      const recipeID = result.insertId; // get inserted recipeID
      console.log(`Inserted recipe ${index + 1} with ID ${recipeID}`);

      // Insert images into recipe_images table
      if (recipe.images && recipe.images.length > 0) {
        const imageSql = `
          INSERT INTO recipe_images (recipeID, imageURL)
          VALUES ?
        `;
        const imageValues = recipe.images.map(url => [recipeID, url]);

        db.query(imageSql, [imageValues], (err) => {
          if (err) {
            console.error(`❌ Error inserting images for recipeID ${recipeID}:`, err);
          } else {
            console.log(`✅ Inserted ${recipe.images.length} images for recipeID ${recipeID}`);
          }
          index++;
          insertNext();
        });
      } else {
        index++;
        insertNext();
      }
    });
  }

  insertNext();
}

insertRecipes();
