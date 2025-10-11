// backend/config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

let dbConfig;

if (process.env.MYSQLHOST || process.env.DB_HOST) {
  console.log("🌐 Using Railway DB config");
  dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
} else {
  console.log("💻 Using LOCAL DB config");
  dbConfig = {
    host: "interchange.proxy.rlwy.net",
    port: 13361, 
    user: "root",
    password: "GsdEstbgiDCzValxnvDLiDfoEdCPoWyh",
    database: "railway",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(dbConfig);

// ✅ Quick test
(async () => {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("✅ MySQL connection test OK");
  } catch (err) {
    console.error("❌ MySQL connection test FAILED:", err.message);
  }
})();

module.exports = pool;






    
    




