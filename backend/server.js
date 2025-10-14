// BACKEND SERVER.JS

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const csrf = require("csurf");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

// 🧩 Security packages
const hpp = require("hpp");
const sanitizeHtml = require("sanitize-html");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// 📦 Route Imports
// =====================
const loginRoutes = require("./routes/login");
const logoutRoutes = require("./routes/logout");
const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/foods");
const exploreFoodRoutes = require("./routes/exploreFood");
const communityPostRoutes = require("./routes/communityPost");
const otpRoutes = require("./routes/otp");
const rbacRoutes = require("./routes/rbacRoutes");

// =====================
// ⚙️ Basic App Setup
// =====================
app.set("trust proxy", 1); // Required for Railway or any reverse proxy
app.use("/api/rbac", rbacRoutes);

// =====================
// 🧩 SECURITY MIDDLEWARE STACK
// =====================

// 1️⃣ Helmet (Security headers)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://food-nutrition-hub.vercel.app",
        ],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://food-nutrition-hub.vercel.app",
        ],
        "connect-src": [
          "'self'",
          "https://food-nutrition-hub.vercel.app",
          "http://localhost:5173",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2️⃣ Prevent HTTP Parameter Pollution
app.use(hpp());

// 3️⃣ JSON Parser (must come before sanitizers)
app.use(express.json());

// 4️⃣ Sanitize user input (XSS protection)
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

// 5️⃣ Mongo-style injection prevention (no $ or . keys)
app.use((req, res, next) => {
  const sanitizeNoDollar = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else if (typeof obj[key] === "object") {
          sanitizeNoDollar(obj[key]);
        }
      }
    }
  };
  sanitizeNoDollar(req.body);
  sanitizeNoDollar(req.query);
  sanitizeNoDollar(req.params);
  next();
});

// 6️⃣ CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local frontend
      "https://food-nutrition-hub.vercel.app", // Production frontend
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token"],
  })
);

// =====================
// 🗄️ MYSQL + SESSION CONFIGURATION
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
  console.log("💻 Using ENV DB config");
} else {
  dbOptions = {
    host: "interchange.proxy.rlwy.net",
    port: 13361,
    user: "root",
    password: "GsdEstbgiDCzValxnvDLiDfoEdCPoWyh",
    database: "railway",
  };
  console.log("💻 Using FALLBACK Railway DB config");
}

const sessionStore = new MySQLStore(dbOptions);

// ✅ Handle DB connection errors gracefully
sessionStore.on("error", (err) => {
  console.error("❌ MySQL session store error:", err);
});

// ✅ Secure Session Middleware (with HTTPS check)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// =====================
// 🧩 CSRF PROTECTION
// =====================
const csrfProtection = csrf({ cookie: false }); // uses session instead of cookie
app.use(csrfProtection);

// ✅ Endpoint to provide CSRF token to frontend
app.get("/api/csrf-token", (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

// =====================
// 🚦 RATE LIMITER (Anti-brute-force)
// =====================
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP/email to 5 requests
  message: { error: "Too many attempts, please try again later." },
  keyGenerator: (req, res) => {
    const ipKey = ipKeyGenerator(req, res);
    const emailKey = req.body?.email || "guest";
    return `${ipKey}-${emailKey}`;
  },
});

// =====================
// 🧩 ROUTES
// =====================
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/exploreFood", exploreFoodRoutes);
app.use("/api/communityPost", communityPostRoutes);
app.use("/api/foods", foodRoutes);

// 🧩 Admin Example Endpoint
app.get("/api/admin/data", (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
});

// 🩺 Health Check Endpoint
app.get("/", (req, res) => {
  res
    .status(200)
    .type("text/plain")
    .send("🚀 Backend running with MySQL + sessions + CSRF protection!");
});

// =====================
// ⚠️ CSRF ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    console.warn("⚠️ Invalid or missing CSRF token");
    return res.status(403).json({
      success: false,
      error: "Invalid CSRF token",
      message: "Your session may have expired. Please refresh and try again.",
    });
  }
  next(err);
});

// =====================
// 🧩 CENTRALIZED ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// =====================
// 🚀 START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
