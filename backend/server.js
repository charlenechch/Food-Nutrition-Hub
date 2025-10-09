const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const MySQLStore = require("express-mysql-session")(session);

const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const foodRoutes = require("./routes/foods");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Security headers (Helmet)
app.use(helmet());

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",             // local frontend
      "https://food-nutrition-hub.vercel.app" // deployed frontend
    ],
    credentials: true,
  })
);

// ✅ JSON parser
app.use(express.json());

// ✅ MySQL session store config (Local + Production)
let dbOptions;

// ✅ Detect Railway automatically
const isRailway = !!process.env.MYSQLHOST || !!process.env.DB_HOST;

if (isRailway) {
  console.log("🌐 Using Railway MySQL configuration");

  dbOptions = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  };

  console.log("🧩 DB Options:", dbOptions); // Debugging
} else {
  console.log("💻 Using LOCAL MySQL configuration");

  dbOptions = {
    host: "localhost",
    port: 3306, // change if your MySQL runs on 3307
    user: "root",
    password: "",
    database: "fypdb",
  };
}


// ✅ Session Store
const sessionStore = new MySQLStore(dbOptions);

// ✅ Test DB Connection
const mysql = require("mysql2/promise");

(async () => {
  try {
    const connection = await mysql.createConnection(dbOptions);
    await connection.query("SELECT 1");
    console.log("✅ MySQL connection successful!");
    await connection.end();
  } catch (err) {
    console.error("❌ Error connecting to MySQL:", err.message);
  }
})();

// ✅ Express Session Middleware
app.use(
  session({
    secret:
      "9c6bb5d5342ccf81bb30c08874ac5eca58ed5d6f80e8c88e74228b1c3bccaa37",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.RAILWAY_ENVIRONMENT ? true : false, // secure cookies only on HTTPS
      sameSite: process.env.RAILWAY_ENVIRONMENT ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ Role-based middleware
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
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // block after 3 attempts
  message: { error: "Too many attempts, please try again after 5 minutes." },
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

// ✅ Routes
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/register", authLimiter, registerRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/auth", authRoutes);

// Example admin-only API
app.get("/api/admin/data", requireRole("admin"), (req, res) => {
  res.json({ secret: "This is admin-only data." });
});

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend with MySQL session store + hybrid rate limiting!");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Secure server running at http://localhost:${PORT}`);
});
