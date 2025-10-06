const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const foodRoutes = require("./routes/foods");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 5000;

// Helmet middleware (security headers)
app.use(helmet());

// CORS setup
app.use(cors({
  origin: "http://localhost:5173", // frontend origin
  credentials: true
}));

// JSON body parser
app.use(express.json());

// Session setup
app.use(session({
  secret: '9c6bb5d5342ccf81bb30c08874ac5eca58ed5d6f80e8c88e74228b1c3bccaa37',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,       // prevent client JS access
    secure: false,        // set true in production (HTTPS)
    sameSite: "strict",   // strong CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Rate limiter for login & register
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // block after 3 requests
  message: { error: "Too many attempts, please try again after 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`[RateLimit] Blocked IP: ${req.ip} on ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Routes
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/register", authLimiter, registerRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend with security and rate limiting!");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Secure server running at http://localhost:${PORT}`);
});
