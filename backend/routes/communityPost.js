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
           (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language) 
           VALUES (?, '[]', '[]', true, true, true, 'en')`,
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

    // ✅ Retrieve the created comment with user info
    const commentQuery = `
      SELECT 
        c.commentID,
        c.comment AS text,
        c.created_at,
        up.userProfileID,
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
          `INSERT INTO userProfile (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language) 
           VALUES (?, '[]', '[]', true, true, true, 'en')`,
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

    // ✅ Enhanced validation
    if (!foodName || !culturalOrigin || !culturalStory) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: foodName, culturalOrigin, and culturalStory are required'
      });
    }

    console.log('✅ All required fields present:', { foodName, culturalOrigin });

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
      return res.json([]); // Return empty array if no profile found
    }

    const userProfileID = profileResult[0].userProfileID;

    const query = `
      SELECT 
        postID as id,
        foodName as title,
        photos as image,
        status,
        created_at as submittedDate,
        'community' as type,
        origin as culturalOrigin,
        culturalStory as content,
        recipe
      FROM posts 
      WHERE userProfileID = ?
      ORDER BY created_at DESC
    `;
    
    const [posts] = await db.execute(query, [userProfileID]);
    
    console.log(`✅ Found ${posts.length} community posts for user ${userId}`);

    // Format the posts
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      image: post.image ? post.image.split(',')[0] : null, // Take first image if multiple
      status: post.status,
      submittedDate: post.submittedDate,
      type: post.type,
      culturalOrigin: post.culturalOrigin,
      content: post.content,
      recipe: post.recipe
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

// ✅ UPDATE community post (revision) 
router.put("/revise/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.body) {
      return res.status(400).json({ 
        error: 'Request body is missing or invalid' 
      });
    }
    
    const { title, culturalOrigin, content, recipe, status } = req.body;
    
    console.log(`📝 Updating community post ${id}:`, { 
      title, 
      culturalOrigin, 
      content: content ? content.substring(0, 100) + "..." : "empty",
      recipe: recipe || "none",
      status 
    });

    // FIXED: Correct SQL query that matches your posts table structure
    const query = `
      UPDATE posts 
      SET foodName = ?, origin = ?, culturalStory = ?, recipe = ?, status = ?
      WHERE postID = ?
    `;
    
    const [result] = await db.execute(query, [
      title,                       // maps to foodName
      culturalOrigin,              // maps to origin  
      content,                     // maps to culturalStory
      recipe || '',                // maps to recipe
      status || 'Pending',         // maps to status
      id                           // postID
    ]);

    console.log(`✅ Community post ${id} updated successfully, affected rows:`, result.affectedRows);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'No changes made or post not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Community post updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating community post:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to update community post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
