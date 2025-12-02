// module.exports = function shapeResultFromDB(row) {
//   return {
//     food: row.name,
//     portion_size: "1 serving",
//     nutrition: {
//       Energy_kcal: row.Energy_kcal,
//       Protein_g: row.Protein_g,
//       Fat_g: row.Fat_g,
//       Carbohydrates_g: row.Carbohydrates_g,
//       Fiber_g: row.Fiber_g,
//       VitaminC_mg: row.VitaminC_mg,
//     },
//     alternatives: row.alternative 
//       ? row.alternative.split(",").map((x) => ({
//           title: x.trim(),
//           description: row.altDescription || ""
//         }))
//       : [],
//     health_notes: row.healthTips || "",
//     meta: {
//       origin: row.origin,
//       category: row.category,
//       image: row.image,
//     },
//   };
// };
