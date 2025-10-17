const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get discussions for a specific food (with replies structure)
router.get('/food/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    
    const sql = `
      SELECT 
        d.discussionID as id,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        LEFT(CONCAT(u.firstname, ' ', u.lastname), 2) as avatar,
        d.content,
        d.created_At as timestamp,
        d.upVotes as likes,
        d.downVotes as dislikes
      FROM discussion d 
      JOIN userProfile up ON d.userProfileID = up.userProfileID 
      JOIN user u ON up.userID = u.userID
      WHERE d.foodID = ? 
      ORDER BY d.created_At DESC
    `;
    
    const results = await db.query(sql, [foodId]);

    console.log('Raw SQL results structure:', {
      type: typeof results,
      isArray: Array.isArray(results),
      length: Array.isArray(results) ? results.length : 'N/A',
      fullResult: JSON.stringify(results, null, 2)
    });

    // extract comments from nested array structure
    let comments = [];
    
    if (Array.isArray(results) && results.length > 0) {
      // The actual data is in results[0]
      if (Array.isArray(results[0])) {
        comments = results[0]; // array of comment objects
      } else if (results[0] && typeof results[0] === 'object') {
        // If it's an object with numeric keys, extract values
        comments = Object.values(results[0]).filter(item => 
          item && typeof item === 'object' && item.id
        );
      }
    }
    
    console.log('Extracted comments:', comments);
    console.log('Number of comments found:', comments.length);

    // Get replies for each discussion
    const discussionsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const repliesSql = `
          SELECT 
            r.replyID,
            CONCAT(u.firstname, ' ', u.lastname) AS username,
            LEFT(CONCAT(u.firstname, ' ', u.lastname), 2) as avatar,
            r.reply as content,
            r.createdAt as timestamp,
            'Member' as type
          FROM reply r
          JOIN userProfile up ON r.userProfileID = up.userProfileID 
          JOIN user u ON up.userID = u.userID
          WHERE r.discussionID = ?
          ORDER BY r.createdAt ASC
        `;
        
        console.log(`Fetching replies for discussion ${comment.id}`);
        const repliesResult = await db.query(repliesSql, [comment.id]);
        
        console.log(`Raw replies result for discussion ${comment.id}:`, {
          type: typeof repliesResult,
          isArray: Array.isArray(repliesResult),
          length: Array.isArray(repliesResult) ? repliesResult.length : 'N/A'
        });

        // extract replies from nested array structure
        let replies = [];
        
        if (Array.isArray(repliesResult) && repliesResult.length > 0) {
          if (Array.isArray(repliesResult[0])) {
            replies = repliesResult[0]; // This is the array of reply objects
          } else if (repliesResult[0] && typeof repliesResult[0] === 'object') {
            replies = Object.values(repliesResult[0]).filter(item => 
              item && typeof item === 'object' && item.replyID
            );
          }
        }
        
        console.log(`Extracted ${replies.length} replies for discussion ${comment.id}`);

        return {
          ...comment,
          timeAgo: getTimeAgo(comment.timestamp),
          replies: replies.map(reply => ({
            ...reply,
            timeAgo: getTimeAgo(reply.timestamp)
          }))
        };
      })
    );
    
    console.log('Final discussions with replies:', {
      totalDiscussions: discussionsWithReplies.length,
      totalReplies: discussionsWithReplies.reduce((acc, disc) => acc + disc.replies.length, 0),
      discussions: discussionsWithReplies.map(disc => ({
        id: disc.id,
        replyCount: disc.replies.length,
        replies: disc.replies.map(rep => ({ id: rep.replyID, content: rep.content }))
      }))
    });
    
    res.json({
      success: true,
      data: discussionsWithReplies,
      count: discussionsWithReplies.length
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions'
    });
  }
});

// Add reply to a discussion
router.post('/:discussionId/replies', async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { userProfileID, reply } = req.body;
    
    console.log('=== REPLY REQUEST ===', { discussionId, userProfileID, reply });
    
    if (!userProfileID || !reply) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userProfileID, reply'
      });
    }
    
    // First, insert the reply
    const insertSql = `
      INSERT INTO reply 
      (discussionID, userProfileID, reply, createdAt) 
      VALUES (?, ?, ?, NOW())
    `;
    
    console.log('Executing insert SQL:', insertSql);
    const insertResult = await db.query(insertSql, [discussionId, userProfileID, reply]);
    console.log('Insert result:', insertResult);
    
    const resultSetHeader = insertResult[0];
    const newReplyId = resultSetHeader.insertId;
    console.log('New reply ID:', newReplyId);
    
    if (!newReplyId) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create reply - no insert ID returned'
      });
    }
    
    // fetch the complete reply data with joins
    const selectSql = `
      SELECT 
        r.replyID,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        LEFT(CONCAT(u.firstname, ' ', u.lastname), 2) as avatar,
        r.reply as content,
        r.createdAt as timestamp,
        'Member' as type
      FROM reply r
      JOIN userProfile up ON r.userProfileID = up.userProfileID 
      JOIN user u ON up.userID = u.userID
      WHERE r.replyID = ?
    `;
    
    console.log('Executing select SQL:', selectSql, [newReplyId]);
    const replyResult = await db.query(selectSql, [newReplyId]);
    console.log('Select result:', replyResult);

    let newReplyData = null;

    if (Array.isArray(replyResult) && 
        Array.isArray(replyResult[0]) && 
        replyResult[0].length > 0) {
    newReplyData = replyResult[0][0];
    }

    console.log('Extracted reply data:', newReplyData);

    if (!newReplyData) {
    console.error('No reply data found after insert');
    return res.status(500).json({
        success: false,
        message: 'Failed to retrieve created reply data'
    });
    }

    // check should pass since newReplyData is the actual object
    if (!newReplyData.replyID || !newReplyData.content || !newReplyData.username) {
    console.error('Incomplete reply data:', newReplyData);
    return res.status(500).json({
        success: false,
        message: 'Reply data is incomplete'
    });
    }
    
    const responseData = {
      replyID: newReplyData.replyID,
      username: newReplyData.username,
      avatar: newReplyData.avatar,
      content: newReplyData.content,
      timestamp: newReplyData.timestamp,
      type: newReplyData.type,
      timeAgo: 'now'
    };
    
    console.log('=== FINAL REPLY RESPONSE ===', responseData);
    
    res.json({
      success: true,
      message: 'Reply created successfully',
      data: responseData
    });
    
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reply: ' + error.message
    });
  }
});

// Create a new discussion comment
router.post('/', async (req, res) => {
  try {
    const { foodID, userProfileID, content } = req.body;
    
    if (!foodID || !userProfileID || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: foodID, userProfileID, content'
      });
    }
    
    const sql = `
      INSERT INTO discussion 
      (foodID, userProfileID, content, created_At, upVotes, downVotes) 
      VALUES (?, ?, ?, NOW(), 0, 0)
    `;
    
    const result = await db.query(sql, [foodID, userProfileID, content]);
    const newCommentId = result[0].insertId; // Extract insertId from result array
    
    console.log('New comment ID:', newCommentId);
    
    // Get the newly created comment with user info 
    const newCommentSql = `
      SELECT 
        d.discussionID as id,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        LEFT(CONCAT(u.firstname, ' ', u.lastname), 2) as avatar,
        d.content,
        d.created_At as timestamp,
        d.upVotes as likes,
        d.downVotes as dislikes,
        'Member' as type
      FROM discussion d 
      JOIN userProfile up ON d.userProfileID = up.userProfileID 
      JOIN user u ON up.userID = u.userID
      WHERE d.discussionID = ?
    `;
    
    const newCommentResult = await db.query(newCommentSql, [newCommentId]);
    
    // extract the comment from nested array structure
    let newCommentData = null;
    
    if (Array.isArray(newCommentResult) && newCommentResult.length > 0) {
      if (Array.isArray(newCommentResult[0]) && newCommentResult[0].length > 0) {
        newCommentData = newCommentResult[0][0];
      } else if (newCommentResult[0] && typeof newCommentResult[0] === 'object') {
        newCommentData = newCommentResult[0];
      }
    }
    
    console.log('Extracted new comment data:', newCommentData);
    
    if (!newCommentData) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve created comment'
      });
    }
    
    res.json({
      success: true,
      message: 'Comment created successfully',
      data: {
        ...newCommentData,
        timeAgo: 'now',
        replies: []
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment: ' + error.message
    });
  }
});

// Update comment likes (upvotes/downvotes)
router.patch('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type, userProfileID } = req.body; // 'up' or 'down'
    
    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be "up" or "down"'
      });
    }
    
    // Check if user already voted 
    const column = type === 'up' ? 'upVotes' : 'downVotes';
    const sql = `UPDATE discussion SET ${column} = ${column} + 1 WHERE discussionID = ?`;
    
    await db.query(sql, [commentId]);
    
    // Get updated vote counts
    const updatedSql = `
      SELECT upVotes as likes, downVotes as dislikes 
      FROM discussion 
      WHERE discussionID = ?
    `;
    const updated = await db.query(updatedSql, [commentId]);
    
    res.json({
      success: true,
      message: 'Vote updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vote'
    });
  }
});

// Delete a comment
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userProfileID } = req.body;
    
    if (!userProfileID) {
      return res.status(400).json({
        success: false,
        message: 'userProfileID is required'
      });
    }
    
    // Verify ownership
    const checkSql = 'SELECT * FROM discussion WHERE discussionID = ? AND userProfileID = ?';
    const comment = await db.query(checkSql, [commentId, userProfileID]);
    
    if (comment.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Comment not found or you do not have permission to delete it'
      });
    }
    
    const deleteSql = 'DELETE FROM discussion WHERE discussionID = ?';
    await db.query(deleteSql, [commentId]);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
});

// Get comment statistics for a food
router.get('/food/:foodId/stats', async (req, res) => {
  try {
    const { foodId } = req.params;
    
    const sql = `
      SELECT 
        COUNT(*) as totalComments,
        SUM(upVotes) as totalLikes
      FROM discussion 
      WHERE foodID = ?
    `;
    
    const results = await db.query(sql, [foodId]);
    
    res.json({
      success: true,
      data: results[0] || { totalComments: 0, totalLikes: 0 }
    });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment statistics'
    });
  }
});

// Helper function to format time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const commentTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - commentTime) / 1000);
  
  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

module.exports = router;