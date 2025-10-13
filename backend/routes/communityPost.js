const express = require("express");
const router = express.Router();
const db = require("../config/db");

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
                f.foodID,
                f.name AS title,
                f.origin AS category,
                r.recipeID,
                r.ingredients,
                r.steps,
                up.userProfileID,
                CONCAT(u.firstname, ' ', u.lastname) AS author,
                COUNT(DISTINCT l.likeID) as likeCount,
                COUNT(DISTINCT c.commentID) as commentCount
            FROM posts p
            JOIN food f ON p.foodID = f.foodID
            JOIN recipe r ON p.recipeID = r.recipeID
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
            title: post.title,
            author: post.author,
            daysAgo: getTimeAgo(post.created_at),
            category: post.category,
            images: post.photos ? post.photos.split(',').map(photo => photo.trim()) : [],
            desc: post.culturalStory,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            recipe: {
                ingredients: post.ingredients,
                steps: post.steps
            },
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
                f.foodID,
                f.name AS title,
                f.origin AS category,
                r.recipeID,
                r.ingredients,
                r.steps,
                up.userProfileID,
                CONCAT(u.firstname, ' ', u.lastname) AS author,
                COUNT(DISTINCT l.likeID) as likeCount,
                COUNT(DISTINCT c.commentID) as commentCount
            FROM posts p
            JOIN food f ON p.foodID = f.foodID
            JOIN recipe r ON p.recipeID = r.recipeID
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
        console.log('Post found:', post.title);

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
            title: post.title,
            author: post.author,
            daysAgo: getTimeAgo(post.created_at),
            category: post.category,
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
            recipe: {
                ingredients: post.ingredients,
                steps: post.steps
            },
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
            error: error.message // Include error message for debugging
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