const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all comments for a specific post
router.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    
    const [comments] = await db.execute(`
      SELECT c.*, up.userProfileID, u.username
      FROM comments c
      JOIN userProfile up ON c.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE c.postID = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });

  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get single comment by ID
router.get("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const [comments] = await db.execute(`
      SELECT c.*, up.userProfileID, u.username 
      FROM comments c
      JOIN userProfile up ON c.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE c.commentID = ?
    `, [commentId]);

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    res.json({
      success: true,
      data: comments[0]
    });

  } catch (error) {
    console.error("Error fetching comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get all comments by a user
router.get("/user/:userProfileID", async (req, res) => {
  try {
    const { userProfileID } = req.params;
    
    const [comments] = await db.execute(`
      SELECT c.*, p.postID, f.name as postTitle
      FROM comments c
      JOIN posts p ON c.postID = p.postID
      JOIN food f ON p.foodID = f.foodID
      WHERE c.userProfileID = ?
      ORDER BY c.created_at DESC
    `, [userProfileID]);

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });

  } catch (error) {
    console.error("Error fetching user comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Add a comment
router.post("/", async (req, res) => {
  try {
    const { postID, userProfileID, commentText } = req.body;

    if (!commentText || commentText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    // Insert new comment
    const [result] = await db.execute(`
      INSERT INTO comments (postID, userProfileID, comment) 
      VALUES (?, ?, ?)
    `, [postID, userProfileID, commentText.trim()]);

    // Get the newly created comment with user info
    const [newComment] = await db.execute(`
      SELECT c.*, up.userProfileID, u.username
      FROM comments c
      JOIN userProfile up ON c.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE c.commentID = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment[0]
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Update a comment
router.put("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { commentText, userProfileID } = req.body;

    if (!commentText || commentText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    // Check if comment exists and belongs to user
    const [existingComments] = await db.execute(`
      SELECT * FROM comments 
      WHERE commentID = ? AND userProfileID = ?
    `, [commentId, userProfileID]);

    if (existingComments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you don't have permission to edit it"
      });
    }

    // Update comment
    await db.execute(`
      UPDATE comments 
      SET comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE commentID = ?
    `, [commentText.trim(), commentId]);

    // Get updated comment
    const [updatedComment] = await db.execute(`
      SELECT c.*, up.userProfileID, u.username 
      FROM comments c
      JOIN userProfile up ON c.userProfileID = up.userProfileID
      JOIN user u ON up.userID = u.userID
      WHERE c.commentID = ?
    `, [commentId]);

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment[0]
    });

  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Delete a comment
router.delete("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userProfileID } = req.body; // For authorization

    // Check if comment exists and belongs to user
    const [existingComments] = await db.execute(`
      SELECT * FROM comments 
      WHERE commentID = ? AND userProfileID = ?
    `, [commentId, userProfileID]);

    if (existingComments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you don't have permission to delete it"
      });
    }

    const [result] = await db.execute(`
      DELETE FROM comments 
      WHERE commentID = ?
    `, [commentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    res.json({
      success: true,
      message: "Comment deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get comment count for a post
router.get("/count/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    
    const [result] = await db.execute(`
      SELECT COUNT(*) as commentCount 
      FROM comments 
      WHERE postID = ?
    `, [postId]);

    res.json({
      success: true,
      commentCount: result[0].commentCount
    });

  } catch (error) {
    console.error("Error fetching comment count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;