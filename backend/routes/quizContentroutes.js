const express = require("express");
const router = express.Router();

// ==========================================
// SECURITY MIDDLEWARES
// ==========================================

// 1. Check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (!req.session || (!req.session.user && !req.session.userId)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// 2. Check if user is an Admin
const isAdmin = (req, res, next) => {
  // ✅ Checks multiple common session paths for the role
  const role = req.session?.role || req.session?.user?.role;
  if (role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: "Unauthorized access. Admins only." });
  }
  next();
};

// ==========================================
// ADMIN ROUTES (Manage Quiz Database)
// ==========================================

// GET: Fetch all questions for Admin Dashboard
router.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  const db = req.app.get("dbPool"); 
  try {
    const [rows] = await db.execute(`
      SELECT q.*, f.name as linkedFoodName 
      FROM quiz_questions q 
      LEFT JOIN food f ON q.foodID = f.foodID
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Admin fetch error:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST: Add a new question
router.post("/admin", isAuthenticated, isAdmin, async (req, res) => {
  const db = req.app.get("dbPool");
  const { foodID, question, options, correctAnswer, explanation } = req.body;
  try {
    await db.execute(
      `INSERT INTO quiz_questions (foodID, question, options, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?)`,
      [foodID, question, JSON.stringify(options), correctAnswer, explanation]
    );
    res.json({ success: true, message: "Question added" });
  } catch (error) {
    console.error("Admin post error:", error);
    res.status(500).json({ error: "Failed to add" });
  }
});

// PUT: Update an existing question
router.put("/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  const db = req.app.get("dbPool");
  const { foodID, question, options, correctAnswer, explanation } = req.body;
  try {
    await db.execute(
      `UPDATE quiz_questions SET foodID = ?, question = ?, options = ?, correctAnswer = ?, explanation = ? WHERE questionID = ?`,
      [foodID, question, JSON.stringify(options), correctAnswer, explanation, req.params.id]
    );
    res.json({ success: true, message: "Updated" });
  } catch (error) {
    console.error("Admin put error:", error);
    res.status(500).json({ error: "Failed update" });
  }
});

// DELETE: Remove a question
router.delete("/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  const db = req.app.get("dbPool");
  try {
    await db.execute(`DELETE FROM quiz_questions WHERE questionID = ?`, [req.params.id]);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Admin delete error:", error);
    res.status(500).json({ error: "Failed delete" });
  }
});

// ==========================================
// PLAYER ROUTE (Play the Game)
// ==========================================

// GET: Fetch 5 random questions for the Daily Quiz
router.get("/today", isAuthenticated, async (req, res) => {
  const db = req.app.get("dbPool");
  try {
    // 💡 Fix: Using LEFT JOIN ensures questions show up even if the linked food is missing in the food table
    const [rows] = await db.execute(`
      SELECT q.*, f.name as foodName, f.image, f.origin as foodOrigin 
      FROM quiz_questions q 
      LEFT JOIN food f ON q.foodID = f.foodID 
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
    console.error("Daily quiz fetch error:", error);
    res.status(500).json({ error: "Failed to generate daily quiz" });
  }
});

module.exports = router;