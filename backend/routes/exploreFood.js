const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM food");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching foods:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

module.exports = router;
