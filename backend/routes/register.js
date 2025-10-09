const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../config/db");

const saltRounds = 10;

// ✅ Password validation
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

// ✅ Register route
router.post("/", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // Basic validation
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  // Password strength validation
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  try {
    // 🔎 Check if email already exists
    const [existing] = await db.query("SELECT * FROM user WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    // Default role
    const role = "member";

    // 🔑 Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO user (firstname, lastname, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [firstname, lastname, email, hashedPassword, role]
    );

    // Save session
    req.session.user = {
      id: result.insertId,
      firstname,
      lastname,
      email,
      role,
    };

    console.log(`✅ User registered: ${email}`);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: req.session.user,
    });

  } catch (err) {
    console.error("❌ Register error:", err.message || err);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
});

module.exports = router;
