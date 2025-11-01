const express = require("express");
const router = express.Router();
const db = require("../config/db");

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

// ✅ NEW: Joi Schema for like requests
const likeSchema = Joi.object({
  postID: Joi.number().integer().required(),
  //userProfileID: Joi.number().integer().required(),
});

// Get all likes for a specific post
router.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    
    const [likes] = await db.execute(`
      SELECT l.*, up.userProfileID, u.username, u.profilePicture 
      FROM likes l
      JOIN userProfile up ON l.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE l.postID = ?
    `, [postId]);

    res.json({
      success: true,
      data: likes,
      count: likes.length
    });

  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get like count for a post
router.get("/count/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    
    const [result] = await db.execute(`
      SELECT COUNT(*) as likeCount 
      FROM likes 
      WHERE postID = ?
    `, [postId]);

    res.json({
      success: true,
      likeCount: result[0].likeCount
    });

  } catch (error) {
    console.error("Error fetching like count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Check if user liked a post
router.get("/check", async (req, res) => {
  try {
    const { postId } = req.query;

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
    
    const [likes] = await db.execute(`
      SELECT * FROM likes 
      WHERE postID = ? AND userProfileID = ?
    `, [postId, userProfileID]);

    res.json({
      success: true,
      isLiked: likes.length > 0
    });

  } catch (error) {
    console.error("Error checking like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Add a like
router.post("/", async (req, res) => {
  try {
    const { postID } = req.body;

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
    const { error, value } = likeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error)
      return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
    const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
    Object.assign(req.body, cleanData);

    // Check if like already exists
    const [existingLikes] = await db.execute(`
      SELECT * FROM likes 
      WHERE postID = ? AND userProfileID = ?
    `, [postID, userProfileID]);

    if (existingLikes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Post already liked by this user"
      });
    }

    // Insert new like
    const [result] = await db.execute(`
      INSERT INTO likes (postID, userProfileID) 
      VALUES (?, ?)
    `, [postID, userProfileID]);

    res.status(201).json({
      success: true,
      message: "Post liked successfully",
      likeID: result.insertId
    });

  } catch (error) {
    console.error("Error adding like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Remove a like (unlike)
router.delete("/", async (req, res) => {
  try {
    const { postID } = req.body;

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
    const { error, value } = likeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error)
      return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
    const cleanData = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeInput(v)]));
    Object.assign(req.body, cleanData);

    const [result] = await db.execute(`
      DELETE FROM likes 
      WHERE postID = ? AND userProfileID = ?
    `, [postID, userProfileID]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Like not found"
      });
    }

    res.json({
      success: true,
      message: "Post unliked successfully"
    });

  } catch (error) {
    console.error("Error removing like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Remove like by likeID
router.delete("/:likeId", async (req, res) => {
  try {
    const { likeId } = req.params;

    const [result] = await db.execute(`
      DELETE FROM likes 
      WHERE likeID = ?
    `, [likeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Like not found"
      });
    }

    res.json({
      success: true,
      message: "Like removed successfully"
    });

  } catch (error) {
    console.error("Error removing like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get all posts liked by a user
router.get("/user/:userProfileID", async (req, res) => {
  try {
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
    
    const [likedPosts] = await db.execute(`
      SELECT p.*, f.title, f.category
      FROM likes l
      JOIN posted p ON l.postID = p.postedID
      JOIN food f ON p.foodID = f.foodID
      WHERE l.userProfileID = ?
    `, [userProfileID]);

    res.json({
      success: true,
      data: likedPosts,
      count: likedPosts.length
    });

  } catch (error) {
    console.error("Error fetching user likes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
