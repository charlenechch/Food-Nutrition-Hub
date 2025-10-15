// // backend/server.js
// /* eslint-disable no-console */
// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const session = require("express-session");
// const helmet = require("helmet");
// const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
// const csrf = require("csurf");
// const MySQLStore = require("express-mysql-session")(session);
// require("dotenv").config();

// // 🧩 Security packages
// const hpp = require("hpp");
// const sanitizeHtml = require("sanitize-html");

// const app = express();
// const PORT = process.env.PORT || 5000;

// // =====================
// // 📦 Route Imports
// // =====================
// const loginRoutes = require("./routes/login");
// const logoutRoutes = require("./routes/logout");
// const registerRoutes = require("./routes/register");
// const authRoutes = require("./routes/auth");
// const foodRoutes = require("./routes/foods");
// const exploreFoodRoutes = require("./routes/exploreFood");
// const communityPostRoutes = require("./routes/communityPost");
// const otpRoutes = require("./routes/otp");
// const rbacRoutes = require("./routes/rbacRoutes");

// // ---------- 1) Proxy & security headers ----------
// app.set("trust proxy", 1); // behind Railway/Vercel proxy

// // =====================
// // 🧩 SECURITY MIDDLEWARE STACK
// // =====================

// // 1️⃣ Helmet (Security headers)
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       useDefaults: true,
//       directives: {
//         "default-src": ["'self'"],
//         "img-src": [
//           "'self'",
//           "data:",
//           "blob:",
//           "https://food-nutrition-hub.vercel.app",
//         ],
//         "script-src": [
//           "'self'",
//           "'unsafe-inline'",
//           "https://food-nutrition-hub.vercel.app",
//         ],
//         "connect-src": [
//           "'self'",
//           "https://food-nutrition-hub.vercel.app",
//           "http://localhost:5173",
//         ],
//       },
//     },
//     crossOriginEmbedderPolicy: false,
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   })
// );

// // 2️⃣ Prevent HTTP Parameter Pollution
// app.use(hpp());

// // 3️⃣ JSON Parser (must come before sanitizers)
// app.use(express.json());

// // 4️⃣ Sanitize user input (XSS protection)
// app.use((req, res, next) => {
//   const clean = (obj) => {
//     if (obj && typeof obj === "object") {
//       for (const key in obj) {
//         if (typeof obj[key] === "string") {
//           obj[key] = sanitizeHtml(obj[key], {
//             allowedTags: [],
//             allowedAttributes: {},
//           });
//         } else if (typeof obj[key] === "object") {
//           clean(obj[key]);
//         }
//       }
//     }
//   };
//   clean(req.body);
//   clean(req.query);
//   clean(req.params);
//   next();
// });

// // 5️⃣ Mongo-style injection prevention (no $ or . keys)
// app.use((req, res, next) => {
//   const sanitizeNoDollar = (obj) => {
//     if (obj && typeof obj === "object") {
//       for (const key in obj) {
//         if (key.startsWith("$") || key.includes(".")) {
//           delete obj[key];
//         } else if (typeof obj[key] === "object") {
//           sanitizeNoDollar(obj[key]);
//         }
//       }
//     }
//   };
//   sanitizeNoDollar(req.body);
//   sanitizeNoDollar(req.query);
//   sanitizeNoDollar(req.params);
//   next();
// });

// // 6️⃣ CORS Configuration
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173", // Local frontend
//       "https://food-nutrition-hub.vercel.app", // Production frontend
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token"],
//   })
// );

// // ---------- 3) Body parsers & HPP ----------
// app.use(express.json({ limit: "1mb" })); // small limit reduces DoS surface
// app.use(express.urlencoded({ extended: false, limit: "1mb" }));
// app.use(hpp()); // HTTP Parameter Pollution guard

// // ---------- 4) Sessions (MySQL store) ----------
// const dbOptions = {
//   host: process.env.MYSQLHOST || process.env.DB_HOST,
//   port: Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
//   user: process.env.MYSQLUSER || process.env.DB_USER,
//   password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
//   database: process.env.MYSQLDATABASE || process.env.DB_NAME,
//   clearExpired: true,
//   checkExpirationInterval: 15 * 60 * 1000, // cleanup every 15 min
//   expiration: 24 * 60 * 60 * 1000, // absolute 24h expiry
// };

// // ⚠️ Strongly recommended: remove any hard-coded DB fallbacks in production.
// const sessionStore = new MySQLStore(dbOptions);

// // ✅ Handle DB connection errors gracefully
// sessionStore.on("error", (err) => {
//   console.error("❌ MySQL session store error:", err);
// });

// // ✅ Secure Session Middleware (with HTTPS check)
// app.use(
//   session({
//     name: "sid",
//     secret: process.env.SESSION_SECRET || "change-me-in-.env",
//     store: sessionStore,
//     resave: false,
//     saveUninitialized: false, // don't create empty sessions
//     rolling: true, // refresh cookie on activity
//     cookie: {
//       httpOnly: true,
//       sameSite: "none", // cross-site with Vercel frontend
//       secure: true, // requires HTTPS + trust proxy
//       maxAge: 60 * 60 * 1000, // IDLE timeout: 1h (absolute 24h via store.expiration)
//     },
//   })
// );

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

// // ---------- 6) Rate limiting ----------
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 300, // generous global cap
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(globalLimiter);

// const authLimiter = rateLimit({
//   windowMs: 5 * 60 * 1000, // 5 minutes
//   max: 5, // Limit each IP/email to 5 requests
//   message: { error: "Too many attempts, please try again later." },
//   keyGenerator: (req, res) => {
//     const ipKey = ipKeyGenerator(req, res);
//     const emailKey = req.body?.email || "guest";
//     return `${ipKey}-${emailKey}`;
//   },
// });

// // =====================
// // 🧩 ROUTES
// // =====================
// app.use("/api/login", authLimiter, loginRoutes);
// app.use("/api/logout", logoutRoutes);
// app.use("/api/register", registerRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/otp", otpRoutes);
// app.use("/api/exploreFood", exploreFoodRoutes);
// app.use("/api/communityPost", communityPostRoutes);
// app.use("/api/foods", foodRoutes);

// // 🧩 Admin Example Endpoint
// app.get("/api/admin/data", (req, res) => {
//   if (!req.session?.user || req.session.user.role !== "admin") {
//     return res.status(403).json({ error: "Forbidden: Admins only" });
//   }
//   res.json({ secret: "This is admin-only data." });
// });

// // 🩺 Health Check Endpoint
// app.get("/", (req, res) => {
//   res
//     .status(200)
//     .type("text/plain")
//     .send("🚀 Backend running with MySQL + sessions + CSRF protection!");
// });

// // =====================
// // ⚠️ CSRF ERROR HANDLER
// // =====================
// app.use((err, req, res, next) => {
//   if (err.code === "EBADCSRFTOKEN") {
//     console.warn("⚠️ Invalid or missing CSRF token");
//     return res.status(403).json({
//       success: false,
//       error: "Invalid CSRF token",
//       message: "Your session may have expired. Please refresh and try again.",
//     });
//   }
//   next(err);
// });

// // =====================
// // 🧩 CENTRALIZED ERROR HANDLER
// // =====================
// app.use((err, req, res, next) => {
//   console.error("❌ Server error:", err.stack);
//   res.status(err.status || 500).json({
//     success: false,
//     error: "Internal Server Error",
//     message:
//       process.env.NODE_ENV === "development"
//         ? err.message
//         : "Something went wrong",
//   });
// });

// // =====================
// // 🚀 START SERVER
// // =====================
// app.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });


// backend/server.js
/* eslint-disable no-console */
require("dotenv").config();
const mysql = require('mysql2');

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const csrf = require("csurf");
const hpp = require("hpp");

const loginRoutes = require("./routes/login");
const logoutRoutes = require("./routes/logout");
const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/foods");
const exploreFoodRoutes = require("./routes/exploreFood");
const communityPostRoutes = require("./routes/communityPost");
const otpRoutes = require("./routes/otp");

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

// ---------- 2) Strict CORS (with credentials) ----------
const allowlist = [
  "http://localhost:5173",
  "https://food-nutrition-hub.vercel.app",
  process.env.FRONTEND_ORIGIN, // optional override
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow server-to-server / curl (no origin) and allowlisted sites
      if (!origin || allowlist.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
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
const sessionStore = new MySQLStore({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD, // From environment
  database: process.env.MYSQLDATABASE,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
});

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: IS_PROD,
      maxAge: 60 * 60 * 1000,
    },
  })
);

// Make db available to all routes
app.use((req, res, next) => {
  req.db = promiseDb;
  next();
});

// ---------- 5) CSRF for state-changing requests ----------
// const csrfProtection = csrf({ 
//   cookie: false // Use sessions instead of cookies
// });

// // Token endpoint for the SPA to fetch a token
// app.get("/api/auth/csrf-token", csrfProtection, (req, res) => {
//   res.json({ 
//     csrfToken: req.csrfToken(),
//     message: "CSRF token generated successfully"
//   });
// });

// // Apply CSRF to all non-GET requests
// app.use((req, res, next) => {
//   if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
//     return next();
//   }
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
  limit: 20,
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
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/exploreFood", exploreFoodRoutes);
app.use("/api/communityPost", communityPostRoutes);
app.use("/api/foods", foodRoutes); // admin routes under /api/foods

// Example admin guard (kept from your version)
app.get("/api/admin/data", (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  res.json({ secret: "This is admin-only data." });
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


/* I don’t know how many times this has happened already, but every time you guys update or change the code, 
it seriously affects my progress on the database integration.
Whenever I commit my code to GitHub and then pull the latest updates from your side, there will definitely be issues. My data can still be fetched from the backend, 
but it cannot be displayed on the webpage. 
I always have to spend a lot of time troubleshooting to find out why, and most of the time, it is because your updates introduce changes that break the integration.
I am the only one handling the integration between the frontend, backend, and database, while you guys have two members working on your part. 
Please understand that every time I fetch your updates, I end up spending hours fixing issues that should not happen.
I have already prepared dummy data that you can use for testing. Please make sure to test your code properly before pushing it to GitHub. 
If you need to add new features, please base your changes on my existing code foundation instead of rewriting or modifying it in ways that cause conflicts.
This is not the first time. It happens every time I pull the latest code, so please be more careful and considerate when making updates.
Also, since I am the one responsible for integrating the frontend, backend, and database, I need more time to make sure everything works smoothly. 
This might slightly delay your progress, but it is important to ensure the system runs correctly before adding further changes.*/