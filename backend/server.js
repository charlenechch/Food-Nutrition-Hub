/* eslint-disable no-console */
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const csrf = require("csurf");
const mysql = require("mysql2");
const path = require("path");
const hppProtect = require("./middleware/hpp-protect"); // ✅ custom HPP middleware
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ---------- Routes ----------
const loginRoutes = require("./routes/login");
const logoutRoutes = require("./routes/logout");
const registerRoutes = require("./routes/register");
const verifyEmailRoute = require("./routes/verifyEmail");
const resendVerificationRoute = require("./routes/resendVerification");
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/foods");
const exploreFoodRoutes = require("./routes/exploreFood");
const foodDetailRoutes = require("./routes/foodDetail");
const foodDiscussionRoutes = require("./routes/foodDiscussion");
const recipeRoutes = require("./routes/recipe");
const communityPostRoutes = require("./routes/communityPost");
const saveFoodRoutes = require("./routes/saveFood");
const otpRoutes = require("./routes/otp");
const userProfileRoutes = require("./routes/userProfile");
const likeRoutes = require("./routes/likes");

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

// ---------- Environment Validation ----------
const requiredEnvVars = ['MYSQLHOST', 'MYSQLUSER', 'MYSQLPASSWORD', 'MYSQLDATABASE'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// ---------- Database Connection ----------
const dbConfig = {
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
});

const db = mysql.createPool(dbConfig);
const promiseDb = db.promise();

// Test DB connection
promiseDb.execute('SELECT 1 as test')
  .then(() => console.log('✅ Database connection test successful'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

// ---------- 1) Proxy & security headers ----------
app.set("trust proxy", 1); // behind Railway/Vercel

// Helmet base
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "http://localhost:5173",
        "https://food-nutrition-hub.vercel.app",
        "https://food-nutrition-3iuim4cpf-fyp-group10-fnh.vercel.app",
      ],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": [
        "'self'",
        "http://localhost:5173",
        "https://food-nutrition-hub.vercel.app",
      ],
      "frame-ancestors": ["'none'"],
    },
  })
);

// HSTS (only prod)
if (IS_PROD) {
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    })
  );
}

app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

// ---------- 2) CORS ----------
const allowedOrigins = [
  "http://localhost:5173",
  "https://food-nutrition-hub.vercel.app",
  "https://food-nutrition-3iuim4cpf-fyp-group10-fnh.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    optionsSuccessStatus: 204,
  })
);

// ---------- 3) Body parsers & Enhanced HPP ----------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ✅ Enhanced HPP protection
app.use(
  hppProtect({
    policy: "reject", // block duplicates globally
    allowlist: [
      "id",
      "page",
      "q",
      "sort",
      "email",
      "password",
      "userID",
      "token",
      "role",
    ],
    logger: (tag, meta) => {
      console.warn(`[${tag}]`, JSON.stringify(meta));
    },
  })
);

// ---------- 4) Sessions ----------
const dbOptions = {
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT) || 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
};

const sessionStore = new MySQLStore(dbOptions);

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change-me",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: IS_PROD ? "none" : "lax",
      secure: IS_PROD,
    },
  })
);

// ---------- 5) CSRF Protection ----------
const csrfProtection = csrf({ cookie: false });

// ✅ Route for frontend to fetch CSRF token
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  try {
    const token = req.csrfToken();
    console.log("🎟️ CSRF token generated:", token.substring(0, 10) + "...");
    res.json({ csrfToken: token });
  } catch (err) {
    console.error("⚠️ Failed to generate CSRF token:", err.message);
    res.status(500).json({ error: "CSRF token generation failed" });
  }
});

// ✅ Apply CSRF protection only for state-changing requests
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return csrfProtection(req, res, next);
});


// ---------- 6) Rate limiting ----------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, try again later." },
  keyGenerator: (req, res) => {
    const ipKey = ipKeyGenerator(req, res);
    const emailKey = req.body?.email || "guest";
    return `${ipKey}-${emailKey}`;
  },
});

// ---------- 7) Routes with per-route HPP overrides ----------
app.use("/api/login", authLimiter, hppProtect({ policy: "reject", allowlist: ["email", "password"] }), loginRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/register", authLimiter, hppProtect({ policy: "reject", allowlist: ["email", "password", "firstname", "lastname"] }), registerRoutes);
app.use("/api/verifyEmail", verifyEmailRoute);
app.use("/api/resendVerification", resendVerificationRoute);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

// For exploration routes, we can safely canonicalize duplicates
app.use("/api/exploreFood", hppProtect({ policy: "first", allowlist: ["q", "page", "sort"] }), exploreFoodRoutes);

app.use("/api/foodDetail", foodDetailRoutes);
app.use("/api/foodDiscussion", foodDiscussionRoutes);
app.use("/api/recipe", recipeRoutes);
app.use("/api/saveFood", saveFoodRoutes);
app.use("/api/communityPost", communityPostRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/userProfile", userProfileRoutes);
app.use("/api/likes", likeRoutes);

// ---------- Example Admin Guard ----------
app.get("/api/admin/data", (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
});

// ---------- Session check ----------
app.get("/api/auth/session", (req, res) => {
  console.log(" Session check requested");
  console.log(" Session ID:", req.sessionID);
  console.log(" Has session user:", !!req.session?.user);

  if (req.session && req.session.user) {
    console.log("Valid session for:", req.session.user.email);
    return res.status(200).json({
      authenticated: true,
      user: {
        userID: req.session.user.userID,
        email: req.session.user.email,
        firstname: req.session.user.firstname,
        lastname: req.session.user.lastname,
        role: req.session.user.role,
      },
    });
  } else {
    console.log("❌ No valid session");
    return res.status(401).json({
      authenticated: false,
      message: "No active session",
    });
  }
});

// ---------- Health check ----------
app.get("/", (req, res) => {
  res.send("🚀 Backend running with advanced security, MySQL & sessions!");
});

// ---------- 8) 404 + Error handler ----------
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  console.error("❌ Server error:", err);
  res.status(err.status || 500).json({
    error: err.status === 500 ? "Internal Server Error" : err.message,
  });
});

// ---------- 9) Start server ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (mode: ${process.env.NODE_ENV || "dev"})`);
});
