const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, r.status 
      FROM food f 
      JOIN recipe r ON f.foodID = r.foodID 
      WHERE r.status = 'Approved'
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching foods:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

module.exports = router;