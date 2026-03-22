const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

const toNum = (v) => (v == null ? 0 : Number(v));
const toSlug = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
const parseDietaryTags = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];
  const str = String(raw).trim();
  if (str.startsWith("[")) {
    try {
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return str.split(",").map((s) => s.trim()).filter(Boolean);
};

router.get("/", async (req, res) => {
  try {
    // 1. Changed to LEFT JOIN so foods show up even without recipes
    // 2. Added WHERE f.foodID NOT IN to explicitly block user-created placeholder foods
    const [rows] = await db.query(`
      SELECT f.*,
             COALESCE(r.servings, 1) AS servings
      FROM food f
      LEFT JOIN (
        SELECT foodID, servings,
               ROW_NUMBER() OVER (PARTITION BY foodID ORDER BY recipeID) AS rn
        FROM recipe
        WHERE status = 'Approved'
      ) r ON r.foodID = f.foodID AND r.rn = 1
      WHERE f.foodID NOT IN (
          SELECT r2.foodID 
          FROM recipe r2
          JOIN userProfile up ON r2.userProfileID = up.userProfileID
          JOIN user u ON up.userID = u.userID
          WHERE u.role != 'admin'
      )
    `);

    const result = rows.map((r) => {
      const servings = Math.max(1, Number(r.servings || 1));
      const k = 1 / servings;

      const dietaryTags = parseDietaryTags(r.dietaryTags).map(toSlug);

      return {
        ...r,
        servings,
        dietaryTags,
        Energy_kcal: toNum(r.Energy_kcal),
        Protein_g: toNum(r.Protein_g),
        Fat_g: toNum(r.Fat_g),
        Carbohydrates_g: toNum(r.Carbohydrates_g),
        Fiber_g: toNum(r.Fiber_g),
        VitaminC_mg: toNum(r.VitaminC_mg),

        // per-serving fields
        Energy_kcal_ps: +(toNum(r.Energy_kcal) * k).toFixed(2),
        Protein_g_ps: +(toNum(r.Protein_g) * k).toFixed(2),
        Fat_g_ps: +(toNum(r.Fat_g) * k).toFixed(2),
        Carbohydrates_g_ps: +(toNum(r.Carbohydrates_g) * k).toFixed(2),
        Fiber_g_ps: +(toNum(r.Fiber_g) * k).toFixed(2),
        VitaminC_mg_ps: +(toNum(r.VitaminC_mg) * k).toFixed(2),
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching foods:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

module.exports = router;