USE railway;

CREATE TABLE sessions (
    session_id varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    expires int unsigned NOT NULL,
    data mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
) 

CREATE TABLE otp (
    id int NOT NULL AUTO_INCREMENT,
    userID int NOT NULL,
    code varchar(6) NOT NULL,
    expires_at datetime NOT NULL,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY userID (userID),
    FOREIGN KEY (userID) REFERENCES user (userID) ON DELETE CASCADE
) 

CREATE TABLE user (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    verified ENUM ('True', 'False') DEFAULT 'False',
    role ENUM('admin', 'member') NOT NULL,
    firebase_uid VARCHAR(128) DEFAULT NULL,
	lastLogin DATETIME DEFAULT NULL,
	status ENUM('Active','Inactive','Suspended') NOT NULL DEFAULT 'Active',
	suspendedUntil DATE DEFAULT NULL,
    failed_attempts INT DEFAULT 0,
	lockout_until DATETIME DEFAULT NULL,
	UNIQUE KEY firebase_uid (firebase_uid),
    pdpa_consent TINYINT(1) DEFAULT 0,
    tnc_consent TINYINT(1) DEFAULT 0,
    agreed_version INT DEFAULT 0
);

CREATE TABLE userProfile (
    userProfileID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL UNIQUE,
    location VARCHAR(255) NULL,
    bio VARCHAR(255) NULL, 
    dietaryPreference VARCHAR(255) NOT NULL,
    allergies VARCHAR(255) NOT NULL,
    avatar TEXT NULL,
    emailNotifications TINYINT(1) DEFAULT '1',
    pushNotifications TINYINT(1) DEFAULT '1',
    profileVisibility TINYINT(1) DEFAULT '1',
    language VARCHAR(10) DEFAULT 'en',
    recipes INT DEFAULT 0,
    posts INT DEFAULT 0,
    likes INT DEFAULT 0,
    totalSubmissions int DEFAULT '0',
    KEY fk_userProfile_user_restrict (userID),
	CONSTRAINT fk_userProfile_user_restrict FOREIGN KEY (userID) REFERENCES user (userID) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE food (
    foodID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    origin ENUM('Malay','Chinese','Iban','Melanau','Kadazan', 'Bidayuh', 'Dayak') NOT NULL,
    category VARCHAR(100) NOT NULL,
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
    VitaminC_mg DECIMAL(6,2),
	likes_count INT DEFAULT 0,
    liked_by JSON NULL
);

CREATE TABLE recipe (
    recipeID INT AUTO_INCREMENT PRIMARY KEY,
    foodID INT NOT NULL,
    userProfileID INT NOT NULL, 
    description TEXT, 
    ingredients TEXT NOT NULL,
    steps TEXT NOT NULL,
    cookTime INT NULL,
    servings INT NOT NULL,
    DidYouKnow TEXT NULL,
    chefTips TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    admin_feedback TEXT NULL,
    status ENUM('Approved', 'Pending', 'Rejected') DEFAULT 'Pending',
    publish ENUM('waiting', 'publish') DEFAULT 'waiting';
    FOREIGN KEY (foodID) REFERENCES food(foodID) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (userProfileID) REFERENCES userProfile(userProfileID) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE posts (
    postID INT AUTO_INCREMENT PRIMARY KEY,
    foodName VARCHAR(100) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    userProfileID INT NOT NULL,
    status ENUM ('Approved', 'Pending', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    culturalStory TEXT NOT NULL,
    photos TEXT NOT NULL,
    recipe TEXT NULL,
    admin_feedback TEXT NULL,
	FOREIGN KEY (userProfileID) REFERENCES userProfile (userProfileID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- COMMUNITY POST PAGE COMMENTS
CREATE TABLE comments (
    commentID INT AUTO_INCREMENT PRIMARY KEY,
    postID INT DEFAULT NULL,
    userProfileID INT DEFAULT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (postID) REFERENCES posts (postID) ON DELETE SET NULL,
	FOREIGN KEY (userProfileID) REFERENCES userProfile (userProfileID) ON DELETE SET NULL
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

-- FOOD DISCUSSION
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

CREATE TABLE restaurants (
    restaurantID INT PRIMARY KEY AUTO_INCREMENT,
    foodID INT,
    name VARCHAR(255),
    city VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    rating DECIMAL(3,2),
    address VARCHAR(255),
    description TEXT,
    opening_hours VARCHAR(100),
    is_halal BOOLEAN,
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    FOREIGN KEY (foodID) REFERENCES food(foodID)
);

CREATE TABLE notifications (
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES user(userID) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE adminActivityLog (
    logID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    adminName VARCHAR(100) NOT NULL,
    actionType ENUM(
        'user_created', 'user_updated', 'user_suspended', 'user_unsuspended', 'user_deleted',
        'food_created', 'food_updated', 'food_deleted',
        'post_approved', 'post_rejected',
        'recipe_approved', 'recipe_rejected',
        'announcement_sent', 'logs_cleared'
    ) NOT NULL,
    description TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY userID (userID),
    FOREIGN KEY (userID) REFERENCES user (userID) ON DELETE CASCADE
);

CREATE TABLE xp_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userProfileID INT NOT NULL,
    action_type VARCHAR(50) NOT NULL, 
    reference_id INT, 
    xp_awarded INT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_xp_userProfile FOREIGN KEY (userProfileID) 
        REFERENCES userProfile(userProfileID) ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE userProfile ADD COLUMN total_xp INT DEFAULT 0;