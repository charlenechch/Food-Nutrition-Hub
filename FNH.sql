USE railway;

 CREATE TABLE user (
     userID INT AUTO_INCREMENT PRIMARY KEY,
     firstname VARCHAR(255) NOT NULL,
     lastname VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     verified ENUM ('True', 'False') DEFAULT 'False',
     role ENUM('admin', 'member') NOT NULL
);

 CREATE TABLE userProfile (
     userProfileID INT AUTO_INCREMENT PRIMARY KEY,
     userID INT NOT NULL,
     location VARCHAR(255) NULL,
     bio VARCHAR(255) NULL, 
     dietaryPreference VARCHAR(255) NOT NULL,
     allergies VARCHAR(255) NOT NULL,
     avatar TEXT NULL,
     emailNotifications BOOLEAN DEFAULT true,
     pushNotifications BOOLEAN DEFAULT true,
     profileVisibility BOOLEAN DEFAULT true,
     language VARCHAR(10) DEFAULT 'en',
     recipes INT DEFAULT 0,
     posts INT DEFAULT 0,
     likes INT DEFAULT 0,
     FOREIGN KEY (userID) REFERENCES user(userID) ON UPDATE CASCADE ON DELETE CASCADE
 );

 CREATE TABLE food (
     foodID INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(20) NOT NULL,
     origin ENUM('Malay','Chinese','Iban','Melanau','Kadazan', 'Bidayuh', 'Dayak') NOT NULL,
     category VARCHAR(100) NOT NULL,
     foodType VARCHAR(100) NOT NULL,
     difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
     dietaryTags VARCHAR(100) NOT NULL,
     description TEXT NOT NULL,
     image TEXT NOT NULL,
     prepTime INT NOT NULL,
     culturalSignificance TEXT NULL,
     traditionalPreparation TEXT NULL,
     commonIngredients VARCHAR(255) NULL,
     alternative VARCHAR(255) NULL,
     altDescription TEXT NULL,
     healthTips TEXT,
     Energy_kcal DECIMAL(6,2),
     Protein_g DECIMAL(6,2),
     Fat_g DECIMAL(6,2),
     Carbohydrates_g DECIMAL(6,2),
     Fiber_g DECIMAL(6,2),
     VitaminC_mg DECIMAL(6,2)
 );

 CREATE TABLE recipe (
     recipeID INT AUTO_INCREMENT PRIMARY KEY,
     foodID INT NOT NULL,
     userProfileID INT NOT NULL, 
     ingredients TEXT NOT NULL,
     steps TEXT NOT NULL,
     cookTime INT NULL,
     servings INT NOT NULL,
     DidYouKnow TEXT NULL,
     chefTips TEXT NULL,
     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     status ENUM('Approved', 'Pending', 'Rejected') DEFAULT 'Pending',
     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
 );


 CREATE TABLE posts (
     postID INT AUTO_INCREMENT PRIMARY KEY,
     foodName VARCHAR(100) NOT NULL,
     origin VARCHAR(100) NOT NULL,
     userProfileID INT NOT NULL,
     status ENUM ('Approved', 'Pending', 'Rejected') DEFAULT 'Pending',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     culturalStory TEXT NOT NULL,
     photos VARCHAR(255) NOT NULL,
     recipe TEXT NULL,
     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
 );

-- COMMUNITY POST PAGE COMMENTS
 CREATE TABLE comments (
     commentID INT AUTO_INCREMENT PRIMARY KEY,
     postID INT NOT NULL,
     userProfileID INT NOT NULL,
     comment TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (postID) REFERENCES posts(postID) ON UPDATE CASCADE ON DELETE CASCADE,
     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
 );

 CREATE TABLE likes (
     likeID INT AUTO_INCREMENT PRIMARY KEY,
     postID INT NOT NULL,
     userProfileID INT NOT NULL,
     FOREIGN KEY (postID) REFERENCES posts(postID) ON UPDATE CASCADE ON DELETE CASCADE,
     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
 );

 CREATE TABLE saveFood (
     saveID INT AUTO_INCREMENT PRIMARY KEY,
     foodID INT NULL,
     userProfileID INT NOT NULL,
     recipeID INT NULL,
     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
     FOREIGN KEY (recipeID) REFERENCES recipe(recipeID) ON UPDATE CASCADE ON DELETE CASCADE,
     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
 ); 

 FOOD DISCUSSION
 CREATE TABLE discussion (
 	discussionID INT AUTO_INCREMENT PRIMARY KEY,
     foodID INT NOT NULL,
     userProfileID INT NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     upVotes INT DEFAULT 0,
     downVotes INT DEFAULT 0,
     upvoted_by JSON NULL,
     FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
 ); 

 CREATE TABLE reply (
 	replyID INT AUTO_INCREMENT PRIMARY KEY,
     discussionID INT NOT NULL,
     userProfileID INT NOT NULL,
     reply TEXT NOT NULL,
     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (discussionID) REFERENCES discussion(discussionID) ON UPDATE CASCADE ON DELETE CASCADE,
     FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
 );






