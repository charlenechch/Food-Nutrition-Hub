/* eslint-disable no-console */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const csrf = require("csurf");
const mysql = require("mysql2");
const path = require("path");
const hppProtect = require("./middleware/hpp-protect");
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
const aiRoutes = require("./routes/ai");
const foodSearchRoutes = require("./routes/foodSearch");
const gptRoutes = require("./routes/gpt");
const exportRoutes = require("./routes/export");

// Admin
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

// ---------- Environment Validation ----------
const requiredEnvVars = ["MYSQLHOST", "MYSQLUSER", "MYSQLPASSWORD", "MYSQLDATABASE"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars);
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

console.log("🔧 Database Config:", {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
});

const db = mysql.createPool(dbConfig);
const promiseDb = db.promise();
app.set("dbPool", promiseDb);

promiseDb
  .execute("SELECT 1 as test")
  .then(() => console.log("✅ Database connection test successful"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

// ---------- Security & Proxy ----------
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

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
        process.env.INFERENCE_URL?.replace(/(https?:\/\/[^/]+).*/, "$1"),
      ],
      "frame-ancestors": ["'none'"],
    },
  })
);

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

// ---------- CORS ----------
// Even with Proxy, we keep this for safety
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL || "https://food-nutrition-hub.vercel.app"
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

// ---------- Body Parsers ----------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ---------- Rate Limiting ----------

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 30 * 1000, 
  limit: 5, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: "You are doing that too fast! Please wait 30 seconds and try again." 
  },
  keyGenerator: (req, res) => {
    const ipKey = ipKeyGenerator(req, res);
    const emailKey = req.body?.email || "guest";
    return `${ipKey}-${emailKey}`;
  },
});

// ---------- Sessions ----------
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

// ✅ CRITICAL IPHONE FIX HERE
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change-me",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true, 
    cookie: {
      httpOnly: true,
      // CHANGE: Use 'lax' instead of 'none'. 
      // Since we proxy via Vercel, the browser sees this as a First-Party cookie.
      // Safari trusts 'lax' cookies much more than 'none'.
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);

// CSRF PROTECTION
const csrfProtection = csrf();

const csrfExclude = [
  '/api/ai/gpt/nutrition',
  '/api/login',
  '/api/register',
  '/api/verifyEmail'
];

app.use((req, res, next) => {
  if (csrfExclude.some(p => req.originalUrl.startsWith(p))) {
    return next(); // Skip CSRF
  }
  return csrfProtection(req, res, next);
});

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ---------- Routes ----------

app.use(
  "/api/register",
  authLimiter,
  hppProtect({
    policy: "reject",
    allowlist: ["email", "password", "firstname", "lastname", "firebaseUID"],
  }),
  registerRoutes
);

app.use(
  "/api/login",
  authLimiter,
  hppProtect({
    policy: "reject",
    allowlist: ["email", "password", "rememberDevice"],
  }),
  loginRoutes
);

app.use(
  "/api/ai/gpt",
  cors({ origin: allowedOrigins, credentials: true }),
  gptRoutes
);

app.use(
  "/api/ai",
  cors({ origin: allowedOrigins, credentials: true }),
  aiRoutes
);

app.use(
  "/api/recipe",
  hppProtect({
    policy: "first",
    allowlist: [
      "includeAll", "status", "foodID", "name", "origin", "difficulty",
      "prepTime", "cookTime", "servings", "image", "description",
      "foodType", "dietaryTags", "ingredients", "instructions",
      "funFact", "chefTips", "id", "title", "foodName", "culturalOrigin", "culturalStory",
      "recipe", "content", "image", "userProfileID", "status", "comment", "feedback",
    ],
  }),
  recipeRoutes
);

app.use(
  "/api/foods",
  hppProtect({
    policy: "first",
    allowlist: [
      "name", "category", "culturalSignificance",
      "traditionalPreparation", "origin", "description",
      "image", "foodType", "dietaryTags", "ingredients",
      "Energy_kcal", "Protein_g", "Carbohydrates_g", "Fat_g", "Fiber_g", "VitaminC_mg",
      "difficulty", "prepTime", "commonIngredients", "alternative", "altDescription", "healthTips"
    ],
  }),
  foodRoutes
);

app.use("/api/export", 
  hppProtect({
    policy: "first",
    allowlist: [
      "format",    
      "year"       
    ]
  }),
  exportRoutes
);

app.use("/api/foodSearch", foodSearchRoutes);

app.use(
  hppProtect({
    policy: "first",
    allowlist: [
      "id", "page", "q", "sort", "email", "password", "newPassword", "userID", "code", "rememberDevice",
      "token", "role", "userProfileID", "firebase_uid", "bio", "location",
      "firstname", "lastname", "city", "suspendedUntil", "suspensionReason",
      "avatar", "allergies", "dietary", "emailNotifications", "prefs",
      "pushNotifications", "profileVisibility", "language", "recipes",
      "status", "stats", "saveFoods", "likes", "type", "postId", "postID",
      "content", "title", "culturalOrigin", "recipe", "reply", "comment", 
      "foodID", "likeID", "name", "difficulty", 
      "prepTime", "cookTime", "servings", "image", "description", 
      "foodType", "dietaryTags", "ingredients", "instructions", 
      "funFact", "chefTips", "category", 
      "isAdmin", "isAdminAction", "adminRole", "adminId", "includeAll",
      "view", "year", "feedback", "format"
    ],
    logger: (tag, meta) => {
      console.warn(`[${tag}]`, JSON.stringify(meta));
    },
  })
);

app.use("/api/logout", logoutRoutes);
app.use("/api/verifyEmail", verifyEmailRoute);
app.use("/api/resendVerification", resendVerificationRoute);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/exploreFood", hppProtect({ policy: "first", allowlist: ["q", "page", "sort"] }), exploreFoodRoutes);
app.use("/api/foodDetail", foodDetailRoutes);
app.use("/api/foodDiscussion", foodDiscussionRoutes);
app.use("/api/saveFood", saveFoodRoutes);
app.use("/api/communityPost", communityPostRoutes);
app.use("/api/userProfile", userProfileRoutes);
app.use("/api/likes", likeRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/api/auth/session", (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ authenticated: true, user: req.session.user });
  }
  return res.status(401).json({ authenticated: false, message: "No active session" });
});

app.get("/", (req, res) => {
  res.send("🚀 Backend running with advanced security, MySQL & sessions!");
});

app.use((req, res) => res.status(404).json({ error: "Not Found" }));

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    console.error("❌ BLOCKED BY CSRF!");
    console.error("   Reason: Session secret missing or token mismatch.");
    return res.status(403).json({ 
      error: "Invalid CSRF token", 
      debug: "Session cookie missing. Ensure your browser allows cookies from this domain." 
    });
  }

  console.error("❌ SERVER ERROR:", err);
  res.status(err.status || 500).json({ 
    error: err.message,
    code: err.code || "UNKNOWN_ERROR"
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (mode: ${process.env.NODE_ENV || "dev"})`);
});