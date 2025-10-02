const mysql = require('mysql2');
const express = require('express');
require('dotenv').config();

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', 
    database: 'fypdb',
    port: 3307  //mine is 3307, but most used is 3306
}); //make sure the setting here is match with ur own database connection

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('MySQL connected!');
});

module.exports = db;

const app = express();

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







    
    




