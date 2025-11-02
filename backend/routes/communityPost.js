const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
const cloudinary = require('cloudinary').v2;

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

// ✅ NEW: Joi Schemas for validation
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
const upload = multer({ storage: storage });

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
            p.culturalStory,
            p.photos,
            p.foodName,
            p.origin AS culturalOrigin,
            p.recipe,
            up.userProfileID,
            CONCAT(u.firstname, ' ', u.lastname) AS author,
            COUNT(DISTINCT l.likeID) as likeCount,
            COUNT(DISTINCT c.commentID) as commentCount
        FROM posts p
        JOIN userProfile up ON p.userProfileID = up.userProfileID
        JOIN user u ON up.userID = u.userID
        LEFT JOIN likes l ON p.postID = l.postID
        LEFT JOIN comments c ON p.postID = c.postID
        WHERE p.status = 'Approved'
        GROUP BY p.postID
        ORDER BY p.created_at DESC
    `;

    const [posts] = await db.execute(query);
    console.log(`✅ Found ${posts.length} approved posts`);

    // Format the response data
    const formattedPosts = posts.map(post => ({
      id: post.postID,
      foodName: post.foodName,
      author: post.author,
      daysAgo: getTimeAgo(post.created_at),
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
            CONCAT(u.firstname, ' ', u.lastname) AS author,
            COUNT(DISTINCT l.likeID) as likeCount,
            COUNT(DISTINCT c.commentID) as commentCount
        FROM posts p
        JOIN userProfile up ON p.userProfileID = up.userProfileID
        JOIN user u ON up.userID = u.userID
        LEFT JOIN likes l ON p.postID = l.postID
        LEFT JOIN comments c ON p.postID = c.postID
        WHERE p.postID = ? AND p.status = 'Approved'
        GROUP BY p.postID
    `;

    const [posts] = await db.execute(postQuery, [postId]);
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const post = posts[0];
    console.log('Post found:', post.foodName);

    const commentsQuery = `
        SELECT 
            c.commentID,
            c.comment AS text,
            c.created_at,
            up.userProfileID,
            CONCAT(u.firstname, ' ', u.lastname) AS author
        FROM comments c
        JOIN userProfile up ON c.userProfileID = up.userProfileID
        JOIN user u ON up.userID = u.userID
        WHERE c.postID = ?
        ORDER BY c.created_at ASC
    `;

    const [comments] = await db.execute(commentsQuery, [postId]);
    console.log(`Found ${comments.length} comments`);

    const formattedPost = {
      id: post.postID,
      foodName: post.foodName,
      author: post.author,
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
        userProfileID: comment.userProfileID
      })),            
      recipe: post.recipe,           
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
  try {
    const { content, postId } = req.body;

    console.log('🔐 Comment Session Debug:', {
      hasSession: !!req.session,
      sessionUser: req.session?.user,
      userID: req.session?.user?.userID
    });

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

    let userProfileID;

    // ✅ FIXED: Handle both regular users and admins
    if (userRole === 'admin') {
      console.log('👑 Admin user detected, using admin profile');
      
      // For admins, check if they have a profile or create one
      let [adminProfileResult] = await db.execute(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );
      
      if (adminProfileResult.length === 0) {
        console.log('🆕 Creating admin userProfile for admin user:', userID);
        const [createResult] = await db.execute(
          `INSERT INTO userProfile 
           (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language, isAdmin) 
           VALUES (?, '[]', '[]', true, true, true, 'en', true)`,
          [userID]
        );
        
        [adminProfileResult] = await db.execute(
          'SELECT userProfileID FROM userProfile WHERE userID = ?',
          [userID]
        );
      }
      
      userProfileID = adminProfileResult[0]?.userProfileID;
    } else {
      // Regular user flow
      let [profileResult] = await db.execute(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );
      
      if (profileResult.length === 0) {
        console.log('🆕 Creating userProfile for user:', userID);
        const [createResult] = await db.execute(
          `INSERT INTO userProfile 
           (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language) 
           VALUES (?, '[]', '[]', true, true, true, 'en')`,
          [userID]
        );
        
        [profileResult] = await db.execute(
          'SELECT userProfileID FROM userProfile WHERE userID = ?',
          [userID]
        );
      }
      
      userProfileID = profileResult[0]?.userProfileID;
    }

    if (!userProfileID) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to get user profile ID' 
      });
    }

    console.log('✅ Using userProfileID:', userProfileID, 'for role:', userRole);

    // ✅ Validation
    const { error, value } = commentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details.map(d => d.message).join(", ") 
      });
    }
    
    const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
    Object.assign(req.body, cleanData);

    console.log('📝 Creating new comment:', { content, postId, userProfileID });

    // Insert comment into database
    const insertQuery = `
      INSERT INTO comments (comment, postID, userProfileID, created_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    const isAdminComment = userRole === 'admin';
    const [result] = await db.execute(insertQuery, [cleanContent, postId, userProfileID, isAdminComment]);
    console.log('✅ Comment inserted with ID:', result.insertId);

    const commentQuery = `
      SELECT 
        c.commentID,
        c.comment AS text,
        c.created_at,
        up.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS author
      FROM comments c
      JOIN userProfile up ON c.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE c.commentID = ?
    `;

    const [comments] = await db.execute(commentQuery, [result.insertId]);
    if (comments.length === 0) throw new Error('Failed to retrieve created comment');

    const newComment = comments[0];

    let authorName = newComment.author;
    if (newComment.isAdmin || userRole === 'admin') {
      authorName = `👑 ${newComment.author} (Admin)`;
    }

    const formattedComment = {
      id: newComment.commentID,
      text: newComment.text,
      author: newComment.author,
      daysAgo: getTimeAgo(newComment.created_at),
      userProfileID: newComment.userProfileID,
      isAdmin: newComment.isAdmin || userRole === 'admin'
    };

    res.status(201).json({
      success: true,
      comment: formattedComment,
      message: 'Comment posted successfully'
    });

  } catch (error) {
    console.error('❌ Error posting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error posting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        CONCAT(u.firstname, ' ', u.lastname) AS author
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
  console.log('📁 Uploaded files:', req.files ? req.files.map(f => f.filename) : 'No files');
  
  try {
    const { foodName, culturalOrigin, culturalStory, recipe} = req.body;

    // ✅ Get userProfileID from session + database
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
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

    // ✅ Validate and sanitize
    const { error, value } = postSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error)
      return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
    const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
    Object.assign(req.body, cleanData);
    
    console.log('✅ All required fields present');

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
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

module.exports = router;
