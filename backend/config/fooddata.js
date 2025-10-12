import db from './db.js';
import { foods } from './dummyData.js';

foods.forEach(food => {
  const sql = `
    INSERT INTO Food 
    (name, origin, category, foodType, difficulty, nutritionFocus, dietaryTags, description, image, prepTime, Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    food.name, food.origin, food.category, food.foodType, food.difficulty, food.nutritionFocus, food.dietaryTags, food.description, food.image, food.prepTime, food.Energy_kcal, food.Protein_g, food.Fat_g, food.Carbohydrates_g, food.Fiber_g, food.VitaminC_mg
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error inserting", food.name, err);
      return;
    }
    console.log(`✅ Inserted ${food.name}`);
  });
});