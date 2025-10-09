const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const MySQLStore = require("express-mysql-session")(session);
const mysql = require("mysql2/promise");

// Import routes
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const foodRoutes = require("./routes/foods");
const authRoutes = require("./routes/auth");
const rbacRoutes = require("./routes/rbacRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Helmet security headers
app.use(helmet());

// ✅ CORS setup (Local + Vercel frontend)
app.use(
  cors({
    origin: [
      "http://localhost:5173",                 // local frontend
      "https://food-nutrition-hub.vercel.app", // deployed frontend
    ],
    credentials: true,
  })
);

// ✅ Automatically handle all OPTIONS preflight requests
// (No need for app.options("*", cors()))
app.use(express.json());

// ✅ MySQL config for Railway OR Local
let dbOptions;
if (process.env.MYSQLHOST || process.env.DB_HOST) {
  console.log("🌐 Railway DB config detected");
  dbOptions = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  };
} else {
  console.log("💻 Local DB config in use");
  dbOptions = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "fypdb",
  };
}

// ✅ Session store
const sessionStore = new MySQLStore(dbOptions);

// ✅ Test DB connection on startup
(async () => {
  try {
    const connection = await mysql.createConnection(dbOptions);
    await connection.query("SELECT 1");
    console.log("✅ MySQL connected successfully!");
    await connection.end();
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
  }
})();

// ✅ Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbackSecret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ Role check middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    next();
  };
}

// ✅ Hybrid Rate Limiter (IP + Email)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: "Too many attempts, please try again later." },
  keyGenerator: (req, res) => {
    const ipKey = ipKeyGenerator(req, res);
    const emailKey = req.body?.email || "guest";
    return `${ipKey}-${emailKey}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`[RateLimit] Blocked ${req.ip} on ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  },
});

// ✅ API Routes
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/register", authLimiter, registerRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rbac", rbacRoutes);

// ✅ Example protected route
app.get("/api/admin/data", requireRole("admin"), (req, res) => {
  res.json({ secret: "This is admin-only data" });
});

// ✅ Health check
app.get("/api/health", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbOptions);
    await connection.query("SELECT 1");
    await connection.end();
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: err.message });
  }
});

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("🚀 Food-Nutrition-Hub backend running on Railway!");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
