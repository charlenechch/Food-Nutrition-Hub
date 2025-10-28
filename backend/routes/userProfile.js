const express = require("express");
const router = express.Router();
const db = require("../config/db");
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const admin = require("firebase-admin");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("🔧 Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
});

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF, WebP)'));
  }
});

console.log("🔧 Multer configured");

// Cloudinary upload function
const uploadToCloudinary = (buffer, folder = 'avatars') => {
  return new Promise((resolve, reject) => {
    console.log(`☁️ Starting Cloudinary upload to folder: ${folder}`);
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `recipe-app/${folder}`,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
          { format: 'webp' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload successful:', result.secure_url);
          resolve(result);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
};

// Cloudinary delete function
const deleteFromCloudinary = async (publicId) => {
  try {
    console.log(`☁️ Deleting from Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Cloudinary delete successful');
    return result;
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to ensure userProfile exists
const ensureUserProfileExists = async (userID) => {
  try {
    console.log(`🔍 Checking if userProfile exists for user: ${userID}`);
    
    // Check if userProfile exists
    const [existingProfile] = await db.execute(
      `SELECT userProfileID FROM userProfile WHERE userID = ?`,
      [userID]
    );

    console.log(`📊 UserProfile check result:`, existingProfile);

    if (existingProfile.length === 0) {
      // Create new profile with default values
      console.log(`🆕 Creating new userProfile for user: ${userID}`);
      const [result] = await db.execute(
        `INSERT INTO userProfile 
         (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language) 
         VALUES (?, '[]', '[]', true, true, true, 'en')`,
        [userID]
      );
      console.log(`✅ Created userProfile with ID: ${result.insertId}`);
      return false; // Profile was created
    }
    console.log(`✅ UserProfile already exists for user: ${userID}`);
    return true; // Profile already existed
  } catch (error) {
    console.error('❌ Error ensuring userProfile exists:', error);
    throw error;
  }
};

// Helper function to update user stats in userProfile table
const updateUserStats = async (userID) => {
  try {
    console.log(`📈 Starting stats update for user: ${userID}`);
    
    // First ensure profile exists
    await ensureUserProfileExists(userID);

    // Count recipes created by user (from recipe table)
    console.log(`🍳 Counting recipes for user: ${userID}`);
    const [recipeCount] = await db.execute(
      `SELECT COUNT(*) as count FROM recipe WHERE userProfileID = ? AND status = 'Approved'`,
      [userID]
    );

    // Count posts created by user (from posts table)
    console.log(`📝 Counting posts for user: ${userID}`);
    const [postCount] = await db.execute(
      `SELECT COUNT(*) as count FROM posts WHERE userProfileID = ? AND status = 'Approved'`, 
      [userID]
    );

    // Count likes received by user (from likes table)
    console.log(`❤️ Counting likes for user: ${userID}`);
    const [likeCount] = await db.execute(
      `SELECT COUNT(*) as count FROM likes WHERE userProfileID = ?`, 
      [userID]
    );

    const recipesCount = recipeCount[0]?.count || 0;
    const postsCount = postCount[0]?.count || 0;
    const likesCount = likeCount[0]?.count || 0;

    console.log(`📊 Stats calculated - Recipes: ${recipesCount}, Posts: ${postsCount}, Likes: ${likesCount}`);

    // Update userProfile table with the counts
    console.log(`💾 Updating userProfile stats in database`);
    const [updateResult] = await db.execute(
      `UPDATE userProfile 
       SET recipes = ?, posts = ?, likes = ?
       WHERE userID = ?`,
      [recipesCount, postsCount, likesCount, userID]
    );

    console.log(`✅ Stats update completed, rows affected: ${updateResult.affectedRows}`);

    return {
      recipes: recipesCount,
      posts: postsCount,
      likes: likesCount
    };
  } catch (error) {
    console.error('❌ Error updating user stats:', error);
    console.error('❌ Error stack:', error.stack);
    return { recipes: 0, posts: 0, likes: 0 };
  }
};

// Helper function to delete user account (used by both user and admin)
async function deleteUser(userID, firebaseUID) {
  console.log(`Starting deletion process for user: ${userID}, Firebase UID: ${firebaseUID}`);

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log("Transaction started");

    // Delete avatar from Cloudinary if exists
    console.log("Checking for avatar to delete from Cloudinary...");
    const [avatarCheck] = await connection.query(
      'SELECT avatar FROM userProfile WHERE userID = ?',
      [userID]
    );

    if (avatarCheck.length > 0 && avatarCheck[0].avatar) {
      try {
        const avatarUrl = avatarCheck[0].avatar;
        console.log(`Found avatar: ${avatarUrl}`);
        const urlParts = avatarUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        const fullPublicId = `recipe-app/avatars/${publicId}`;
        console.log(`Deleting avatar with publicId: ${fullPublicId}`);
        await deleteFromCloudinary(fullPublicId);
        console.log("Avatar deleted from Cloudinary");
      } catch (cloudinaryError) {
        console.error("Error deleting avatar from Cloudinary (continuing):", cloudinaryError);
      }
    }

    // Delete from related tables
    console.log("Deleting user's likes...");
    await connection.query('DELETE FROM likes WHERE userProfileID = ?', [userID]);
    console.log("Deleted likes");

    console.log("Deleting user's posts...");
    await connection.query('DELETE FROM posts WHERE userProfileID = ?', [userID]);
    console.log("Deleted posts");

    console.log("Deleting user's recipes...");
    await connection.query('DELETE FROM recipe WHERE userProfileID = ?', [userID]);
    console.log("Deleted recipes");

    console.log("Deleting user profile...");
    await connection.query('DELETE FROM userProfile WHERE userID = ?', [userID]);
    console.log("Deleted userProfile");

    console.log("Deleting user record...");
    await connection.query('DELETE FROM user WHERE userID = ?', [userID]);
    console.log("Deleted user record from MySQL");

    // Delete from Firebase Authentication
    if (firebaseUID) {
      try {
        await admin.auth().deleteUser(firebaseUID);
        console.log("Deleted user from Firebase Authentication");
      } catch (firebaseError) {
        await connection.rollback();
        console.error("Firebase deletion failed:", firebaseError);
        throw new Error(`Failed to delete Firebase account: ${firebaseError.message}`);
      }
    } else {
      console.log("No Firebase UID found, skipping Firebase deletion");
    }

    // Commit the transaction
    await connection.commit();
    console.log("Transaction committed successfully");

    return {
      success: true,
      message: "Account deleted successfully from both Firebase and database"
    };

  } catch (error) {
    await connection.rollback();
    console.error("Transaction error during deletion:", error);
    throw error;
  } finally {
    connection.release();
    console.log("Database connection released");
  }
}

// Upload avatar to Cloudinary
router.put("/avatar", upload.single('avatar'), async (req, res) => {
  console.log("🖼️ Avatar upload request received");
  try {
    console.log("🔐 Checking session...");
    console.log("Session data:", req.session);
    console.log("Session user:", req.session?.user);
    
    if (!req.session || !req.session.user) {
      console.log("❌ No session or user found");
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📁 File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const userID = req.session.user.userID;
    console.log(`👤 Processing avatar for user: ${userID}`);

    // Ensure userProfile exists first
    await ensureUserProfileExists(userID);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'avatars');

    // Check if user already has an avatar to delete the old one
    console.log(`🔍 Checking for existing avatar...`);
    const [existingProfile] = await db.execute(
      `SELECT avatar FROM userProfile WHERE userID = ?`,
      [userID]
    );

    // Delete old avatar from Cloudinary if exists
    if (existingProfile.length > 0 && existingProfile[0].avatar) {
      try {
        const oldAvatarUrl = existingProfile[0].avatar;
        console.log(`🗑️ Found old avatar: ${oldAvatarUrl}`);
        // Extract public_id from Cloudinary URL
        const urlParts = oldAvatarUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        const fullPublicId = `recipe-app/avatars/${publicId}`;
        console.log(`🗑️ Deleting old avatar with publicId: ${fullPublicId}`);
        await deleteFromCloudinary(fullPublicId);
      } catch (deleteError) {
        console.error('⚠️ Error deleting old avatar (continuing):', deleteError);
        // Continue even if deletion fails
      }
    }

    // Update profile avatar
    console.log(`💾 Saving new avatar to database`);
    await db.execute(
      `UPDATE userProfile SET avatar = ? WHERE userID = ?`,
      [result.secure_url, userID]
    );

    // Update user stats
    await updateUserStats(userID);

    console.log("✅ Avatar upload completed successfully");
    res.json({ 
      success: true, 
      message: "Avatar uploaded successfully",
      avatar: result.secure_url,
      publicId: result.public_id
    });

  } catch (err) {
    console.error("❌ Error uploading avatar:", err);
    console.error("❌ Error stack:", err.stack);
    
    if (err.message.includes('image files')) {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: "Server error during upload: " + err.message });
  }
});

// ✅ Get own profile (/api/userProfile)
router.get("/", async (req, res) => {
  console.log("👤 GET profile request received");
  try {
    console.log("🔐 Checking session...");
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    console.log("Session user:", req.session?.user);
    
    // ✅ If user is guest or not logged in → Return guest JSON but do NOT destroy session
    if (!req.session || !req.session.user) {
      console.log("❌ No session or user found - returning guest response");
      return res.status(401).json({
        success: false,
        guest: true,
        message: "Guest access - please login to view profile",
      });
    }

    const userID = req.session.user.userID;
    console.log(`🔍 Fetching profile for user: ${userID}`);
    
    // Ensure userProfile exists first
    console.log(`🛠️ Ensuring userProfile exists...`);
    await ensureUserProfileExists(userID);
    
    // Update user stats
    console.log(`📈 Updating user stats...`);
    const freshStats = await updateUserStats(userID);

    console.log(`📊 Executing profile query for user: ${userID}`);
    const [rows] = await db.execute(
      `SELECT
        u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
        up.userProfileID, up.location, up.bio, up.avatar,
        up.dietaryPreference AS dietary, up.allergies,
        up.emailNotifications, up.pushNotifications, up.profileVisibility, up.language,
        up.recipes, up.posts, up.likes
      FROM user u
      LEFT JOIN userProfile up ON up.userID = u.userID
      WHERE u.userID = ?`,
      [userID]
    );

    console.log(`📄 Query returned ${rows.length} rows`);

    if (!rows.length) {
      console.log("❌ No profile found in database");
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = rows[0];
    console.log("✅ Profile found:", {
      userID: profile.userID,
      firstName: profile.firstName,
      lastName: profile.lastName,
      hasUserProfile: !!profile.userProfileID,
      avatar: profile.avatar ? "✅ Set" : "❌ Not set"
    });
    
    // If no profile data exists in userProfile, create default response
    const response = {
      ...profile,
      stats: {
        recipes: freshStats.recipes || 0,
        posts: freshStats.posts || 0,
        likes: freshStats.likes || 0,
      },
      prefs: {
        dietary: profile.dietary ? JSON.parse(profile.dietary || "[]") : [],
        allergies: profile.allergies ? JSON.parse(profile.allergies || "[]") : [],
        emailNotifications: profile.emailNotifications ?? true,
        pushNotifications: profile.pushNotifications ?? true,
        profileVisibility: profile.profileVisibility ?? true,
        language: profile.language || "en",
      },
    };

    console.log("📤 Sending profile response");
    res.json(response);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Update user profile
router.put("/update", async (req, res) => {
  console.log("✏️ Profile update request received");
  try {
    console.log("🔐 Checking session...");
    console.log("Session user:", req.session?.user);
    
    if (!req.session || !req.session.user) {
      console.log("❌ No session or user found");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userID = req.session.user.userID;
    const updateData = req.body;
    console.log(`👤 Updating profile for user: ${userID}`);
    console.log(`📝 Update data:`, updateData);

    // Ensure userProfile exists first
    await ensureUserProfileExists(userID);

    const { location, bio, dietary, allergies, emailNotifications, pushNotifications, profileVisibility, language } = req.body;

    // Update the profile
    console.log(`💾 Executing profile update query`);
    const [result] = await db.execute(
      `UPDATE userProfile 
       SET location = ?, bio = ?, dietaryPreference = ?, allergies = ?,
           emailNotifications = ?, pushNotifications = ?, profileVisibility = ?, language = ?
       WHERE userID = ?`,
      [
        location || null,
        bio || null,
        dietary ? JSON.stringify(dietary) : '[]',
        allergies ? JSON.stringify(allergies) : '[]',
        emailNotifications !== undefined ? emailNotifications : true,
        pushNotifications !== undefined ? pushNotifications : true,
        profileVisibility !== undefined ? profileVisibility : true,
        language || 'en',
        userID
      ]
    );

    console.log(`✅ Profile update completed, rows affected: ${result.affectedRows}`);

    // Update user stats
    await updateUserStats(userID);

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// View other user's profile (/api/userProfile/:id) [admin]
router.get("/:identifier", async (req, res) => {
  console.log("👥 Other user profile request received");
  try {
    const identifier = req.params.identifier;
    console.log(`🔍 Fetching profile for identifier: ${identifier}`);
    
    console.log(`📊 Executing profile query`);
    const [rows] = await db.execute(
      `SELECT 
        u.userID, u.firstname AS firstName, u.lastname AS lastName, u.email, u.role,
        up.userProfileID, up.location, up.bio, up.avatar,
        up.dietaryPreference AS dietary, up.allergies,
        up.emailNotifications, up.pushNotifications, up.profileVisibility, up.language,
        up.recipes, up.posts, up.likes
      FROM user u
      LEFT JOIN userProfile up ON up.userID = u.userID
      WHERE u.userID = ? OR u.firstname = ?`,
      [identifier, identifier]
    );
    
    console.log(`📄 Query returned ${rows.length} rows`);

    if (!rows.length) {
      console.log("❌ No user found with identifier:", identifier);
      return res.status(404).json({ message: "User profile not found" });
    }

    const profile = rows[0];
    const userID = profile.userID;
    console.log(`✅ User found: ${profile.firstName} ${profile.lastName} (ID: ${userID})`);
    
    // Ensure userProfile exists for the requested user
    if (!profile.userProfileID) {
      console.log(`🛠️ UserProfile missing, creating one...`);
      await ensureUserProfileExists(userID);
    }
    
    // Update user stats
    const freshStats = await updateUserStats(userID);
    
    console.log("📤 Sending user profile response");
    res.json({
      ...profile,
      stats: {
        recipes: freshStats.recipes || profile.recipes || 0,
        posts: freshStats.posts || profile.posts || 0,
        likes: freshStats.likes || profile.likes || 0,
      },
      prefs: {
        dietary: profile.dietary ? JSON.parse(profile.dietary || "[]") : [],
        allergies: profile.allergies ? JSON.parse(profile.allergies || "[]") : [],
        emailNotifications: profile.emailNotifications ?? true,
        pushNotifications: profile.pushNotifications ?? true,
        profileVisibility: profile.profileVisibility ?? true,
        language: profile.language || "en",
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Delete user's own account
router.delete("/delete", async (req, res) => {
  console.log("Account deletion request received");
  try {
    // Check authentication
    if (!req.session || !req.session.user) {
      console.log("No session or user found");
      return res.status(401).json({ 
        success: false, 
        error: "Not authenticated. Please log in." 
      });
    }

    const userID = req.session.user.userID;
    const firebaseUID = req.session.user.firebaseUID;

    // Call the helper function
    const result = await deleteUser(userID, firebaseUID);

    // Clear the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      } else {
        console.log("Session destroyed");
      }
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete account",
      details: error.message 
    });
  }
});

// Test endpoint to check basic functionality
router.get("/debug/test", async (req, res) => {
  console.log("🧪 Debug test endpoint hit");
  try {
    console.log("Session:", req.session);
    console.log("Session user:", req.session?.user);
    
    // Test database connection
    const [dbTest] = await db.execute('SELECT 1 as test');
    console.log("Database test:", dbTest);
    
    res.json({
      success: true,
      session: req.session,
      user: req.session?.user,
      database: "Connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Debug test error:", error);
    res.status(500).json({ error: error.message });
  }
});

console.log("✅ UserProfile router loaded with debug logging");
module.exports = { router, deleteUser };