const express = require("express");
const cors = require("cors");
const session = require("express-session");
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const foodRoutes = require("./routes/foods");
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Session setup
app.use(session({
  secret: '9c6bb5d5342ccf81bb30c08874ac5eca58ed5d6f80e8c88e74228b1c3bccaa37',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Basic test route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend!");
});

// API routes
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/foods", foodRoutes);
app.use('/api/auth', authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
