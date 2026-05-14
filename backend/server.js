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
const { requireConsent } = require("./middleware/auth");
const logger = require("./config/logger"); 
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
const notificationRoutes = require("./routes/notifications");
const translateRoutes = require("./routes/translation");
const mapRoutes = require("./routes/map");
const xpRoutes = require("./routes/xp");
const leaderboardRoutes = require("./routes/leaderboard");
const quizContentRoutes = require("./routes/quizContentroutes"); 

// Admin
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");
const { router: activityLogRoutes } = require("./routes/adminActivityLog");
const backupRoutes = require("./routes/backup");

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

// ---------- Environment Validation ----------
const requiredEnvVars = ["MYSQLHOST", "MYSQLUSER", "MYSQLPASSWORD", "MYSQLDATABASE"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  logger.error("❌ Missing required environment variables", { missing: missingEnvVars });
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

logger.info("🔧 Database Config details initialized", {
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
  .then(() => logger.info("✅ Database connection test successful"))
  .catch((err) => logger.error("❌ Database connection failed", { error: err.message }));

// ---------- Security & Proxy ----------
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    hidePoweredBy: true,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
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
        "https://sarawakeats.site",
        "https://www.sarawakeats.site",
      ],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": [
        "'self'",
        "http://localhost:5173",
        "https://food-nutrition-hub.vercel.app",
        "https://food-nutrition-hub-production.up.railway.app",
        "https://sarawakeats.site",
        "https://www.sarawakeats.site",
        "https://api.sarawakeats.site",
        "https://places.googleapis.com",
        "https://apis.google.com",
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
const allowedOrigins = [
  "http://localhost:5173",
  "https://sarawakeats.site",
  "https://www.sarawakeats.site",
  "https://food-nutrition-hub.vercel.app", 
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn("CORS Blocked Origin:", { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    optionsSuccessStatus: 204,
  })
);

// ---------- Body Parsers ----------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

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
  handler: (req, res, next, options) => {
    logger.warn("Auth Rate Limit Triggered", { ip: req.ip, email: req.body?.email });
    res.status(options.statusCode).send(options.message);
  }
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP attempts. Please request a new code."
  }
});

// ---------- Sessions ----------
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
}, db); 

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
      sameSite: IS_PROD ? "none" : "lax",
      secure: IS_PROD,
      domain: IS_PROD ? ".sarawakeats.site" : undefined,
      maxAge: null,
    }
  })
);

// ---------- CSRF PROTECTION ----------
const csrfProtection = csrf();
const csrfExclude = [
  '/api/ai/gpt/nutrition',
  '/api/nutrition/analyze-image',
  '/api/login',     
  '/api/register',
  '/api/otp/verifyLogin',
  '/api/translate',
  '/api/map',  
  '/api/search',
  '/api/auth/checkLoginMethod',
];

app.use((req, res, next) => {
  if (csrfExclude.some(p => req.originalUrl.startsWith(p))) {
    return next(); 
  }
  return csrfProtection(req, res, next);
});

app.get("/api/csrf-token", (req, res) => {
  // 1. Force a session property to exist so the cookie is generated
  if (!req.session.initialized) {
    req.session.initialized = true;
  }

  csrfProtection(req, res, () => {
    const token = req.csrfToken();
    // 2. CRITICAL: Save the session manually before sending the response
    req.session.save((err) => {
      if (err) {
        logger.error("Session save failed during CSRF fetch", err);
        return res.status(500).json({ error: "Session synchronization failed" });
      }
      res.json({ csrfToken: token });
    });
  });
});

// ---------- Routes BEFORE global HPP ----------
app.use("/api/register", authLimiter, hppProtect({ policy: "reject", allowlist: ["email", "password", "firstname", "lastname", "firebaseUID", "pdpaconsent", "tncconsent"], logger: (tag, meta) => logger.warn(`HPP Registration Blocked: ${tag}`, meta) }), registerRoutes);
app.use("/api/login", authLimiter, hppProtect({ policy: "reject", allowlist: ["email", "password", "rememberDevice"], logger: (tag, meta) => logger.warn(`HPP Login Blocked: ${tag}`, meta) }), loginRoutes);
app.use("/api/ai/gpt", cors({ origin: allowedOrigins, credentials: true }), gptRoutes);
app.use("/api/ai", cors({ origin: allowedOrigins, credentials: true }), aiRoutes);

app.use("/api/userProfile", requireConsent, hppProtect({ 
  policy: "none", 
  allowlist: [
    "dietary", "allergies", "emailNotifications", "pushNotifications", "profileVisibility", "language", 
    "location", "bio", "pdpaConsent", "tncConsent", "newLevel", "equippedBadge", "equippedContributorBadge", "badgeId",
    "score", "xpEarned", "isPerfect", "firstName", "lastName"
  ], 
  logger: (tag, meta) => logger.warn(`HPP UserProfile Parameter: ${tag}`, meta) 
}), userProfileRoutes);
app.use("/api/recipe", requireConsent, hppProtect({ policy: "first", allowlist: ["includeAll", "status", "foodID", "name", "origin", "difficulty", "prepTime", "cookTime", "servings", "image", "description", "category", "dietaryTags", "ingredients", "instructions", "funFact", "chefTips", "id", "title", "foodName", "culturalOrigin", "culturalStory", "recipe", "content", "image", "userProfileID", "status", "comment", "feedback", "steps", "DidYouKnow", "rating", "recipeName"], logger: (tag, meta) => logger.warn(`HPP Recipe Parameter: ${tag}`, meta) }), recipeRoutes);

app.use("/api/foods", hppProtect({ policy: "first", allowlist: ["name", "category", "culturalSignificance", "traditionalPreparation", "origin", "description", "image", "dietaryTags", "ingredients", "Energy_kcal", "Protein_g", "Carbohydrates_g", "Fat_g", "Fiber_g", "VitaminC_mg", "difficulty", "prepTime", "commonIngredients", "healthTips", "servings", "cookTime", "steps", "DidYouKnow", "chefTips", "foodItems", "recipeDescription", "foodDescription", "didYouKnow", "recipeId", "recipeName"], skipArrays: true, logger: (tag, meta) => logger.warn(`HPP Foods Parameter: ${tag}`, meta) }), foodRoutes);

app.use("/api/export", requireConsent, hppProtect({ policy: "none", allowlist: ["format", "year", "saveIds", "month", "custom", "startDate", "endDate", "dataTypes", "recipeIds", "postIds", "likedPostIds"], logger: (tag, meta) => logger.warn(`HPP Export Parameter: ${tag}`, meta) }), exportRoutes);
app.use("/api/foodSearch", foodSearchRoutes);

app.use("/api/translate", hppProtect({ 
  policy: "skip",   // or check what option your hpp-protect supports for skipping body
  allowlist: ["texts", "targetLang"],
  skipBody: true,   // skip HPP processing on body entirely
  logger: (tag, meta) => logger.warn(`HPP Translate: ${tag}`, meta) 
}), translateRoutes);

app.use("/api/quiz-content", hppProtect({ 
  policy: "none", 
  allowlist: ["foodID", "question", "options", "correctAnswer", "explanation", "questionID", "created_at", "linkedFoodName"], 
  skipArrays: true,
  logger: (tag, meta) => logger.warn(`HPP Quiz Content: ${tag}`, meta) 
}), quizContentRoutes);

// ---------- Global HPP for everything else ----------
app.use(hppProtect({ policy: "first", allowlist: ["id", "page", "q", "sort", "lat", "lng", "email", "password", "questionID", "newPassword", "userID", "code", "rememberDevice", "token", "role", "userProfileID", "firebase_uid", "googlePhotoUrl", "firebaseUID", "bio", "location", "firstname", "lastname", "city", "suspendedUntil", "suspensionReason", "avatar", "allergies", "dietary", "emailNotifications", "prefs", "pushNotifications", "profileVisibility", "language", "recipes", "status", "stats", "saveFoods", "likes", "type", "postId", "postID", "content", "title", "culturalOrigin", "recipe", "reply", "comment", "foodID", "likeID", "name", "difficulty", "prepTime", "cookTime", "servings", "image", "description", "dietaryTags", "ingredients", "instructions", "funFact", "chefTips", "category", "isAdmin", "isAdminAction", "adminRole", "adminId", "includeAll", "view", "year", "feedback", "format", "saveIds", "month", "pdpaConsent", "tncConsent", "userIds", "emails", "subject", "message", "sendEmail", "actionType", "search", "startDate", "endDate", "limit"], logger: (tag, meta) => { logger.warn(`[GLOBAL HPP] ${tag}`, meta); }, }));

// ---------- Other Routes ----------
app.use("/api/logout", logoutRoutes);
app.use("/api/verifyEmail", verifyEmailRoute);
app.use("/api/resendVerification", resendVerificationRoute);
app.use("/api/auth", authRoutes);
app.use("/api/otp/verifyLogin", otpLimiter);
app.use("/api/otp", otpRoutes);
app.use("/api/exploreFood", hppProtect({ policy: "first", allowlist: ["q", "page", "sort"] }), exploreFoodRoutes);
app.use("/api/foodDetail", foodDetailRoutes);
app.use("/api/foodDiscussion", requireConsent, foodDiscussionRoutes);
app.use("/api/saveFood", requireConsent, saveFoodRoutes);
app.use("/api/communityPost", requireConsent, communityPostRoutes);
app.use("/api/likes", requireConsent, likeRoutes);
app.use("/api/admin/announcement", hppProtect({ policy: "none", allowlist: ["userIds", "emails", "subject", "message", "sendEmail"], logger: (tag, meta) => logger.warn(`HPP Announcement: ${tag}`, meta) }));
app.use("/api/admin/activityLog", hppProtect({ policy: "first", allowlist: ["actionType", "startDate", "endDate", "search", "page"], logger: (tag, meta) => logger.warn(`HPP Activity Log: ${tag}`, meta) }), activityLogRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", requireConsent, notificationRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/xp", requireConsent, xpRoutes);
app.use("/api/leaderboard", requireConsent, leaderboardRoutes);
app.use("/api/backup", backupRoutes);

// ---------- Static Files ----------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
  res.send("🚀 Backend running with advanced security, MySQL & sessions!");
});

// ---------- 404 + Error Handler ----------
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    logger.warn("CSRF Attack Blocked", { ip: req.ip, path: req.originalUrl });
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  logger.error("Internal Server Error", { message: err.message, stack: err.stack, path: req.path, method: req.method });
  res.status(err.status || 500).json({ error: "An unexpected error occurred." });
});

app.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT}`, { mode: process.env.NODE_ENV || "dev" });
});