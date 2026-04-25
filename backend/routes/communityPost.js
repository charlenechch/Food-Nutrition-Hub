const express = require("express");
const router = express.Router();
const { pool: db } = require("../config/db");
const multer = require('multer');
// const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { sendEmail } = require("../config/mailer");
const { createNotification, isEmailNotificationsEnabled } = require("./notifications");
const { updateUserStats } = require('./userProfile');
const { logActivity } = require("./adminActivityLog");

//  Validation and sanitization imports
const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");

// Helper to sanitize strings
function sanitizeInput(value) {
  if (typeof value === "string") {
    value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    value = validator.trim(value);
  }
  return value;
}

// NEW: Joi Schemas for validation
const postSchema = Joi.object({
  foodName: Joi.string().max(100).required(),
  culturalOrigin: Joi.string().max(100).required(),
  culturalStory: Joi.string().max(2000).required(),
  recipe: Joi.string().allow("", null),
  //userProfileID: Joi.number().integer().required(),
});

const commentSchema = Joi.object({
  content: Joi.string().max(1000).required(),
  postId: Joi.number().integer().required(),
  //userProfileID: Joi.number().integer().required(),
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),  // Use memory storage
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 5  // Change to 5
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// 🧠 DEBUG: Check session data for troubleshooting
router.get("/session-debug", (req, res) => {
  if (req.session) {
    console.log("Session debug:", req.session);
    return res.json({
      success: true,
      sessionUser: req.session.user || null,
    });
  } else {
    return res.json({ success: false, message: "No session object" });
  }
});


// ✅ Add database middleware to ensure req.db is available
router.use((req, res, next) => {
  req.db = db;
  next();
});

router.use((req, res, next) => {
  console.log('🔐 Session Check:', {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    user: req.session?.user,
    sessionID: req.sessionID,
    path: req.path,
    method: req.method
  });
  next();
});

// Get all approved posts with joined data including like/comment counts
router.get("/counts", async (req, res) => {
  try {
    console.log('📥 Fetching all approved posts with counts...');
    
    const query = `
        SELECT 
          p.postID,
          p.status,
          p.created_at,
          p.updated_at,
          p.culturalStory,
          p.photos,
          p.foodName,
          p.origin AS culturalOrigin,
          p.recipe,
          up.userProfileID,
          up.avatar, 
          up.equippedBadge, 
          up.equippedContributorBadge,
          b.badge_type AS contributorBadgeType,
          b.awarded_month AS contributorBadgeMonth,
          CONCAT(u.firstname, ' ', u.lastname) AS author,
          COUNT(DISTINCT l.likeID) as likeCount,
          COUNT(DISTINCT c.commentID) as commentCount
      FROM posts p
      JOIN userProfile up ON p.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      LEFT JOIN likes l ON p.postID = l.postID
      LEFT JOIN comments c ON p.postID = c.postID
      LEFT JOIN badge b ON b.id = up.equippedContributorBadge
      WHERE p.status = 'Approved'
      GROUP BY 
          p.postID, 
          up.userProfileID, 
          up.equippedBadge, 
          up.equippedContributorBadge, 
          b.badge_type, 
          b.awarded_month, 
          u.firstname, 
          u.lastname
      ORDER BY p.created_at DESC
    `;

    const [posts] = await db.execute(query);
    console.log(`✅ Found ${posts.length} approved posts`);

    // Format the response data
    const formattedPosts = posts.map(post => ({
      id: post.postID,
      foodName: post.foodName,
      author: post.author,
      authorProfilePic: post.avatar, 
      equippedBadge: post.equippedBadge,
      equippedContributorBadge: post.equippedContributorBadge,
      contributorBadgeType: post.contributorBadgeType,
      contributorBadgeMonth: post.contributorBadgeMonth,
      daysAgo: getTimeAgo(post.created_at),
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      status: post.status,
      culturalOrigin: post.culturalOrigin,
      images: post.photos ? post.photos.split(',').map(photo => photo.trim()) : [],
      culturalStory: post.culturalStory,
      likeCount: post.likeCount,
      commentCount: post.commentCount, 
      recipe: post.recipe,    
      userProfile: {
        id: post.userProfileID,
        name: post.author
      }
    }));

    res.json({
      success: true,
      data: formattedPosts,
      count: formattedPosts.length
    });

  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single post by ID with like/comment counts and actual comments
router.get("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    console.log(`📥 Fetching post with ID: ${postId}`);

    // Get userProfileID if user is logged in
    let userProfileID = null;
    if (req.session?.user?.userID) {
      const [profileResult] = await db.execute(
        "SELECT userProfileID FROM userProfile WHERE userID = ?",
        [req.session.user.userID]
      );
      if (profileResult.length > 0) userProfileID = profileResult[0].userProfileID;
    }

    const postQuery = `
      SELECT 
          p.postID,
          p.status,
          p.created_at,
          p.culturalStory,
          p.photos,
          p.foodName,
          p.origin AS culturalOrigin,
          p.recipe,
          up.userProfileID,
          up.avatar,
          up.equippedBadge,
          up.equippedContributorBadge,
          b.badge_type AS contributorBadgeType,
          b.awarded_month AS contributorBadgeMonth,
          CONCAT(u.firstname, ' ', u.lastname) AS author,
          COUNT(DISTINCT l.likeID) as likeCount,
          COUNT(DISTINCT c.commentID) as commentCount
      FROM posts p
      JOIN userProfile up ON p.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      LEFT JOIN likes l ON p.postID = l.postID
      LEFT JOIN comments c ON p.postID = c.postID
      LEFT JOIN badge b ON b.id = up.equippedContributorBadge
      WHERE p.postID = ? 
        AND (
          p.status = 'Approved' OR
          up.userProfileID = ?
        )
      GROUP BY p.postID
    `;

    const [posts] = await db.execute(postQuery, [postId, userProfileID]);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you don't have access"
      });
    }

    const post = posts[0];

    // Fetch comments
    const commentsQuery = `
      SELECT 
        c.commentID,
        c.comment AS text,
        c.created_at,
        up.userProfileID,
        up.avatar,
        up.equippedBadge,
        COALESCE(CONCAT(u.firstname, ' ', u.lastname), 'Unknown User') AS author
      FROM comments c
      LEFT JOIN userProfile up ON c.userProfileID = up.userProfileID
      LEFT JOIN user u ON up.userID = u.userID
      WHERE c.postID = ?
      ORDER BY c.created_at ASC
    `;

    const [comments] = await db.execute(commentsQuery, [postId]);

    const formattedPost = {
      id: post.postID,
      foodName: post.foodName,
      author: post.author,
      authorProfilePic: post.avatar, 
      equippedBadge: post.equippedBadge,
      equippedContributorBadge: post.equippedContributorBadge,
      contributorBadgeType: post.contributorBadgeType,
      contributorBadgeMonth: post.contributorBadgeMonth,
      daysAgo: getTimeAgo(post.created_at),
      culturalOrigin: post.culturalOrigin,
      images: post.photos ? post.photos.split(',').map(photo => photo.trim()) : [],
      culturalStory: post.culturalStory,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      comments: comments.map(comment => ({
        id: comment.commentID,
        text: comment.text,
        author: comment.author,
        daysAgo: getTimeAgo(comment.created_at),
        userProfileID: comment.userProfileID,
        userProfilePic: comment.avatar || null,
        equippedBadge: comment.equippedBadge || null
      })),
      recipe: post.recipe,
      status: post.status,
      userProfile: {
        id: post.userProfileID,
        name: post.author
      }
    };

    res.json({ success: true, data: formattedPost });

  } catch (error) {
    console.error("❌ Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST route to create a new comment 
router.post('/comments', async (req, res) => {
  console.log('=== COMMENT CREATION STARTED ===');
  console.log('📦 Request body:', req.body);
  console.log('🔐 Session user:', req.session?.user);

  try {
    // ✅ Enhanced session validation
    if (!req.session || !req.session.user || !req.session.user.userID) {
      console.log('❌ No valid session user found');
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated - please log in again' 
      });
    }
    
    const userID = req.session.user.userID;
    const userRole = req.session.user.role;

    console.log('✅ Processing comment for:', { userID, userRole });

    // ✅ Get userProfileID
    let userProfileID;
    try {
      const [profileResult] = await db.execute(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );
      
      console.log('🔍 Profile query result:', profileResult);
      
      if (profileResult.length === 0) {
        console.log('🆕 Creating userProfile for user:', userID);
        
        // Create userProfile if it doesn't exist
        const [createResult] = await db.execute(
          `INSERT INTO userProfile 
          (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language, equippedBadge) 
          VALUES (?, '[]', '[]', true, true, true, 'en', 'novice')`,
          [userID]
        );
        
        userProfileID = createResult.insertId;
        console.log('✅ Created new userProfile with ID:', userProfileID);
      } else {
        userProfileID = profileResult[0].userProfileID;
        console.log('✅ Found userProfileID:', userProfileID);
      }
    } catch (dbError) {
      console.error('❌ Database error fetching userProfile:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error accessing user profile' 
      });
    }

    if (!userProfileID) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to get user profile ID' 
      });
    }

    const { content, postId } = req.body;

    // ✅ Enhanced validation
    if (!content || !postId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: content and postId are required'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty'
      });
    }

    console.log('✅ Validated input:', { 
      postId, 
      userProfileID, 
      contentLength: content.length, 
      userRole 
    });

    // ✅ Validate post exists
    try {
      const [postCheck] = await db.execute(
        'SELECT postID FROM posts WHERE postID = ? AND status = "Approved"',
        [postId]
      );

      if (postCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or not approved'
        });
      }
    } catch (postError) {
      console.error('❌ Error checking post:', postError);
      return res.status(500).json({
        success: false,
        message: 'Error validating post'
      });
    }

    // ✅ Sanitize content (no Joi validation to avoid complexity)
    const cleanContent = sanitizeInput(content.trim());

    console.log('📝 Creating new comment:', { 
      content: cleanContent, 
      postId, 
      userProfileID 
    });

    // ✅ Insert comment into database
    const insertQuery = `
      INSERT INTO comments (comment, postID, userProfileID, created_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(insertQuery, [cleanContent, postId, userProfileID]);
    console.log('✅ Comment inserted with ID:', result.insertId);

    // Retrieve the created comment with user info
    const commentQuery = `
      SELECT 
        c.commentID,
        c.comment AS text,
        c.created_at,
        up.userProfileID,
        up.avatar,
        up.equippedBadge,
        CONCAT(u.firstname, ' ', u.lastname) AS author,
        u.role
      FROM comments c
      JOIN userProfile up ON c.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE c.commentID = ?
    `;

    const [comments] = await db.execute(commentQuery, [result.insertId]);
    
    if (comments.length === 0) {
      throw new Error('Failed to retrieve created comment');
    }

    const newComment = comments[0];

    const formattedComment = {
      id: newComment.commentID,
      text: newComment.text,
      author: newComment.author,
      daysAgo: getTimeAgo(newComment.created_at),
      userProfileID: newComment.userProfileID,
      userProfilePic: newComment.avatar || null,
      equippedBadge: newComment.equippedBadge || null,
      isAdmin: newComment.role === 'admin'
    };

    console.log('✅ Comment created successfully:', {
      commentId: formattedComment.id,
      author: formattedComment.author
    });

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: formattedComment
    });

  } catch (error) {
    console.error('❌ Error posting comment:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error posting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET route to fetch comments for a specific post
router.get('/comments/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    console.log(`📥 Fetching comments for post ID: ${postId}`);

    const commentsQuery = `
      SELECT 
        c.commentID,
        c.comment AS text,
        c.created_at,
        up.userProfileID,
        COALESCE(CONCAT(u.firstname, ' ', u.lastname), 'Unknown User') AS author
      FROM comments c
      LEFT JOIN userProfile up ON c.userProfileID = up.userProfileID
      LEFT JOIN user u ON up.userID = u.userID
      WHERE c.postID = ?
      ORDER BY c.created_at ASC
    `;

    const [comments] = await db.execute(commentsQuery, [postId]);
    console.log(`✅ Found ${comments.length} comments for post ${postId}`);

    const formattedComments = comments.map(comment => ({
      id: comment.commentID,
      text: comment.text,
      author: comment.author,
      daysAgo: getTimeAgo(comment.created_at),
      userProfileID: comment.userProfileID
    }));

    res.json({ success: true, comments: formattedComments });

  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// to delete a comment
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { isAdmin } = req.body;

    // ✅ Get userProfileID from session + database
    if (!req.session || !req.session.user || !req.session.user.userID) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }
    
    const userID = req.session.user.userID;
    const [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );
    
    if (profileResult.length === 0) {
      return res.status(400).json({ error: 'User profile not found' });
    }
    
    const userProfileID = profileResult[0].userProfileID;
   
    // Validate required fields
    if (!commentId || !userProfileID) {
      return res.status(400).json({
        success: false,
        message: 'Comment ID and userProfileID are required'
      });
    }

    // First, check if comment exists and user owns it
    const checkQuery = `
      SELECT userProfileID FROM comments WHERE commentID = ?
    `;
    
    const [comments] = await db.execute(checkQuery, [commentId]);
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const comment = comments[0];

    const isCommentOwner = comment.userProfileID === parseInt(userProfileID);
    const userIsAdmin = isAdmin === true; 
    
    if (!isCommentOwner && !userIsAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    const deleteQuery = `
      DELETE FROM comments WHERE commentID = ?
    `;
    
    const [result] = await db.execute(deleteQuery, [commentId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    console.log('✅ Comment deleted:', commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCommentId: parseInt(commentId),
      deletedByAdmin: userIsAdmin
    });

  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new post
router.post('/create', upload.array('images', 5), async (req, res) => {
  console.log('=== STARTING POST CREATION ===');
  console.log('📦 Request body:', req.body);
  console.log('📁 Uploaded files:', req.files ? req.files.map(f => f.originalname) : 'No files');
  console.log('🔐 Session user:', req.session?.user);
  
  try {
    // ✅ Enhanced session validation
    if (!req.session || !req.session.user || !req.session.user.userID) {
      console.log('❌ No valid session or userID');
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated. Please log in again.' 
      });
    }
    
    const userID = req.session.user.userID;
    console.log('👤 User ID from session:', userID);

    // ✅ Get userProfileID with better error handling
    let userProfileID;
    try {
      const [profileResult] = await db.execute(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );
      
      console.log('🔍 Profile query result:', profileResult);
      
      if (profileResult.length === 0) {
        console.log('❌ User profile not found, creating one...');
        
        // Create userProfile if it doesn't exist
        const [createResult] = await db.execute(
          `INSERT INTO userProfile 
          (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language, equippedBadge) 
          VALUES (?, '[]', '[]', true, true, true, 'en', 'novice')`, 
          [userID]
        );
        
        userProfileID = createResult.insertId;
        console.log('✅ Created new userProfile with ID:', userProfileID);
      } else {
        userProfileID = profileResult[0].userProfileID;
        console.log('✅ Found userProfileID:', userProfileID);
      }
    } catch (dbError) {
      console.error('❌ Database error fetching userProfile:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: 'Server error accessing user profile' 
      });
    }

    const { foodName, culturalOrigin, culturalStory, recipe } = req.body;

    // Enhanced validation
    if (!foodName || !culturalOrigin || !culturalStory) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: foodName, culturalOrigin, and culturalStory are required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one photo is required to post.'
      });
    }

    console.log('✅ All required fields present:', { foodName, culturalOrigin });

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // MIME type allowlist + magic bytes validation
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
        }

        const buffer = file.buffer;
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
                    && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

        if (!isJpeg && !isPng && !isWebp) {
          return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
        }

        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: 'food-heritage', resource_type: 'image' }
        );
        imageUrls.push(uploadResult.secure_url);
      }
    }

    const photosString = imageUrls.join(',');

    const insertQuery = `
      INSERT INTO posts 
        (foodName, origin, userProfileID, status, culturalStory, photos, recipe, created_at) 
      VALUES (?, ?, ?, 'Pending', ?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(insertQuery, [
      foodName,
      culturalOrigin,
      userProfileID,
      culturalStory,
      photosString,
      recipe || ''
    ]);

    console.log('✅ Post inserted with ID:', result.insertId);

    const postQuery = `
      SELECT 
        p.postID,
        p.foodName,
        p.origin AS culturalOrigin,
        p.status,
        p.culturalStory,
        p.photos,
        p.recipe,
        p.created_at,
        up.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS author
      FROM posts p
      JOIN userProfile up ON p.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE p.postID = ?
    `;

    const [posts] = await db.execute(postQuery, [result.insertId]);
    if (posts.length === 0) throw new Error('Failed to retrieve created post');

    const newPost = posts[0];

    res.status(201).json({
      success: true,
      message: 'Your heritage story has been submitted for admin approval! It will appear on the website once approved.',
      data: {
        postId: newPost.postID,
        foodName: newPost.foodName,
        author: newPost.author,
        culturalOrigin: newPost.culturalOrigin,
        status: newPost.status.toLowerCase(),
        images: imageUrls,
        recipe: newPost.recipe,
        userProfileID: newPost.userProfileID
      }
    });

  } catch (error) {
    console.error('❌ ERROR creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get("/liked/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📥 Fetching liked posts for user: ${userId}`);

    const [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userId]
    );

    if (profileResult.length === 0) {
      console.warn(`⚠️ No userProfile found for userID: ${userId}`);
      return res.json([]);
    }

    const userProfileID = profileResult[0].userProfileID;

    const query = `
      SELECT
        p.postID AS id,
        p.foodName AS title,
        p.photos AS image,
        p.status,
        p.created_at AS submittedDate,
        p.origin AS culturalOrigin
      FROM likes l
      JOIN posts p ON l.postID = p.postID
      WHERE l.userProfileID = ?
      ORDER BY p.created_at DESC
    `;

    const [posts] = await db.execute(query, [userProfileID]);
    console.log(`✅ Found ${posts.length} liked posts for user ${userId}`);

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      image: post.image ? post.image.split(',')[0] : null,
      status: post.status,
      createdAt: post.submittedDate,
      culturalOrigin: post.culturalOrigin
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('❌ Error fetching liked posts:', error);
    res.status(500).json({
      error: 'Failed to fetch liked posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ GET user's community posts for profile contributions
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📥 Fetching community posts for user: ${userId}`);

    // First get userProfileID from userID
    const [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userId]
    );

    if (profileResult.length === 0) {
      console.warn(`⚠️ No userProfile found for userID: ${userId}`);
      return res.json([]); // Return empty array if no profile found
    }

    const userProfileID = profileResult[0].userProfileID;

    const query = `
      SELECT 
        postID AS id,
        foodName AS title,
        photos AS image,
        status,
        created_at AS submittedDate,
        'community' AS type,
        origin AS culturalOrigin,
        culturalStory AS content,
        recipe,
        admin_feedback
      FROM posts 
      WHERE userProfileID = ?
      ORDER BY created_at DESC
    `;
    
    const [posts] = await db.execute(query, [userProfileID]);
    
    console.log(`✅ Found ${posts.length} community posts for user ${userId}`);

    // Format posts (take first image only if multiple)
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      image: post.image ? post.image.split(',')[0] : null,
      status: post.status,
      createdAt: post.submittedDate,
      type: post.type,
      culturalOrigin: post.culturalOrigin,
      content: post.content,
      recipe: post.recipe,
      adminFeedback: post.admin_feedback
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('❌ Error fetching user community posts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch community posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ UPDATE community post
router.put("/revise/:id", upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;

   // Ensure the user is logged in
    if (!req.session || !req.session.user || !req.session.user.userID) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    const sessionUserID = req.session.user.userID;
    const sessionRole = req.session.user.role;

    // Fetch their userProfileID
    const [profileResult] = await db.execute(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [sessionUserID]
    );
    if (profileResult.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const currentUserProfileID = profileResult[0].userProfileID;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is missing or invalid' });
    }

    const { title, culturalOrigin, content, recipe, status } = req.body;

    console.log(`📝 Updating community post ${id}:`, { 
      title, 
      culturalOrigin, 
      contentLength: content ? content.length : 0,
      recipeLength: recipe ? recipe.length : 0,
      status,
      imageCount: req.files ? req.files.length : 0
    });

    // Check if post exists 
    const [existingPost] = await db.execute('SELECT * FROM posts WHERE postID = ?', [id]);
    
    if (existingPost.length === 0) {
      return res.status(404).json({ error: 'Community post not found' });
    }

    const current = existingPost[0];

    // Block the update if the user doesn't own the post (and isn't an admin)
    if (current.userProfileID !== currentUserProfileID && sessionRole !== 'admin') {
      console.warn(`🚨 SECURITY BLOCK: User ${sessionUserID} attempted to edit post ${id} without permission.`);
      return res.status(403).json({ error: 'Forbidden: You do not have access to this post.' });
    }

    console.log('📋 Current post data:', current);

    let finalImages = current.photos; // Default to existing images

    // 🖼️ Handle multiple image uploads to Cloudinary - UPDATED FOR MULTIPLE FILES
    if (req.files && req.files.length > 0) {
      try {
        console.log(`☁️ Uploading ${req.files.length} images to Cloudinary...`);
        
        const imageUrls = [];
        
        for (const file of req.files) {
          console.log('📁 Processing file:', {
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          });

          // MIME type allowlist + magic bytes validation
          const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
          }

          const buffer = file.buffer;
          const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
          const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
          const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
                      && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

          if (!isJpeg && !isPng && !isWebp) {
            return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
          }
          
          const cloudinaryResult = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: 'community-posts',
              resource_type: 'image',
              use_filename: true,
              unique_filename: true,
              overwrite: true,
              transformation: [
                { width: 1600, height: 1600, crop: 'limit' },
                { quality: "auto" }
              ]
            }
          );

          console.log('✅ Image uploaded to Cloudinary:', cloudinaryResult.secure_url);
          imageUrls.push(cloudinaryResult.secure_url);
        }

        // Join multiple image URLs with comma (same as your POST route)
        finalImages = imageUrls.join(',');
        
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        // If upload fails, keep existing images
      }
    } else if (req.body.images && req.body.images.trim() !== "") {
      // If images come as base64 in body (fallback)
      try {
        console.log('☁️ Processing base64 images...');
        const image = req.body.images;
        // MIME type allowlist + magic bytes validation
        if (image.includes(';base64,')) {
          const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          const mimeType = image.split(';')[0].split(':')[1];
          if (!allowedMimeTypes.includes(mimeType)) {
            return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
          }
          const base64Data = image.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
          const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
          const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
                      && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
          if (!isJpeg && !isPng && !isWebp) {
            return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
          }
        }
        finalImages = req.body.images;
        console.log('✅ Using provided base64 images');
      } catch (base64Error) {
        console.error('❌ Base64 images processing failed:', base64Error);
      }
    }

    console.log(finalImages === current.photos 
      ? "🖼️ Keeping existing images" 
      : `✅ Using ${req.files ? req.files.length : 'new'} images`);

    const updateQuery = `
      UPDATE posts 
      SET 
        foodName = ?, 
        origin = ?, 
        culturalStory = ?, 
        recipe = ?, 
        status = ?, 
        photos = ?,
        created_at = NOW()  
      WHERE postID = ?
    `;
    
    console.log('🚀 Executing update query...');
    const [result] = await db.execute(updateQuery, [
      title || current.foodName,
      culturalOrigin || current.origin,
      content || current.culturalStory,
      recipe || current.recipe,
      status || current.status || 'Pending',
      finalImages || '', 
      id
    ]);

    console.log(`✅ Community post ${id} updated successfully (affected rows: ${result.affectedRows})`);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No changes made - post may not exist' });
    }

    // Get updated post with formatted timestamp for response
    const [updatedPost] = await db.execute(
      `SELECT *, DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at 
      FROM posts WHERE postID = ?`,
      [id]
    );

    console.log('🕒 Updated timestamp:', updatedPost[0]?.created_at);
   
    res.json({ 
      success: true, 
      message: 'Community post updated successfully',
      post: updatedPost[0]
    });

  } catch (error) {
    console.error('❌ Error updating community post:', error);

    let errorMessage = 'Failed to update community post';
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Database table not found - check table name';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Invalid column name in query';
    } else if (error.errno === 1452) {
      errorMessage = 'Foreign key constraint fails';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ ADMIN-ONLY APPROVAL ROUTES (Cleaned Version)
//-------------------------------------------------
// 🧩 Middleware: Verify Admin Role
const checkIsAdmin = (req, res, next) => {
  if (req.session?.user?.role === "admin") {
    next(); // ✅ Proceed if user is admin
  } else {
    console.warn("🚫 [ADMIN] Unauthorized access attempt detected.");
    res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to perform this action.",
    });
  }
};

// 1 GET ALL PENDING POSTS (For Admin Dashboard)
router.get("/admin/pending", checkIsAdmin, async (req, res) => {
  console.log("📥 [ADMIN] Fetching all pending community posts...");

  const query = `
    SELECT 
      p.postID,
      p.foodName,
      p.status,
      p.created_at,
      CONCAT(u.firstname, ' ', u.lastname) AS author
    FROM posts p
    JOIN userProfile up ON p.userProfileID = up.userProfileID
    JOIN user u ON up.userID = u.userID
    WHERE p.status = 'Pending'
    ORDER BY p.created_at ASC;
  `;

  try {
    const [rows] = await db.execute(query);
    console.log(`✅ [ADMIN] Found ${rows.length} pending post(s).`);

    const formatted = rows.map((post) => ({
      id: post.postID,
      title: post.foodName,
      author: post.author,
      createdAt: post.created_at,
      status: post.status,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ [ADMIN] Error fetching pending posts:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching pending posts.",
    });
  }
});

// 2 GET ALL REJECTED POSTS (For Admin Dashboard)
router.get("/admin/rejected", checkIsAdmin, async (req, res) => {
  console.log("📥 [ADMIN] Fetching all rejected community posts...");

  const query = `
    SELECT 
      p.postID,
      p.foodName,
      p.status,
      p.created_at,
      p.admin_feedback,
      CONCAT(u.firstname, ' ', u.lastname) AS author
    FROM posts p
    JOIN userProfile up ON p.userProfileID = up.userProfileID
    JOIN user u ON up.userID = u.userID
    WHERE p.status = 'Rejected'
    ORDER BY p.created_at DESC;
  `;

  try {
    const [rows] = await db.execute(query);
    console.log(`✅ [ADMIN] Found ${rows.length} rejected post(s).`);

    const formatted = rows.map((post) => ({
      id: post.postID,
      title: post.foodName,
      author: post.author,
      createdAt: post.created_at,
      status: post.status,
      adminFeedback: post.admin_feedback
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ [ADMIN] Error fetching rejected posts:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching rejected posts.",
    });
  }
});


// 2️ APPROVE A POST (With Optional Feedback)
router.put("/admin/approve/:id", checkIsAdmin, async (req, res) => {
  const { id } = req.params;
  // ✅ 1. Extract feedback from the request body
  const { feedback } = req.body; 
  const feedbackText = feedback || ""; // Default to empty string if no feedback

  console.log(`📥 [ADMIN] Approving post ID: ${id} with feedback: "${feedbackText}"`);

  // 2. Update SQL to save the feedback into admin_feedback column
  const adminName = req.session?.user
    ? `${req.session.user.firstname} ${req.session.user.lastname}`.trim()
    : null;

  const updateQuery = `
    UPDATE posts 
    SET status = 'Approved', admin_feedback = ?, approved_by = ?, approved_at = NOW()
    WHERE postID = ?;
  `;

  try {
    // Pass feedbackText and adminName into the query
    const [result] = await db.execute(updateQuery, [feedbackText, adminName, id]);

    if (result.affectedRows === 0) {
      console.warn(`⚠️ [ADMIN] Post ${id} not found or not pending.`);
      return res.status(404).json({
        success: false,
        message: "Post not found or already approved/rejected.",
      });
    }

    // Fetch User Info & Post Details for Email
    const [rows] = await db.query(`
      SELECT u.email, u.firstname, p.foodName, u.userID, up.userProfileID
      FROM posts p
      JOIN userProfile up ON p.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE p.postID = ?
    `, [id]);

    if (rows.length > 0) {
      const { email, firstname, foodName, userID, userProfileID } = rows[0];

      // Recount User Stats
      // Recount User Stats
      if (userID) {
        await updateUserStats(userID);
        console.log(`✅ User stats recounted for userProfileID: ${userProfileID}`);

        // --- NEW XP TRIGGER FOR COMMUNITY POST (+25 XP) ---
        try {
          // 1. Write the receipt to the history log
          await db.query(
            `INSERT INTO xp_logs (userProfileID, action_type, reference_id, xp_awarded) 
             VALUES (?, 'POST_APPROVED', ?, 25)`,
            [userProfileID, id]
          );

          // 2. Update the user's total bank balance
          await db.query(
            `UPDATE userProfile 
             SET total_xp = COALESCE(total_xp, 0) + 25 
             WHERE userProfileID = ?`,
            [userProfileID]
          );
          console.log(`✅ Awarded 25 XP to userProfileID ${userProfileID} for Community Post ${id}`);
        } catch (xpError) {
          console.error("❌ Failed to award XP for Community Post:", xpError);
        }
        // --- END XP TRIGGER ---
      }

      // 3. Add Feedback Section to the Email HTML (only if feedback exists)
      let feedbackHtmlBlock = "";
      if (feedbackText.trim().length > 0) {
        feedbackHtmlBlock = `
          <div style="background-color: #f0fff4; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-left: 5px solid #28a745;">
             <strong style="color: #155724;">Admin Note:</strong><br/>
             <p style="margin-top: 5px; margin-bottom: 0; color: #155724;">${feedbackText}</p>
          </div>
        `;
      }

      const approvedHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #28a745; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Story Approved!</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #28a745;">Wonderful news, ${firstname}!</h2>
            <p>Your community story <strong>"${foodName}"</strong> has been reviewed and approved.</p>
            
            ${feedbackHtmlBlock}

            <div style="background-color: #f0fff4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">It is now live on the SarawakEats Community page for everyone to read!</p>
            </div>

            <p><a href="https://sarawakeats.site/community">View the community page</a></p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              Best regards,<br>The SarawakEats Team
            </p>
          </div>
        </div>
      `;

      const approvalEmailEnabled = await isEmailNotificationsEnabled(userID, db);
      if (approvalEmailEnabled) {
          sendEmail({
            to: email,
            subject: "🎉 Your Story Has Been Approved!",
            html: approvedHTML,
            text: `Great news! Your story "${foodName}" has been approved.${feedbackText ? ` Admin Note: ${feedbackText}` : ''}`
          });
          console.log(`📩 Post approval email sent to ${email}`);
      } else {
          console.log(`📭 Post approval email skipped (notifications disabled) for userID: ${userID}`);
      }
      await createNotification(userID, "post_approved", `Your community story "${foodName}" has been approved and is now live on SarawakEats!`, db);
      console.log(`🔔 Post approval notification created for userID: ${userID}`);

      const adminID = req.session.user.userID;
      const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
      await logActivity(db, adminID, adminName, "post_approved", `Approved community post "${foodName}" (Post ID: ${id}).`);
    }

    console.log(`✅ [ADMIN] Post ${id} approved successfully.`);

    res.json({ success: true, message: "Post approved successfully." });
  } catch (err) {
    console.error(`❌ [ADMIN] Error approving post ${id}:`, err);
    res.status(500).json({
      success: false,
      message: "Internal server error while approving post.",
    });
  }
});

// 3 Reject a post (For Admin Review Page)
router.put("/admin/reject/:id", checkIsAdmin, async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body; 

  const rejectionEmailContent = feedback && feedback.trim().length > 0 
                             ? feedback 
                             : "No specific feedback provided.";
  
  console.log(`📥 [ADMIN] Rejecting post ID: ${id}`);

  const updateQuery = `
    UPDATE posts SET status = 'Rejected', admin_feedback = ? WHERE postID = ?;
  `;

  try {
    const [result] = await db.execute(updateQuery, [feedback || null, id]);

    if (result.affectedRows === 0) {
      console.warn(`⚠️ [ADMIN] Post ${id} not found or not pending.`);
      return res.status(404).json({
        success: false,
        message: "Post not found or already actioned.",
      });
    }

    // 4. Fetch User Email for Notification
    const [rows] = await db.query(`
      SELECT u.email, u.firstname, p.foodName, u.userID
      FROM posts p
      JOIN userProfile up ON p.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE p.postID = ?
    `, [id]);

    if (rows.length > 0) {
      const { email, firstname, foodName, userID } = rows[0];

      // 5. Send Rejection Email
      const rejectedHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #dc3545; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Submission Update</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #dc3545;">Hello ${firstname},</h2>
            <p>Regarding your community story <strong>"${foodName}"</strong>.</p>
            <p>After review, we have decided not to publish it at this time.</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-left: 5px solid #dc3545;">
              <strong style="color: #856404;">Reason for Rejection:</strong><br/>
              <p style="margin-top: 5px; margin-bottom: 0;">${rejectionEmailContent}</p>
            </div>

            <p>You can edit your story based on this feedback and resubmit it from your profile.</p>

            <p><a href="https://sarawakeats.site/revisecommunitypostpage/${id}">Edit your submission</a></p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              Best regards,<br>The SarawakEats Team
            </p>
          </div>
        </div>
      `;

      const rejectionEmailEnabled = await isEmailNotificationsEnabled(userID, db);
      if (rejectionEmailEnabled) {
          sendEmail({
            to: email,
            subject: "Update on your Community Story Submission",
            html: rejectedHTML,
            text: `Your story "${foodName}" has been rejected.`
          });
          console.log(`📩 Post rejection email sent to ${email}`);
      } else {
          console.log(`📭 Post rejection email skipped (notifications disabled) for userID: ${userID}`);
      }
      await createNotification(userID, "post_rejected", `Your community story "${foodName}" was not approved. Feedback: ${rejectionEmailContent}`, db);
      console.log(`🔔 Post rejection notification created for userID: ${userID}`);

      const adminID = req.session.user.userID;
      const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
      await logActivity(db, adminID, adminName, "post_rejected", `Rejected community post "${foodName}" (Post ID: ${id}).`);
    }

    console.log(`✅ [ADMIN] Post ${id} rejected successfully.`);

    res.json({ success: true, message: "Post rejected successfully." });
  } catch (err) {
    console.error(`❌ [ADMIN] Error rejecting post ${id}:`, err);
    res.status(500).json({
      success: false,
      message: "Internal server error while rejecting post.",
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };

  if (seconds > (2 * intervals.day)) return formatToDate(timestamp);

  for (const [unit, sec] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / sec);
    if (interval >= 1) return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
  }
  return 'Just now';
}

function formatToDate(timestamp) {
  const date = new Date(timestamp);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// 4️⃣ GET ANY POST BY ID (Admin Review Access)
router.get("/admin/:id", checkIsAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`📥 [ADMIN] Fetching post ID: ${id}`);

  const query = `
    SELECT 
      p.postID,
      p.foodName,
      p.origin AS culturalOrigin,
      p.culturalStory,
      p.recipe,
      p.photos,
      p.status,
      p.created_at,
      p.admin_feedback,
      p.approved_by,
      CONCAT(u.firstname, ' ', u.lastname) AS author,
      u.email AS authorEmail
    FROM posts p
    JOIN userProfile up ON p.userProfileID = up.userProfileID
    JOIN user u ON up.userID = u.userID
    WHERE p.postID = ?;
  `;

  try {
    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      console.warn(`⚠️ [ADMIN] Post ${id} not found.`);
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const post = rows[0];
    console.log(`✅ [ADMIN] Loaded post: ${post.foodName}`);

    res.json({
      success: true,
      data: {
        id: post.postID,
        foodName: post.foodName,
        culturalOrigin: post.culturalOrigin,
        culturalStory: post.culturalStory,
        recipe: post.recipe,
        image: post.photos ? post.photos.split(",")[0] : null,
        author: post.author,
        status: post.status,
        adminFeedback: post.admin_feedback,
        approvedBy: post.approved_by || null, 
        created_at: post.created_at,
      },
    });
  } catch (err) {
    console.error("❌ [ADMIN] Error fetching post:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching post.",
    });
  }
});

// =============================
// PATCH: Send Admin Feedback + Smart Email Notification
// =============================
router.patch('/admin/sendFeedback/:id', checkIsAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = req.body.feedback || req.body.message;

    if (!feedback) {
      return res.status(400).json({ error: "Feedback content is required." });
    }

    // 1. Update the database
    const query = "UPDATE posts SET admin_feedback = ? WHERE postID = ?";
    const [result] = await db.query(query, [feedback, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found." });
    }

    // 2. Fetch User Info AND Status to decide email style
    const [rows] = await db.query(`
      SELECT u.email, u.firstname, p.foodName, p.status, u.userID
      FROM posts p
      JOIN userProfile up ON p.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE p.postID = ?
    `, [id]);

    // 3. Construct and Send Email
    if (rows.length > 0) {
      const { email, firstname, foodName, status, userID } = rows[0];

      let subjectLine = "";
      let emailBodyHTML = "";

      // SCENARIO A: Post is REJECTED -> Send Urgent Red Alert
      if (status === "Rejected") {
        subjectLine = `Action Required: Please Revise "${foodName}"`;
        emailBodyHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #dc3545; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">Action Required</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #dc3545;">Hello ${firstname},</h2>
              <p>Thank you for submitting <strong>"${foodName}"</strong>.</p>
              <p>We have reviewed your rejected submission <strong>"${foodName}"</strong> and have new feedback for you.</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-left: 5px solid #dc3545;">
                <strong style="color: #856404;">Admin Feedback:</strong><br/>
                <p style="margin-top: 5px; margin-bottom: 0;">${feedback}</p>
              </div>

              <p>Please update your story based on this feedback so we can reconsider it for approval.</p>

              <p><a href="https://sarawakeats.site/revisecommunitypostpage/${id}">Edit and resubmit your story</a></p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;
      } 
      // SCENARIO B: Post is APPROVED or PENDING -> Send Standard Yellow Feedback
      else {
        subjectLine = `New Feedback on "${foodName}"`;
        emailBodyHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #ffc107; padding: 20px; text-align: center;">
              <h1 style="color: #000; margin: 0;">New Feedback Received</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #333;">Hello ${firstname},</h2>
              <p>You have received a new note regarding your story <strong>"${foodName}"</strong>.</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-left: 5px solid #ffc107;">
                <strong style="color: #856404;">Admin Message:</strong><br/>
                <p style="margin-top: 5px; margin-bottom: 0;">${feedback}</p>
              </div>

              <p><a href="https://sarawakeats.site/revisecommunitypostpage/${id}">View your story</a></p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Best regards,<br>The SarawakEats Team
              </p>
            </div>
          </div>
        `;
      }

      const feedbackEmailEnabled = await isEmailNotificationsEnabled(userID, db);
      if (feedbackEmailEnabled) {
          await sendEmail({
            to: email,
            subject: subjectLine,
            html: emailBodyHTML,
            text: `Feedback on "${foodName}": ${feedback}`
          });
          console.log(`📩 Post feedback email sent to ${email}`);
      } else {
          console.log(`📭 Post feedback email skipped (notifications disabled) for userID: ${userID}`);
      }
      const notifMessage = status === "Rejected"
          ? `Your community story "${foodName}" has new admin feedback: ${feedback}`
          : `You have received a new note on your community story "${foodName}": ${feedback}`;
      await createNotification(userID, "post_feedback", notifMessage, db);
      console.log(`🔔 Post feedback notification created for userID: ${userID}`);
    }

    res.json({ success: true, message: "Feedback sent successfully." });
  } catch (error) {
    console.error("❌ Error sending feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE A POST (Admin Only)
router.delete("/admin/delete/:id", checkIsAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [ADMIN] Deleting post ID: ${id}`);

  try {
    // Fetch post name before deletion for logging
    const [postRows] = await db.execute("SELECT foodName FROM posts WHERE postID = ?", [id]);
    const postName = postRows.length > 0 ? postRows[0].foodName : `ID ${id}`;

    // Execute delete query
    const query = "DELETE FROM posts WHERE postID = ?";
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const adminID = req.session.user.userID;
    const adminName = `${req.session.user.firstname} ${req.session.user.lastname}`.trim();
    await logActivity(db, adminID, adminName, "post_deleted", `Deleted community post "${postName}" (Post ID: ${id}).`);

    console.log(`✅ [ADMIN] Post ${id} deleted successfully.`);
    res.json({ success: true, message: "Post deleted successfully." });

  } catch (err) {
    console.error(`❌ [ADMIN] Error deleting post ${id}:`, err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during deletion.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
