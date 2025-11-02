const express = require("express");
const router = express.Router();
const db = require("../config/db");
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { deleteFirebaseUser, isInitialized } = require('../config/firebaseAdmin');

// ✅ NEW: Validation and sanitization imports
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

// ✅ Helper to sanitize strings
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

// Update Joi schemas to handle stringified arrays
const profileUpdateSchema = Joi.object({
  location: Joi.string().max(120).allow(null, ''),
  bio: Joi.string().max(2000).allow(null, ''),
  dietary: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(60)),
    Joi.string().max(1000)
  ).custom((value, helpers) => {
    console.log('🔄 Processing dietary input:', value, 'type:', typeof value);
    
    let processedArray = [];
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        processedArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        if (value.includes(',')) {
          processedArray = value.split(',').map(item => item.trim()).filter(Boolean);
        } else if (value.trim()) {
          processedArray = [value.trim()];
        }
      }
    } else if (Array.isArray(value)) {
      processedArray = value;
    } else if (value && typeof value === 'object') {
      processedArray = Object.values(value).filter(item => typeof item === 'string');
    }
    
    const cleanedArray = processedArray
      .map(item => typeof item === 'string' ? item.trim().substring(0, 60) : null)
      .filter(item => item !== null && item !== '');
    
    console.log('✅ Processed dietary array:', cleanedArray);
    return cleanedArray;
  }, 'Array processing').default([]),
  
  allergies: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(60)),
    Joi.string().max(1000)
  ).custom((value, helpers) => {
    console.log('🔄 Processing allergies input:', value, 'type:', typeof value);
    
    let processedArray = [];
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        processedArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        if (value.includes(',')) {
          processedArray = value.split(',').map(item => item.trim()).filter(Boolean);
        } else if (value.trim()) {
          processedArray = [value.trim()];
        }
      }
    } else if (Array.isArray(value)) {
      processedArray = value;
    } else if (value && typeof value === 'object') {
      processedArray = Object.values(value).filter(item => typeof item === 'string');
    }
    
    const cleanedArray = processedArray
      .map(item => typeof item === 'string' ? item.trim().substring(0, 60) : null)
      .filter(item => item !== null && item !== '');
    
    console.log('✅ Processed allergies array:', cleanedArray);
    return cleanedArray;
  }, 'Array processing').default([]),
  
  emailNotifications: Joi.boolean().required(),
  pushNotifications: Joi.boolean().required(),
  profileVisibility: Joi.boolean().required(),
  language: Joi.string().max(10).valid('en', 'ms', 'zh', 'id', 'ta', 'hi', 'ar', 'es', 'fr', 'de').default('en')
})
.required()
.unknown(false);

const identifierSchema = Joi.alternatives().try(
  Joi.number().integer().min(1),
  Joi.string().max(120) // allow name queries (firstName)
);

const sessionUserSchema = Joi.object({
  userID: Joi.number().integer().min(1).required()
});

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
    // ✅ Accept all common image formats
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/svg+xml',
      'image/bmp'
    ];
    
    const mimetype = allowedTypes.includes(file.mimetype);
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const extension = allowedExtensions.includes(fileExtension);
    
    if (mimetype && extension) {
      return cb(null, true);
    }
    
    cb(new Error(`Only image files are allowed (${allowedExtensions.join(', ')})`));
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
          { format: 'auto' }
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
      `SELECT COUNT(*) as count 
       FROM likes l
       INNER JOIN posts p ON l.postID = p.postID 
       WHERE p.userProfileID = ?`, 
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
  console.log(`Starting deletion process for user: ${userID}`);

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

    // Delete from Firebase Authentication if Firebase UID exists
    if (firebaseUID) {
      try {
        console.log("=== FIREBASE DELETION ===");
        console.log("Attempting to delete Firebase user with UID:", firebaseUID);
        
        await deleteFirebaseUser(firebaseUID);
        
        console.log("Successfully deleted user from Firebase Authentication");
      } catch (firebaseError) {
        console.error("Firebase deletion error:", firebaseError.message);
        console.error("Error code:", firebaseError.code);
        
        // Continue with MySQL deletion even if Firebase fails
        console.log("Continuing with database deletion despite Firebase error");
      }
    } else {
      console.log("No Firebase UID found, skipping Firebase deletion");
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
    console.log("Deleted user profile");

    console.log("Deleting user account...");
    await connection.query('DELETE FROM user WHERE userID = ?', [userID]);
    console.log("Deleted user account");

    await connection.commit();
    console.log("Transaction committed successfully");

    return { 
      success: true, 
      message: "Account and all associated data deleted successfully" 
    };

  } catch (error) {
    await connection.rollback();
    console.error("Deletion failed, transaction rolled back:", error);
    throw error;
  } finally {
    connection.release();
    console.log("Database connection released");
  }
};

// Upload avatar to Cloudinary
router.post("/avatar", upload.single('avatar'), async (req, res) => {
  console.log("🖼️ Avatar upload request received");
  try {  
    if (!req.session || !req.session.user) {
      console.log("❌ No session or user found");
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Added Joi validation + sanitization (lightweight since multer guards file)
    try {
      const { error } = sessionUserSchema.validate({ userID: req.session.user.userID });
      if (error) return res.status(401).json({ error: "Invalid session" });
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
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

    console.log("✅ Avatar updated successfully");
    res.json({ 
      success: true, 
      avatarUrl: result.secure_url,
      message: "Avatar updated successfully" 
    });

  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    res.status(500).json({ 
      error: "Failed to upload avatar", 
      details: error.message 
    });
  }
});

// ✅ Avatar Removal Route (DELETE)
router.delete("/avatar", async (req, res) => {
  console.log("🗑️ Avatar removal request received");
  try {
    console.log("🔐 Checking session...");
    
    if (!req.session || !req.session.user) {
      console.log("❌ No session or user found");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // ✅ Added Joi validation + sanitization
    try {
      const { error } = sessionUserSchema.validate({ userID: req.session.user.userID });
      if (error) return res.status(401).json({ error: "Invalid session" });
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userID = req.session.user.userID;
    console.log(`👤 Removing avatar for user: ${userID}`);

    // Ensure userProfile exists first
    await ensureUserProfileExists(userID);

    // Get current avatar URL
    console.log(`🔍 Getting current avatar...`);
    const [existingProfile] = await db.execute(
      `SELECT avatar FROM userProfile WHERE userID = ?`,
      [userID]
    );

    if (existingProfile.length === 0) {
      console.log("❌ User profile not found");
      return res.status(404).json({ error: "User profile not found" });
    }

    const currentAvatar = existingProfile[0].avatar;
    
    // Delete from Cloudinary if exists
    if (currentAvatar) {
      try {
        console.log(`🗑️ Found current avatar: ${currentAvatar}`);
        // Extract public_id from Cloudinary URL
        const urlParts = currentAvatar.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        const fullPublicId = `recipe-app/avatars/${publicId}`;
        console.log(`🗑️ Deleting avatar from Cloudinary with publicId: ${fullPublicId}`);
        await deleteFromCloudinary(fullPublicId);
      } catch (deleteError) {
        console.error('⚠️ Error deleting avatar from Cloudinary (continuing):', deleteError);
        // Continue even if deletion fails - we still want to remove the reference
      }
    }

    // Remove avatar reference from database (set to NULL)
    console.log(`💾 Removing avatar reference from database`);
    await db.execute(
      `UPDATE userProfile SET avatar = NULL WHERE userID = ?`,
      [userID]
    );

    console.log("✅ Avatar removed successfully");
    res.json({ 
      success: true, 
      message: "Avatar removed successfully" 
    });

  } catch (error) {
    console.error("❌ Avatar removal error:", error);
    res.status(500).json({ 
      error: "Failed to remove avatar", 
      details: error.message 
    });
  }
});

// ✅ Get Avatar Route (GET) - Optional but useful
router.get("/avatar", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // ✅ Added Joi validation (session sanity)
    try {
      const { error } = sessionUserSchema.validate({ userID: req.session.user.userID });
      if (error) return res.status(401).json({ error: "Invalid session" });
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userID = req.session.user.userID;
    
    const [profile] = await db.execute(
      `SELECT avatar FROM userProfile WHERE userID = ?`,
      [userID]
    );

    if (profile.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ 
      avatar: profile[0].avatar 
    });

  } catch (error) {
    console.error("❌ Get avatar error:", error);
    res.status(500).json({ 
      error: "Failed to get avatar" 
    });
  }
});

// Enhanced version that includes both recipes and posts
const getUserContributions = async (userID) => {
  try {
    console.log(`📝 Fetching contributions for user: ${userID}`);
    
    // First, get the userProfileID for this user
    console.log(`🔍 Getting userProfileID for user: ${userID}`);
    const [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );

    if (!profileResult.length) {
      console.log('❌ No userProfile found for user:', userID);
      return [];
    }

    const userProfileID = profileResult[0].userProfileID;
    console.log(`✅ Found userProfileID: ${userProfileID} for user: ${userID}`);

    let allContributions = [];

    // 1. Get recipe contributions
    console.log(`🍳 Checking recipe table for contributions...`);
    try {
      const [recipeContributions] = await db.execute(
        `SELECT 
          r.recipeID as id,
          f.name as title,
          f.image as image,
          r.status,
          r.createdAt as submittedDate,
          'recipe' as type
        FROM recipe r
        JOIN food f ON r.foodID = f.foodID
        WHERE r.userProfileID = ?
        ORDER BY r.createdAt DESC`,
        [userProfileID]
      );
      allContributions = [...allContributions, ...recipeContributions];
      console.log(`✅ Found ${recipeContributions.length} recipe contributions`);
    } catch (recipeError) {
      console.error('❌ Error fetching recipe contributions:', recipeError.message);
    }

    // 2. Get post contributions
    console.log(`📝 Checking posts table for contributions...`);
    try {
      const [postContributions] = await db.execute(
        `SELECT 
          postID as id,
          title,
          image,
          status,
          createdAt as submittedDate,
          'post' as type
        FROM posts 
        WHERE userProfileID = ?
        ORDER BY createdAt DESC`,
        [userProfileID]
      );
      allContributions = [...allContributions, ...postContributions];
      console.log(`✅ Found ${postContributions.length} post contributions`);
    } catch (postError) {
      console.error('❌ Error fetching post contributions:', postError.message);
    }

    console.log(`📊 Total contributions found: ${allContributions.length}`);
    
    if (allContributions.length > 0) {
      console.log(`📊 Contribution breakdown by type:`);
      const typeCounts = allContributions.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});
      console.log(`📊 Type counts:`, typeCounts);
    }

    // Format the contributions
    const formattedContributions = allContributions.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image,
      status: item.status,
      submittedDate: item.submittedDate ? new Date(item.submittedDate).toISOString() : new Date().toISOString(),
      type: item.type
    }));

    console.log(`🎯 Formatted contributions:`, formattedContributions);
    return formattedContributions;

  } catch (error) {
    console.error('❌ Error fetching contributions:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    return [];
  }
};

// ✅ Get own profile (/api/userProfile)
router.get("/", async (req, res) => {
  console.log("👤 GET profile request received");
  try {
    console.log("🔐 Checking session...");
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    console.log("Session user:", req.session?.user);
    
    if (!req.session || !req.session.user) {
      console.log("❌ No session or user found - returning guest response");
      return res.status(401).json({
        success: false,
        guest: true,
        message: "Guest access - please login to view profile",
      });
    }

    // ✅ Added Joi validation (session sanity)
    try {
      const { error } = sessionUserSchema.validate({ userID: req.session.user.userID });
      if (error) return res.status(401).json({ error: "Invalid session" });
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userID = req.session.user.userID;
    console.log(`🔍 Fetching profile for userID: ${userID}`);
    
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
    const [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );

    const userProfileID = profileResult[0].userProfileID;
    console.log(`✅ Verified userProfileID: ${userProfileID}`);

    console.log(`📚 Fetching saved foods for userProfileID: ${userProfileID}`);
    let savedFoodsData = [];

    if (userProfileID) {
      try {
        const [savedFoodsRows] = await db.execute(
          `SELECT 
            sf.saveID,
            sf.createdAt as savedDate,
            f.foodID as id,
            f.name as name,
            f.image as image,
            f.origin as origin
          FROM saveFood sf
          JOIN food f ON sf.foodID = f.foodID
          WHERE sf.userProfileID = ?
          ORDER BY sf.createdAt DESC`,
          [userProfileID]
        );

        console.log(`🍴 Saved foods found:`, savedFoodsRows);
        console.log(`🍴 Number of saved foods: ${savedFoodsRows.length}`);

        // Format the data
        savedFoodsData = savedFoodsRows.map(food => ({
          saveId: food.saveID,
          id: food.id,
          name: food.name,
          image: food.image,
          origin: food.origin,
          savedDate: food.savedDate ? new Date(food.savedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Recently saved'
        }));

        console.log('🍴 Formatted saved foods:', savedFoodsData);

      } catch (savedFoodsError) {
        console.error('❌ Error fetching saved foods:', savedFoodsError);
        savedFoodsData = [];
      }
    }

    // ✅ FETCH CONTRIBUTIONS
    console.log(`📝 Fetching contributions for user: ${userID}`);
    const contributions = await getUserContributions(userID);

    
    const response = {
      userID: profile.userID,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role,
      userProfileID: profile.userProfileID,
      location: profile.location,
      bio: profile.bio,
      avatar: profile.avatar,

      savedFoods: savedFoodsData,
      status: contributions,
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

    // DEBUG LOGS
    console.log("📤 FINAL RESPONSE - Has savedFoods?", 'savedFoods' in response);
    console.log("📤 FINAL RESPONSE - Has status?", 'status' in response);
    console.log("📤 Response keys:", Object.keys(response));
    console.log("📤 savedFoods content:", response.savedFoods);
    console.log("📤 status content:", response.status);
    
    res.json(response);

  } catch (err) {
    console.error("❌ Error fetching profile:", err);
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

    // ✅ Added Joi validation + sanitization (STRICT schema)
    const { error, value } = profileUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        error: "Invalid profile update payload",
        details: error.details.map(d => d.message)
      });
    }
    // sanitize strings inside value; arrays handled item-wise
    const sanitized = {};
    for (const [k, v] of Object.entries(value)) {
      if (Array.isArray(v)) {
        sanitized[k] = v.map(sanitizeInput);
      } else {
        sanitized[k] = sanitizeInput(v);
      }
    }
    Object.assign(req.body, sanitized);

    // validate session userID
    try {
      const { error: sessionErr } = sessionUserSchema.validate({ userID: req.session.user.userID });
      if (sessionErr) return res.status(401).json({ error: "Invalid session" });
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
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

// View other user's profile (/api/userProfile/:id) 
router.get("/:identifier", async (req, res) => {
  console.log("👥 Other user profile request received");
  try {
    const identifier = req.params.identifier;
    console.log(`🔍 Fetching profile for identifier: ${identifier}`);

    // ✅ Added Joi validation + sanitization for identifier param
    const { error, value } = identifierSchema.validate(identifier);
    if (error) {
      return res.status(400).json({ message: "Invalid identifier" });
    }
    const cleanIdentifier = typeof value === 'string' ? sanitizeInput(value) : value;
    
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
      [cleanIdentifier, cleanIdentifier]
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

    const [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID] 
    );

    const userProfileID = profileResult[0].userProfileID;
    console.log(`✅ Verified userProfileID for target user: ${userProfileID}`);
        
    let savedFoodsData = [];
    if (userProfileID) {
      try {
        const [savedFoodsRows] = await db.execute(
          `SELECT 
            sf.saveID,
            sf.createdAt as savedDate,
            f.foodID as id,
            f.name as name,
            f.image as image,
            f.origin as origin
          FROM saveFood sf
          JOIN food f ON sf.foodID = f.foodID
          WHERE sf.userProfileID = ?
          ORDER BY sf.createdAt DESC`,
          [userProfileID]
        );

        savedFoodsData = savedFoodsRows.map(food => ({
          saveId: food.saveID,
          id: food.id,
          name: food.name,
          image: food.image,
          origin: food.origin,
          savedDate: food.savedDate ? new Date(food.savedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Recently saved'
        }));

      } catch (savedFoodsError) {
        console.error('❌ Error fetching saved foods:', savedFoodsError);
        savedFoodsData = [];
      }
    }

    console.log(`📝 Fetching contributions for user: ${userID}`);
    const contributions = await getUserContributions(userID);
    
    console.log("📤 Sending user profile response");
    res.json({
      ...profile,
      savedFoods: savedFoodsData, 
      status: contributions, 
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

    // ✅ Added Joi validation (session sanity)
    try {
      const { error } = sessionUserSchema.validate({ userID: req.session.user.userID });
      if (error) return res.status(401).json({ error: "Invalid session" });
    } catch (e) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userID = req.session.user.userID;
    
    // Get Firebase UID from database
    const [userRows] = await db.execute(
      'SELECT firebase_uid FROM user WHERE userID = ?',
      [userID]
    );
    
    const firebaseUID = userRows[0]?.firebase_uid || null;
    console.log(`Deleting user ${userID} with Firebase UID: ${firebaseUID}`);

    // Call the helper function with Firebase UID
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

console.log("✅ UserProfile router loaded with debug logging");
module.exports = {
  router,
  deleteUser
};
