const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db"); // Ensure this path matches your db setup

// ==========================================
// SECURITY MIDDLEWARES
// ==========================================

// 1. Check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// 2. Check if user is an Admin
const isAdmin = (req, res, next) => {
  const role = req.session?.user?.role;
  if (role !== 'admin' && role !== 'Admin') {
    return res.status(403).json({ error: "Unauthorized access. Admins only." });
  }
  next();
};

// 3. CSRF Protection (for POST, PUT, DELETE)
const verifyCSRF = (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'];
  if (!csrfToken || csrfToken !== req.session.csrfToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
};

// ==========================================
// ADMIN ROUTES (Manage Quiz Database)
// ==========================================

// GET: Fetch all questions for the Admin Table
router.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT q.*, f.name as linkedFoodName 
      FROM quiz_questions q 
      LEFT JOIN food f ON q.foodID = f.foodID
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching admin questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST: Add a new question
router.post("/admin", isAuthenticated, isAdmin, verifyCSRF, async (req, res) => {
  const { foodID, question, options, correctAnswer, explanation } = req.body;
  try {
    await db.execute(
      `INSERT INTO quiz_questions (foodID, question, options, correctAnswer, explanation) 
       VALUES (?, ?, ?, ?, ?)`,
      [foodID, question, JSON.stringify(options), correctAnswer, explanation]
    );
    res.json({ success: true, message: "Question added successfully" });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ error: "Failed to add question" });
  }
});

// PUT: Update an existing question
router.put("/admin/:id", isAuthenticated, isAdmin, verifyCSRF, async (req, res) => {
  const { foodID, question, options, correctAnswer, explanation } = req.body;
  try {
    await db.execute(
      `UPDATE quiz_questions 
       SET foodID = ?, question = ?, options = ?, correctAnswer = ?, explanation = ? 
       WHERE questionID = ?`,
      [foodID, question, JSON.stringify(options), correctAnswer, explanation, req.params.id]
    );
    res.json({ success: true, message: "Question updated successfully" });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// DELETE: Remove a question
router.delete("/admin/:id", isAuthenticated, isAdmin, verifyCSRF, async (req, res) => {
  try {
    await db.execute(`DELETE FROM quiz_questions WHERE questionID = ?`, [req.params.id]);
    res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});


// ==========================================
// PLAYER ROUTE (Play the Game)
// ==========================================

// GET: Fetch 5 random questions for the Daily Quiz
router.get("/today", isAuthenticated, async (req, res) => {
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
    console.error("Error generating daily quiz:", error);
    res.status(500).json({ error: "Failed to generate daily quiz" });
  }
});

module.exports = router;