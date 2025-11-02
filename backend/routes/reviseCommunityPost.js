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
    const { title, content, culturalOrigin, recipe, status } = req.body;
    
    console.log(`📝 Updating community post ${id}:`, { title, culturalOrigin });

    const query = `
      UPDATE posts 
      SET foodName = ?, culturalStory = ?, origin = ?, recipe = ?, status = ?, updated_at = NOW()
      WHERE postID = ?
    `;
    
    await db.execute(query, [
      title, 
      content, 
      culturalOrigin, 
      recipe || '', 
      status || 'pending', 
      id
    ]);

    console.log(`✅ Community post ${id} updated successfully`);
    
    res.json({ 
      success: true, 
      message: 'Community post updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating community post:', error);
    res.status(500).json({ 
      error: 'Failed to update community post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;