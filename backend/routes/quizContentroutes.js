const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");

// ==========================================
// ADMIN ROUTES (Manage Database)
// ==========================================

// GET all questions for the Admin Table
router.get("/admin", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT q.*, f.name as linkedFoodName 
      FROM quiz_questions q 
      LEFT JOIN food f ON q.foodID = f.foodID
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST a new question
router.post("/admin", async (req, res) => {
  const { foodID, question, options, correctAnswer, explanation } = req.body;
  try {
    await db.execute(
      `INSERT INTO quiz_questions (foodID, question, options, correctAnswer, explanation) 
       VALUES (?, ?, ?, ?, ?)`,
      [foodID, question, JSON.stringify(options), correctAnswer, explanation]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to add question" });
  }
});

// (You will also need PUT and DELETE routes here for editing/removing questions)

// ==========================================
// PLAYER ROUTE (Play the Game)
// ==========================================

// GET 5 random questions for the Daily Quiz
router.get("/today", async (req, res) => {
  try {
    // Fetches 5 random questions and joins the food table to get images/names
    const [rows] = await db.execute(`
      SELECT q.*, f.name as foodName, f.image, f.origin as foodOrigin 
      FROM quiz_questions q 
      JOIN food f ON q.foodID = f.foodID 
      ORDER BY RAND() 
      LIMIT 5
    `);
    
    // Parse the JSON options back into an array for the frontend
    const formattedQuestions = rows.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate daily quiz" });
  }
});

module.exports = router;