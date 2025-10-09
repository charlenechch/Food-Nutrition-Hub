const mysql = require("mysql2");
require("dotenv").config();

// ✅ Create a promise-based pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || "localhost",
  port: process.env.MYSQLPORT || 3306,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "fypdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise();

// ✅ Test connection once
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL pool is ready!");
  } catch (err) {
    console.error("❌ MySQL pool connection failed:", err.message);
  }
})();

// ✅ Keep-alive ping to prevent Railway idle disconnects
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("🔄 DB keep-alive ping");
  } catch (err) {
    console.error("⚠️ Keep-alive error:", err.message);
  }
}, 30000);

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







    
    




