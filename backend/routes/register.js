const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const db = require("../config/db"); // shared promise pool

const saltRounds = 10;

// Password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) return `Password must be at least ${minLength} characters long`;
  if (!hasUpperCase) return "Password must contain at least one uppercase letter";
  if (!hasLowerCase) return "Password must contain at least one lowercase letter";
  if (!hasNumber) return "Password must contain at least one number";
  if (!hasSpecialChar) return "Password must contain at least one special character";
  return null;
};

// ✅ POST /api/register
router.post("/", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Email check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Password check
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    // ✅ Check if email already exists
    const [existing] = await db.query("SELECT 1 FROM user WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ✅ Insert user
    const [result] = await db.query(
      "INSERT INTO user (firstname, lastname, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [firstname, lastname, email, hashedPassword, "member"]
    );

    res.json({
      success: true,
      message: "Registration successful",
      user: {
        id: result.insertId,
        firstname,
        lastname,
        email,
        role: "member",
      },
    });

  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
