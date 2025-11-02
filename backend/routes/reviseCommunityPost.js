const express = require("express");
const router = express.Router();
const db = require("../config/db");

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

//✅ GET single community post for revision
router.get("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 Fetching community post for revision: ${id}`);

    const query = `
      SELECT 
        postID as id,
        foodName as title,
        photos as image,
        status,
        created_at as submittedDate,
        origin as culturalOrigin,
        culturalStory as content,
        recipe
      FROM posts 
      WHERE postID = ?
    `;
    
    const [posts] = await db.execute(query, [id]);
    
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Community post not found' });
    }

    const post = posts[0];
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('❌ Error fetching community post:', error);
    res.status(500).json({ 
      error: 'Failed to fetch community post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ UPDATE community post (revision) 
router.put("/:id", async (req, res) => {
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

module.exports = router;