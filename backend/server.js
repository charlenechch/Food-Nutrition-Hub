const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit"); // correct import
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

// Routes
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/foods");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Security headers
app.use(helmet());

// ✅ CORS setup (frontend whitelist)
app.use(
  cors({
    origin: [
      "http://localhost:5173",               // Local frontend
      "https://food-nutrition-hub.vercel.app" // Deployed frontend
    ],
    credentials: true,
  })
);

// ✅ JSON parser
app.use(express.json());

// ✅ MySQL config (local or Railway)
let dbOptions;
const isRailway = !!process.env.MYSQLHOST || !!process.env.DB_HOST;

if (isRailway) {
  console.log("🌐 Using Railway DB config");
  dbOptions = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  };
} else {
  console.log("💻 Using LOCAL DB config");
  dbOptions = {
    host: "localhost",
    port: 3306, // Change to 3307 if your MySQL runs there
    user: "root",
    password: "",
    database: "fypdb",
  };
}

// ✅ Session store in MySQL
const sessionStore = new MySQLStore(dbOptions);

// ✅ Express-session middleware
app.use(
  session({
    secret:
      "9c6bb5d5342ccf81bb30c08874ac5eca58ed5d6f80e8c88e74228b1c3bccaa37",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isRailway, // HTTPS only in Railway
      sameSite: isRailway ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ Hybrid Rate Limiter (IP + Email)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // block after 5 attempts
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
app.use("/api/register", registerRoutes);
app.use("/api/auth", authRoutes);   // session + logout
app.use("/api/foods", foodRoutes);

// ✅ Example admin-only route
app.get("/api/admin/data", (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
});

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🚀 Backend is running with sessions + MySQL!");
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
