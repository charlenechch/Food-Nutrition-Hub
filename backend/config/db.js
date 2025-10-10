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
    host: "localhost",
    port: 3306, // change to 3307 if needed
    user: "root",
    password: "",
    database: "fypdb",
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




// open MySQL workbench, copy paste the tables below

// -- CREATE DATABASE IF NOT EXISTS fypdb;
// -- USE fypdb;

// -- DROP DATABASE IF EXISTS fypdb;

// -- CREATE TABLE user (
// --     userID INT AUTO_INCREMENT PRIMARY KEY,
// --     firstname VARCHAR(255) NOT NULL,
// --     lastname VARCHAR(255) NOT NULL,
// --     email VARCHAR(255) UNIQUE NOT NULL,
// --     password VARCHAR(255) NOT NULL,
// --     role ENUM('admin', 'member') NOT NULL
// -- );

// -- CREATE TABLE userProfile (
// --     userProfileID INT AUTO_INCREMENT PRIMARY KEY,
// --     userID INT NOT NULL,
// -- 	   preference VARCHAR(255) NOT NULL,
// --     dietaryHabits VARCHAR(255) NOT NULL,
// --     allergy VARCHAR(255) NOT NULL,
// --     FOREIGN KEY (userID) REFERENCES user(userID) ON UPDATE CASCADE ON DELETE CASCADE
// -- );

// -- CREATE TABLE food (
// --     foodID INT AUTO_INCREMENT PRIMARY KEY,
// --     name VARCHAR(20) NOT NULL,
// --     origin ENUM('Malay','Chinese','Iban','Melanau','Kadazan', 'Bidayuh', 'Dayak') NOT NULL,
// --     Energy_kcal DECIMAL(6,2),
// --     Protein_g DECIMAL(6,2),
// --     Fat_g DECIMAL(6,2),
// --     Carbohydrates_g DECIMAL(6,2),
// --     Fiber_g DECIMAL(6,2),
// --     VitaminC_mg DECIMAL(6,2)
// -- );

// -- CREATE TABLE recipe (
// --     recipeID INT AUTO_INCREMENT PRIMARY KEY,
// --     foodID INT NOT NULL,
// --     description  TEXT,
// --     ingredients TEXT,
// --     steps TEXT,
// --     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE
// -- );

// -- CREATE TABLE recipe_images (
// --     imageID INT AUTO_INCREMENT PRIMARY KEY,
// --     recipeID INT NOT NULL,
// --     imageURL VARCHAR(255) NOT NULL,
// --     FOREIGN KEY (recipeID) REFERENCES recipe(recipeID) ON DELETE CASCADE
// -- );

// -- CREATE TABLE liked (
// --     likedID INT AUTO_INCREMENT PRIMARY KEY,
// --     foodID INT NOT NULL,
// --     userProfileID INT NOT NULL,
// --     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
// --     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
// -- );

// -- CREATE TABLE saved (
// --     saveID INT AUTO_INCREMENT PRIMARY KEY,
// --     foodID INT NOT NULL,
// --     userProfileID INT NOT NULL,
// --     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
// --     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
// -- );

// -- CREATE TABLE comment (
// --     commentID INT AUTO_INCREMENT PRIMARY KEY,
// --     foodID INT NOT NULL,
// --     userProfileID INT NOT NULL,
// --     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
// --     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
// -- );

// -- CREATE TABLE posted (
// --     postedID INT AUTO_INCREMENT PRIMARY KEY,
// --     foodID INT NOT NULL,
// --     recipeID INT NOT NULL,
// --     userProfileID INT NOT NULL,
// --     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
// --     FOREIGN KEY (recipeID) REFERENCES recipe(recipeID) ON UPDATE CASCADE ON DELETE CASCADE,	
// --     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
// -- );

// -- USE fypdb;
// -- SELECT * FROM recipe;







    
    




