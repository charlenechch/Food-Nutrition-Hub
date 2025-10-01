import db from './db.js';
import { foods } from './dummyData.js';

foods.forEach(food => {
  const sql = `
    INSERT INTO Food 
    (name, origin, Energy_kcal, Water_g, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, Ash_g, 
    Sugar_g, VitaminC_mg, Cholesterol_mg, Calcium_mg, Iron_mg, Magnesium_mg, Phosphorus_mg, 
    Potassium_mg, Sodium_mg, Zinc_mg, Copper_g, Lipids_g, Iodine_ug, Thiamin_mg, Riboflavin_mg, 
    Niacin_mg, Retinol_ug, Carotenes_ug, RetinolEq_ug, VitaminA_ug, AlphaTocopherol_ug, Cholecalciferol_ug, 
    Choline_mg, Manganese_ug, VitaminK_ug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    food.name, food.origin, food.Energy_kcal, food.Water_g, food.Protein_g, food.Fat_g, food.Carbohydrates_g, food.Fiber_g, food.Ash_g, 
    food.Sugar_g, food.VitaminC_mg, food.Cholesterol_mg, food.Calcium_mg, food.Iron_mg, food.Magnesium_mg, food.Phosphorus_mg, 
    food.Potassium_mg, food.Sodium_mg, food.Zinc_mg, food.Copper_g, food.Lipids_g, food.Iodine_ug, food.Thiamin_mg, food.Riboflavin_mg, 
    food.Niacin_mg, food.Retinol_ug, food.Carotenes_ug, food.RetinolEq_ug, food.VitaminA_ug, food.AlphaTocopherol_ug, food.Cholecalciferol_ug, 
    food.Choline_mg, food.Manganese_ug, food.VitaminK_ug
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error inserting", food.name, err);
      return;
    }
    console.log(`✅ Inserted ${food.name}`);
  });
});