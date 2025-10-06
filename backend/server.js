const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit"); // For brute-force protection

const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const foodRoutes = require("./routes/foods");

const app = express();
const PORT = 5000;

// Helmet middleware (security headers)
app.use(helmet());

// CORS setup (restrict in production)
app.use(cors({
  origin: "http://localhost:5173", // change to your frontend domain in prod
  credentials: true
}));

// Body parser
app.use(express.json());

// Session setup
app.use(session({
  secret: '9c6bb5d5342ccf81bb30c08874ac5eca58ed5d6f80e8c88e74228b1c3bccaa37',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,   // prevent JS from reading cookies
    secure: false,    // set to true in production with HTTPS
    sameSite: "strict", // helps prevent CSRF
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ✅ Rate limiter for login & register
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Block after 3 attempts
  message: { error: "Too many attempts, please try again after 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`[RateLimit] Blocked IP: ${req.ip} after too many attempts on ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Apply limiter only to login & register
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/register", authLimiter, registerRoutes);
app.use("/api/foods", foodRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend with security and rate limiting!");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Secure server running at http://localhost:${PORT}`);
});
