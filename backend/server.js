const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");               // ✅ Helmet for security headers
const rateLimit = require("express-rate-limit"); // ✅ For brute-force protection

const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const foodRoutes = require("./routes/foods");

const app = express();
const PORT = 5000;

// ✅ Apply Helmet (adds XSS, clickjacking, MIME type protections)
app.use(helmet());

// ✅ CORS setup (restrict in production)
app.use(cors({
  origin: "http://localhost:5173",  // change to your frontend domain in prod
  credentials: true
}));

// ✅ Body parser
app.use(express.json());

// ✅ Session setup (use secure settings in production)
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

// ✅ Rate limiter for login (prevent brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // limit each IP to 5 login attempts
  message: { error: "Too many login attempts. Try again later." }
});
app.use("/api/login", loginLimiter, loginRoutes);

// Routes
app.use("/api/register", registerRoutes);
app.use("/api/foods", foodRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend with security!");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Secure server running at http://localhost:${PORT}`);
});
