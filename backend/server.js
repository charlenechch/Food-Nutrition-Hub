// backend/server.js
/* eslint-disable no-console */
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const csrf = require("csurf");
const hpp = require("hpp");
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('💡 Please check your .env file or Railway environment variables');
  process.exit(1);
}

// ---------- Database Connection ----------
const dbConfig = {
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD, // From environment only!
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
  // Never log passwords!
});

const db = mysql.createPool(dbConfig);
const promiseDb = db.promise();

// Test database connection
promiseDb.execute('SELECT 1 as test')
  .then(([rows]) => {
    console.log('✅ Database connection test successful');
  })
  .catch(err => {
    console.error('❌ Database connection test failed:', err.message);
  });


// ---------- 1) Proxy & security headers ----------
app.set("trust proxy", 1); // behind Railway/Vercel proxy

// Helmet base (CSP + extra hardening)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // for dev tools/Vite iframes
  })
);

// Content Security Policy (tune if you add more domains)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'", // allow Vite dev inline in DEV
        "http://localhost:5173",
        "https://food-nutrition-hub.vercel.app",
        "https://food-nutrition-3iuim4cpf-fyp-group10-fnh.vercel.app"
      ],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": [
        "'self'",
        "http://localhost:5173",
        "https://food-nutrition-hub.vercel.app",
      ],
      "frame-ancestors": ["'none'"], // block clickjacking
    },
  })
);

// HSTS only when HTTPS is guaranteed (prod)
if (IS_PROD) {
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );
}

app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

// ---------- 2) CORS with credentials (for Railway + Vercel) ----------
const allowedOrigins = [
  "http://localhost:5173",
  "https://food-nutrition-hub.vercel.app",
  "https://food-nutrition-3iuim4cpf-fyp-group10-fnh.vercel.app"
];

app.use(
  cors({
    // Use the array directly. This is cleaner.
    origin: allowedOrigins, 
    credentials: true, // 🔥 Required for cookies/session to work
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    optionsSuccessStatus: 204,
  })
);

// ---------- 3) Body parsers & HPP ----------
app.use(express.json({ limit: "1mb" })); // small limit reduces DoS surface
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(hpp()); // HTTP Parameter Pollution guard

// ---------- 4) Sessions (MySQL store) ----------
const dbOptions = {
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000, // cleanup every 15 min
  expiration: 24 * 60 * 60 * 1000, // 24 hours
};

// Strongly recommended: remove any hard-coded DB fallbacks in production.
const sessionStore = new MySQLStore(dbOptions);

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change-me-in-.env",
    store: sessionStore,
    resave: false,
    saveUninitialized: false, // don't create empty sessions
    cookie: {
      httpOnly: true,
      sameSite: IS_PROD ? "none" : "lax", // "lax" for local testing
      secure: IS_PROD,  // (false in dev, true in production)
    },
  })
);

// // ---------- 5) CSRF for state-changing requests ----------
// const csrfProtection = csrf({ cookie: false }); // uses session

// // Token endpoint for the SPA to fetch a token and send it via X-CSRF-Token
// app.get("/api/auth/csrf-token", (req, res) => {
//   res.json({ csrfToken: req.csrfToken() });
// });

// // Apply CSRF ONLY to mutating methods to keep GET/OPTIONS simple
// app.use((req, res, next) => {
//   if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
//   return csrfProtection(req, res, next);
// });

// ---------- 6) Rate limiting ----------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300, // generous global cap
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

// ---------- 7) Routes ----------
app.use("/api/login", authLimiter, loginRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/register", authLimiter, registerRoutes);
app.use("/api/verifyEmail", verifyEmailRoute);
app.use("/api/resendVerification", resendVerificationRoute);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/exploreFood", exploreFoodRoutes);
app.use("/api/foodDetail", foodDetailRoutes);
app.use("/api/foodDiscussion", foodDiscussionRoutes);
app.use("/api/recipe", recipeRoutes);
app.use("/api/saveFood", saveFoodRoutes);
app.use("/api/communityPost", communityPostRoutes);
app.use("/api/foods", foodRoutes); 
app.use("/api/userProfile", userProfileRoutes);
app.use("/api/likes", likeRoutes);

// Example admin guard (kept from your version)
app.get("/api/admin/data", (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
});

// Session check endpoint
app.get("/api/auth/session", (req, res) => {
  console.log(" Session check requested");
  console.log(" Session ID:", req.sessionID);
  console.log(" Has session user:", !!req.session?.user);
  
  // Check if session exists and has user data
  if (req.session && req.session.user) {
    console.log("Valid session found for user:", req.session.user.email);
    
    return res.status(200).json({
      authenticated: true,
      user: {
        userID: req.session.user.userID,
        email: req.session.user.email,
        firstname: req.session.user.firstname,
        lastname: req.session.user.lastname,
        role: req.session.user.role
      }
    });
  } else {
    console.log("❌ No valid session found");
    
    return res.status(401).json({
      authenticated: false,
      message: "No active session"
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Backend running with advanced security, MySQL & sessions!");
});

// ---------- 8) 404 + Error handler ----------
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  // CSRF errors are common; return a clear message
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  console.error("❌ Server error:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message,
  });
});

// ---------- 9) Start server ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (mode: ${process.env.NODE_ENV || "dev"})`);
});
