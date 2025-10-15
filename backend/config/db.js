// backend/config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

let dbConfig;

// Priority: Railway env vars -> Traditional DB vars -> Fallback local
if (process.env.MYSQLHOST) {
  console.log("🌐 Using Railway DB config");
  dbConfig = {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  };
} else if (process.env.DB_HOST) {
  console.log("💻 Using DB config from environment");
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  };
} else {
  console.log("❌ No database configuration found!");
  console.log("Available environment variables:", Object.keys(process.env).filter(key => 
    key.includes('DB') || key.includes('MYSQL')
  ));
  throw new Error("No database configuration available");
}

console.log("🔧 Database Config:", {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Create pool - THIS WAS COMMENTED OUT!
const pool = mysql.createPool(dbConfig);

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL connection test OK");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL connection test FAILED:", err.message);
    console.error("Full error details:", err);
  }
})();

module.exports = pool;