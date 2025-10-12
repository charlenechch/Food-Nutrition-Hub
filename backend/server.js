// backend/server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

// Import routes
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/foods");

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS (frontend whitelist)
app.use(
  cors({
    origin: [
      "http://localhost:5173",              // Local frontend
      "https://food-nutrition-hub.vercel.app", // Deployed frontend
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], 
  })
);

// JSON parser
app.use(express.json());

// Session store config
let dbOptions;
if (process.env.MYSQLHOST || process.env.DB_HOST) {
  dbOptions = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  };
} else {
  dbOptions = {
    host: "localhost",
    port: 3306, // change if you use 3307
    user: "root",
    password: "",
    database: "fypdb",
  };
}

const sessionStore = new MySQLStore(dbOptions);

// Express-session middleware
app.use(
  session({
    secret: "supersecretkey", // change for production
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.RAILWAY_ENVIRONMENT ? true : false,
      sameSite: process.env.RAILWAY_ENVIRONMENT ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Rate Limiter
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 5,
  message: { error: "Too many attempts, try again later." },
  keyGenerator: (req, res) => {
    const ipKey = ipKeyGenerator(req, res);
    const emailKey = req.body?.email || "guest";
    return `${ipKey}-${emailKey}`;
  },
});

// Routes
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);

// Example admin route
app.get("/api/admin/data", (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
});

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Backend running with MySQL + sessions!");
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
