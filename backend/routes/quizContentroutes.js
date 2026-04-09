const express = require("express");
const router = express.Router();

// ==========================================
// SECURITY MIDDLEWARES
// ==========================================

const isAuthenticated = (req, res, next) => {
  if (!req.session || (!req.session.user && !req.session.userId)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

const isAdmin = (req, res, next) => {
  const role = req.session?.role || req.session?.user?.role;
  if (role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ error: "Unauthorized access. Admins only." });
  }
  next();
};

// ==========================================
// ADMIN ROUTES (Manage Quiz Database)
// ==========================================

/**
 * ✅ NEW: Auto-Generate Questions Route
 * Uses procedural logic from quizGenerator.js to create questions from existing food data.
 */
router.post("/admin/auto-generate", isAuthenticated, isAdmin, async (req, res) => {
  const db = req.app.get("dbPool");
  try {
    // 1. Fetch all real food data from the database
    const [foods] = await db.execute("SELECT * FROM food");
    
    if (foods.length < 5) {
      return res.status(400).json({ error: "Insufficient food data to generate a quiz (minimum 5 required)." });
    }

    // 2. Define templates based on your quizGenerator.js rules
    const templates = [
      {
        type: 'visual',
        question: (f) => "What dish is shown in this picture?",
        answer: (f) => f.name,
        distractors: (f, all) => all.filter(x => x.name !== f.name).map(x => x.name)
      },
      {
        type: 'culture',
        question: (f) => `What is the cultural origin of ${f.name}?`,
        answer: (f) => f.origin,
        distractors: (f, all) => all.filter(x => x.origin !== f.origin).map(x => x.origin)
      },
      {
        type: 'nutrition',
        question: (f) => `Roughly how many calories are in a standard serving of ${f.name}?`,
        answer: (f) => `${f.Energy_kcal} kcal`,
        distractors: (f) => [
          `${Math.round(f.Energy_kcal * 0.5)} kcal`, 
          `${Math.round(f.Energy_kcal * 1.5)} kcal`, 
          `${Math.round(f.Energy_kcal * 2)} kcal`
        ]
      }
    ];

    // 3. Pick 5 random foods
    const selectedFoods = foods.sort(() => 0.5 - Math.random()).slice(0, 5);

    for (const food of selectedFoods) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // Generate 3 wrong options
      const rawDistractors = template.distractors(food, foods);
      const uniqueDistractors = [...new Set(rawDistractors)]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [template.answer(food), ...uniqueDistractors].sort(() => 0.5 - Math.random());

      // 4. Save to database
      await db.execute(
        `INSERT INTO quiz_questions (foodID, question, options, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?)`,
        [food.foodID, template.question(food), JSON.stringify(options), template.answer(food), food.description || "Learn more about this heritage dish!"]
      );
    }

    res.json({ success: true, message: `Successfully auto-generated 5 new questions!` });
  } catch (error) {
    console.error("Auto-generate error:", error);
    res.status(500).json({ error: "Internal server error during auto-generation" });
  }
});

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

// POST: Add a new question manually
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
    res.status(500).json({ error: "Failed delete" });
  }
});

// ==========================================
// PLAYER ROUTE (Play the Game)
// ==========================================

router.get("/today", isAuthenticated, async (req, res) => {
  const db = req.app.get("dbPool");
  try {
    const [rows] = await db.execute(`
      SELECT q.*, f.name as foodName, f.image, f.origin as foodOrigin 
      FROM quiz_questions q 
      LEFT JOIN food f ON q.foodID = f.foodID 
      ORDER BY RAND() 
      LIMIT 5
    `);
    
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