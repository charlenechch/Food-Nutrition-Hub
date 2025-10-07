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

// CORS setup
app.use(cors({
    origin: [
    "http://localhost:5173",
    "https://food-nutrition-hub.vercel.app/" // replace with your actual deployed frontend URL
  ],
  credentials: true
}));

// ✅ JSON parser
app.use(express.json());

// ✅ MySQL session store config
const dbOptions = {
  host: "localhost",
  port: 3306, // change if your MySQL runs on 3307
  user: "root",
  password: "",
  database: "fypdb",
};
const sessionStore = new MySQLStore(dbOptions);

// ✅ Session middleware (stored in MySQL)
app.use(
  session({
    secret:
      "9c6bb5d5342ccf81bb30c08874ac5eca58ed5d6f80e8c88e74228b1c3bccaa37",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "strict",
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

// ✅ Hybrid Rate Limiter (IP + Email) 👇
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // block after 3 attempts
  message: { error: "Too many attempts, please try again after 5 minutes." },
  keyGenerator: (req, res) => {
    // Generate safe key for IPv4/IPv6
    const ipKey = ipKeyGenerator(req, res);
    // Use email if provided, otherwise fall back to "guest"
    const emailKey = req.body?.email || "guest";
    // Hybrid: IP + Email = unique key
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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Secure server running at http://localhost:${PORT}`);
});
