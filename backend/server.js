// backend/server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

// 🧩 Security packages
const hpp = require("hpp");
const sanitizeHtml = require("sanitize-html");

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const loginRoutes = require("./routes/login");
const logoutRoutes = require("./routes/logout");
const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/foods");
const exploreFoodRoutes = require("./routes/exploreFood");
const communityPostRoutes = require("./routes/communityPost");
const otpRoutes = require("./routes/otp");

// Trust the reverse proxy (e.g., Railway)
app.set("trust proxy", 1);

const rbacRoutes = require("./routes/rbacRoutes");
app.use("/api/rbac", rbacRoutes);

// =====================
// 🧩 Security Middleware Stack
// =====================

// 1️⃣ Helmet (HTTP security headers)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "blob:", "https://food-nutrition-hub.vercel.app"],
        "script-src": ["'self'", "'unsafe-inline'", "https://food-nutrition-hub.vercel.app"],
        "connect-src": ["'self'", "https://food-nutrition-hub.vercel.app", "http://localhost:5173"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2️⃣ Prevent HTTP Parameter Pollution
app.use(hpp());

// 3️⃣ JSON parser (must come before sanitizers)
app.use(express.json());

// 4️⃣ Sanitize user input against XSS (replaces xss-clean)
app.use((req, res, next) => {
  const clean = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          obj[key] = sanitizeHtml(obj[key], {
            allowedTags: [],
            allowedAttributes: {},
          });
        } else if (typeof obj[key] === "object") {
          clean(obj[key]);
        }
      }
    }
  };
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
});

// 5️⃣ Manual Mongo-style Injection Sanitizer (replaces express-mongo-sanitize)
app.use((req, res, next) => {
  const sanitizeNoDollar = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key]; // remove dangerous Mongo-style operators
        } else if (typeof obj[key] === "object") {
          sanitizeNoDollar(obj[key]); // recursively sanitize nested objects
        }
      }
    }
  };

  sanitizeNoDollar(req.body);
  sanitizeNoDollar(req.query);
  sanitizeNoDollar(req.params);
  next();
});

// 6️⃣ CORS (Frontend Whitelist)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local frontend
      "https://food-nutrition-hub.vercel.app", // Deployed frontend
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =====================
// 🧩 MySQL + Session Configuration (DO NOT CHANGE)
// =====================
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
    host: "interchange.proxy.rlwy.net",
    port: 13361,
    user: "root",
    password: "GsdEstbgiDCzValxnvDLiDfoEdCPoWyh",
    database: "railway",
  };
}

const sessionStore = new MySQLStore(dbOptions);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      httpOnly: true, // cannot be accessed via JS
      secure: true, // HTTPS only
      sameSite: "none", // allow cross-site cookies (Vercel <-> Railway)
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// =====================
// 🧩 Rate Limiter (Brute-force protection)
// =====================
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per window per IP/email
  message: { error: "Too many attempts, please try again later." },
  keyGenerator: (req, res) => {
    const ipKey = ipKeyGenerator(req, res);
    const emailKey = req.body?.email || "guest";
    return `${ipKey}-${emailKey}`;
  },
});

// =====================
// 🧩 Routes
// =====================
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/exploreFood", exploreFoodRoutes);
app.use("/api/communityPost", communityPostRoutes);

// Admin routes
app.use("/api/foods", foodRoutes);

// Example Admin Endpoint
app.get("/api/admin/data", (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
});

// Health Check Endpoint
app.get("/", (req, res) => {
  res.status(200).type("text/plain").send("🚀 Backend running with MySQL + sessions!");
});

// =====================
// 🧩 Centralized Secure Error Handler
// =====================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// =====================
// 🧩 Start Server
// =====================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
