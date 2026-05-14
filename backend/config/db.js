// backend/config/db.js
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

let dbConfig;

// ✅ Priority loading: DB_ (standard Railway/local) → MYSQL_ (fallback) → Error
if (process.env.DB_HOST) {
  console.log("🌐 Using Standard DB config (Railway/Prod)");
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
} else if (process.env.MYSQLHOST) {
  console.log("💻 Using Fallback Railway/Local DB config");
  dbConfig = {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
  };
} else {
  console.error("❌ No database configuration found!");
  console.error(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("DB") || key.includes("MYSQL"))
  );
  throw new Error("No database configuration available");
}

// ✅ Create a secure connection pool (handles concurrency + timeouts)
const pool = mysql.createPool({
  ...dbConfig,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  // acquireTimeout: 60000
  timeout: 60000,
  multipleStatements: false, // 🚫 Prevent stacked queries (SQL injection hardening)
});

// ✅ Connection test & live verification
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ MySQL connection test OK");

    // 🧠 Log actual DB info
    const [rows] = await pool.query("SELECT DATABASE() AS db, @@hostname AS host;");
    console.log("✅ Connected to DB successfully");
  } catch (err) {
    console.error("❌ MySQL connection test FAILED:", err.message);
  }
})();

// 🧱 SAFE QUERY HELPERS — prevent SQL injection and keep code DRY

// ✅ Query that returns only one row
async function one(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

// ✅ Query that returns multiple rows
async function many(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ✅ Dynamic placeholders for IN (...)
function placeholders(n) {
  if (!Number.isInteger(n) || n <= 0) throw new Error("Invalid placeholder count");
  return Array(n).fill("?").join(",");
}

// ✅ ORDER BY whitelist helper
function orderBy({ sortBy, sortDir, allow = [] }) {
  const column = allow.includes(sortBy) ? sortBy : allow[0];
  const direction = sortDir && sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";
  return { column, direction };
}

// ✅ Safe LIKE search builder
function like(searchTerm) {
  if (!searchTerm || typeof searchTerm !== "string") return "%";
  return `%${searchTerm.trim()}%`;
}

module.exports = {
  pool,
  one,
  many,
  placeholders,
  orderBy,
  like,
};
