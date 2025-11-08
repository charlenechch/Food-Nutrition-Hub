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
    // Pick exactly one approved recipe per food (lowest recipeID; change ORDER BY as needed)
    const [rows] = await db.query(`
      SELECT f.*,
             COALESCE(r.servings, 1) AS servings
      FROM food f
      LEFT JOIN (
        SELECT *
        FROM (
          SELECT r.*,
                 ROW_NUMBER() OVER (PARTITION BY r.foodID ORDER BY r.recipeID) AS rn
          FROM recipe r
          WHERE r.status = 'Approved'
        ) t
        WHERE t.rn = 1
      ) r ON r.foodID = f.foodID
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