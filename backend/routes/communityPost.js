const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ AUTO-CREATE UPLOADS DIRECTORY
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory automatically');
}

// ✅ Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all approved posts with joined data including like/comment counts
router.get("/counts", async (req, res) => {
    try {
        const query = `
            SELECT 
                p.postID,
                p.status,
                p.created_at,
                p.culturalStory,
                p.photos,
                p.foodName AS title,
                p.origin AS category,
                p.ingredients,
                p.steps,
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

        // Format the response data
        const formattedPosts = posts.map(post => ({
            id: post.postID,
            title: post.foodName, // Fixed: use foodName instead of title
            author: post.author,
            daysAgo: getTimeAgo(post.created_at),
            category: post.origin, // Fixed: use origin instead of category
            images: post.photos ? post.photos.split(',').map(photo => photo.trim()) : [],
            desc: post.culturalStory,
            likeCount: post.likeCount,
            commentCount: post.commentCount, 
            ingredients: post.ingredients,
            steps: post.steps,    
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
        console.error("Error fetching posts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Get single post by ID with like/comment counts and actual comments
router.get("/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        console.log(`📥 Fetching post with ID: ${postId}`);
        
        // Get post details with counts
        const postQuery = `
            SELECT 
                p.postID,
                p.status,
                p.created_at,
                p.culturalStory,
                p.photos,
                p.foodName,
                p.origin,
                p.ingredients,
                p.steps,
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

        console.log('Executing post query...');
        const [posts] = await db.execute(postQuery, [postId]);
        console.log(`Query result: ${posts.length} posts found`);

        if (posts.length === 0) {
            console.log('No post found with ID:', postId);
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const post = posts[0];
        console.log('Post found:', post.foodName);

        // Get actual comments for this post
        const commentsQuery = `
            SELECT 
                c.commentID,
                c.comment AS commentText,
                c.created_at,
                up.userProfileID,
                CONCAT(u.firstname, ' ', u.lastname) AS author
            FROM comments c
            JOIN userProfile up ON c.userProfileID = up.userProfileID
            JOIN user u ON up.userID = u.userID
            WHERE c.postID = ?
            ORDER BY c.created_at ASC
        `;

        console.log('Fetching comments...');
        const [comments] = await db.execute(commentsQuery, [postId]);
        console.log(`Found ${comments.length} comments`);

        // Get users who liked this post
        const likesQuery = `
            SELECT 
                l.likeID,
                up.userProfileID,
                CONCAT(u.firstname, ' ', u.lastname) AS username
            FROM likes l
            JOIN userProfile up ON l.userProfileID = up.userProfileID
            JOIN user u ON up.userID = u.userID
            WHERE l.postID = ?
        `;

        console.log('Fetching likes...');
        const [likes] = await db.execute(likesQuery, [postId]);
        console.log(`Found ${likes.length} likes`);

        const formattedPost = {
            id: post.postID,
            title: post.foodName, // Fixed: use foodName
            author: post.author,
            daysAgo: getTimeAgo(post.created_at),
            category: post.origin, // Fixed: use origin
            images: post.photos ? post.photos.split(',').map(photo => photo.trim()) : [],
            desc: post.culturalStory,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            likes: likes,
            comments: comments.map(comment => ({
                id: comment.commentID,
                text: comment.commentText,
                author: comment.author,
                daysAgo: getTimeAgo(comment.created_at),
                userProfileID: comment.userProfileID
            })),            
            ingredients: post.ingredients,
            steps: post.steps,           
            userProfile: {
                id: post.userProfileID,
                name: post.author
            }
        };

        console.log('✅ Successfully formatted post data');
        res.json({
            success: true,
            data: formattedPost
        });

    } catch (error) {
        console.error("❌ Error fetching post:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// POST route to create a new comment
router.post('/comments', async (req, res) => {
  try {
    const { content, postId, userProfileID } = req.body;
    
    console.log('📝 Creating new comment:', { content, postId, userProfileID });

    // Validate required fields
    if (!content || !postId || !userProfileID) {
      return res.status(400).json({
        success: false,
        message: 'Content, postId, and userProfileID are required'
      });
    }

    // Insert comment into database
    const insertQuery = `
      INSERT INTO comments (comment, postID, userProfileID, created_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(insertQuery, [content, postId, userProfileID]);
    
    console.log('✅ Comment inserted with ID:', result.insertId);

    // Get the newly created comment with author info
    const commentQuery = `
      SELECT 
        c.commentID,
        c.comment AS commentText,
        c.created_at,
        up.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS author
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
      text: newComment.commentText,
      author: newComment.author,
      daysAgo: getTimeAgo(newComment.created_at),
      userProfileID: newComment.userProfileID
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
      error: error.message
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
        c.comment AS commentText,
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
      text: comment.commentText,
      author: comment.author,
      daysAgo: getTimeAgo(comment.created_at),
      userProfileID: comment.userProfileID
    }));

    res.json({
      success: true,
      comments: formattedComments
    });

  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
});

// In your create endpoint, replace the current try-catch with this:
router.post('/create', upload.array('images', 5), async (req, res) => {
  console.log('=== STARTING POST CREATION ===');
  console.log('📦 Request body:', req.body);
  console.log('📁 Uploaded files:', req.files ? req.files.map(f => f.filename) : 'No files');
  
  try {
    const { foodName, culturalOrigin, culturalStory, ingredients, steps, userProfileID } = req.body;
    
    // Validate required fields with more detailed error messages
    if (!foodName) {
      return res.status(400).json({
        success: false,
        message: 'Food name is required'
      });
    }
    if (!culturalOrigin) {
      return res.status(400).json({
        success: false,
        message: 'Cultural origin is required'
      });
    }
    if (!culturalStory) {
      return res.status(400).json({
        success: false,
        message: 'Cultural story is required'
      });
    }
    if (!userProfileID) {
      return res.status(400).json({
        success: false,
        message: 'User profile ID is required'
      });
    }

    console.log('✅ All required fields present');

    // Get uploaded file paths
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const photosString = images.join(',');

    console.log('🖼️ Processed images:', images);
    console.log('📸 Photos string:', photosString);

    // Test database connection first
    console.log('🔌 Testing database connection...');
    const [testResult] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');

    // Insert into posts table
    const insertQuery = `
      INSERT INTO posts 
        (foodName, origin, userProfileID, status, culturalStory, photos, ingredients, steps, created_at) 
      VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, NOW())
    `;
    
    console.log('🚀 Executing insert query...');
    console.log('Query values:', [foodName, culturalOrigin, userProfileID, culturalStory, photosString, ingredients || '', steps || '']);
    
    const [result] = await db.execute(insertQuery, [
      foodName,
      culturalOrigin,
      userProfileID,
      culturalStory,
      photosString,
      ingredients || '',
      steps || ''
    ]);

    console.log('✅ Post inserted with ID:', result.insertId);

    // Get the newly created post
    const postQuery = `
      SELECT 
        p.postID,
        p.foodName,
        p.origin,
        p.status,
        p.culturalStory,
        p.photos,
        p.ingredients,
        p.steps,
        p.created_at,
        up.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS author
      FROM posts p
      JOIN userProfile up ON p.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE p.postID = ?
    `;

    const [posts] = await db.execute(postQuery, [result.insertId]);
    
    if (posts.length === 0) {
      throw new Error('Failed to retrieve created post');
    }

    const newPost = posts[0];

    console.log('🎉 Post creation completed successfully');
    res.status(201).json({
      success: true,
      message: 'Your heritage story has been submitted for admin approval! It will appear on the website once approved.',
      data: {
        postId: newPost.postID,
        title: newPost.foodName,
        author: newPost.author,
        category: newPost.origin,
        status: newPost.status.toLowerCase(),
        images: newPost.photos ? newPost.photos.split(',') : [],
        ingredients: newPost.ingredients,
        steps: newPost.steps,
        userProfileID: newPost.userProfileID
      }
    });

  } catch (error) {
    console.error('❌ ERROR creating post:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Check for specific MySQL errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Table does not exist');
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('Field does not exist:', error.message);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Database access denied');
    } else if (error.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entry');
    }
    
    let errorMessage = 'Failed to submit post';
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Database table not found.';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database field error.';
    } else if (error.code === 'ER_PARSE_ERROR') {
      errorMessage = 'SQL syntax error.';
    } else if (error.message.includes('userProfileID')) {
      errorMessage = 'Invalid user profile ID. Please make sure you are logged in.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage
      } : undefined
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'Just now';
}

module.exports = router;