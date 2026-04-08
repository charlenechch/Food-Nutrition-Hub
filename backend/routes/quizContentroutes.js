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
  // ✅ Check multiple common paths for the role
  const role = req.session?.role || req.session?.user?.role;
  if (role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: "Unauthorized access. Admins only." });
  }
  next();
};

// ==========================================
// ADMIN ROUTES (Manage Quiz Database)
// ==========================================

router.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  const db = req.app.get("dbPool"); // ✅ Use shared pool from server.js
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
    res.status(500).json({ error: "Failed to add" });
  }
});

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
    res.status(500).json({ error: "Failed update" });
  }
});

router.delete("/admin/:id", isAuthenticated, isAdmin, async (req, res) => {
  const db = req.app.get("dbPool");
  try {
    await db.execute(`DELETE FROM quiz_questions WHERE questionID = ?`, [req.params.id]);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed delete" });
  }
});

module.exports = router;