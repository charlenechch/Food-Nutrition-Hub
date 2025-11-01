// backend/config/db.js
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

let dbConfig;

// ✅ Priority loading: Railway → Custom DB → Local fallback
if (process.env.MYSQLHOST) {
  console.log("🌐 Using Railway DB config");
  dbConfig = {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
  };
} else if (process.env.DB_HOST) {
  console.log("💻 Using Local/Dev DB config");
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
} else {
  console.error("❌ No database configuration found!");
  console.error(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("DB") || key.includes("MYSQL"))
  );
  throw new Error("No database configuration available");
}

// ✅ Create a safe connection pool (auto-handles prepared statements)
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  multipleStatements: false, // 🚫 Prevent stacked queries (SQLi hardening)
});

// ✅ Connection test
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ MySQL connection test OK");
  } catch (err) {
    console.error("❌ MySQL connection test FAILED:", err.message);
  }
})();

//   🧱 SAFE QUERY HELPERS — Prevent SQL Injection

// ✅ Basic single-row query
async function one(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

// ✅ Multi-row query
async function many(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ✅ Utility for dynamic IN (...) placeholders
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
