// backend/server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const MySQLStore = require("express-mysql-session")(session);
const db = require("./config/db"); // ✅ Import your shared pool here
require("dotenv").config();

// Import routes
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/foods");

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------------------------------------------------
   ✅ Security Middleware
--------------------------------------------------------- */
app.use(helmet()); // adds secure headers

/* ---------------------------------------------------------
   ✅ CORS Configuration
--------------------------------------------------------- */
app.use(
  cors({
    origin: [
      "http://localhost:5173",               // Local frontend
      "https://food-nutrition-hub.vercel.app" // Production frontend
    ],
    credentials: true,
  })
);

/* ---------------------------------------------------------
   ✅ Body Parser
--------------------------------------------------------- */
app.use(express.json());

/* ---------------------------------------------------------
   ✅ Session Store (Using Existing MySQL Pool)
   This prevents express-mysql-session from creating its
   own connection that can go stale and cause “closed state”.
--------------------------------------------------------- */
const sessionStore = new MySQLStore({}, db); // ✅ share your pool here

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey", // Use env var in production
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.RAILWAY_ENVIRONMENT ? true : false, // Secure cookies on production HTTPS
      sameSite: process.env.RAILWAY_ENVIRONMENT ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

/* ---------------------------------------------------------
   ✅ Rate Limiter (Hybrid: IP + Email)
--------------------------------------------------------- */
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 5, // block after 5 attempts
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

/* ---------------------------------------------------------
   ✅ Routes
--------------------------------------------------------- */
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);

/* ---------------------------------------------------------
   ✅ Example Admin Route
--------------------------------------------------------- */
app.get("/api/admin/data", (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
});

/* ---------------------------------------------------------
   ✅ Health Check
--------------------------------------------------------- */
app.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS currentTime");
    res.send(`🚀 Backend running with MySQL + sessions! DB time: ${rows[0].currentTime}`);
  } catch (err) {
    console.error("❌ DB check failed:", err.message);
    res.status(500).send("Database connection error");
  }
});

/* ---------------------------------------------------------
   ✅ Global Error Handler
--------------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------------------------------------------------------
   ✅ Start Server
--------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
