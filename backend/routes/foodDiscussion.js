const express = require('express');
const router = express.Router();
const db = require('../config/db');

/** ---------------------------------------------
 * Helpers
 * --------------------------------------------- */
async function resolveUserProfileID({ userProfileID, userID }) {
  // If userProfileID already provided, trust it
  if (userProfileID) return Number(userProfileID);

  // Fallback: resolve from userID
  if (userID) {
    const sql = `SELECT userProfileID FROM userProfile WHERE userID = ? LIMIT 1`;
    const [rows] = await db.query(sql, [userID]);
    if (rows && rows.length > 0) {
      return Number(rows[0].userProfileID);
    }
  }
  return null;
}

// Helper function to format time ago (kept from your file)
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

/** ---------------------------------------------
 * Get discussions (with replies)
 * --------------------------------------------- */
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

    // extract comments from nested array structure
    let comments = [];
    if (Array.isArray(results) && results.length > 0) {
      if (Array.isArray(results[0])) {
        comments = results[0];
      } else if (results[0] && typeof results[0] === 'object') {
        comments = Object.values(results[0]).filter(item => item && typeof item === 'object' && item.id);
      }
    }

    // Fetch replies for each discussion
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

        const repliesResult = await db.query(repliesSql, [comment.id]);

        let replies = [];
        if (Array.isArray(repliesResult) && repliesResult.length > 0) {
          if (Array.isArray(repliesResult[0])) {
            replies = repliesResult[0];
          } else if (repliesResult[0] && typeof repliesResult[0] === 'object') {
            replies = Object.values(repliesResult[0]).filter(item => item && typeof item === 'object' && item.replyID);
          }
        }

        return {
          ...comment,
          timeAgo: getTimeAgo(comment.timestamp),
          replies: replies.map(r => ({ ...r, timeAgo: getTimeAgo(r.timestamp) }))
        };
      })
    );

    res.json({
      success: true,
      data: discussionsWithReplies,
      count: discussionsWithReplies.length
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch discussions' });
  }
});

/** ---------------------------------------------
 * Add reply to a discussion
 * Accepts: { userProfileID? OR userID?, reply }
 * --------------------------------------------- */
router.post('/:discussionId/replies', async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { userProfileID: bodyUserProfileID, userID, reply } = req.body;

    const userProfileID = await resolveUserProfileID({
      userProfileID: bodyUserProfileID,
      userID
    });

    if (!userProfileID || !reply) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userProfileID/userID, reply'
      });
    }

    const insertSql = `
      INSERT INTO reply 
      (discussionID, userProfileID, reply, createdAt) 
      VALUES (?, ?, ?, NOW())
    `;

    const insertResult = await db.query(insertSql, [discussionId, userProfileID, reply]);
    const resultSetHeader = insertResult[0];
    const newReplyId = resultSetHeader.insertId;

    if (!newReplyId) {
      return res.status(500).json({ success: false, message: 'Failed to create reply - no insert ID returned' });
    }

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
    const replyResult = await db.query(selectSql, [newReplyId]);

    let newReplyData = null;
    if (Array.isArray(replyResult) && Array.isArray(replyResult[0]) && replyResult[0].length > 0) {
      newReplyData = replyResult[0][0];
    }

    if (!newReplyData || !newReplyData.replyID || !newReplyData.content || !newReplyData.username) {
      return res.status(500).json({ success: false, message: 'Reply data is incomplete' });
    }

    res.json({
      success: true,
      message: 'Reply created successfully',
      data: {
        replyID: newReplyData.replyID,
        username: newReplyData.username,
        avatar: newReplyData.avatar,
        content: newReplyData.content,
        timestamp: newReplyData.timestamp,
        type: newReplyData.type,
        timeAgo: 'now'
      }
    });
  } catch (error) {
    console.error('Error creating reply:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ success: false, message: 'Failed to create reply: ' + (error.sqlMessage || error.message) });
  }
});

/** ---------------------------------------------
 * Create a new discussion comment
 * Accepts: { foodID, userProfileID? OR userID?, content }
 * --------------------------------------------- */
router.post('/', async (req, res) => {
  try {
    const { foodID, userProfileID: bodyUserProfileID, userID, content } = req.body;

    const userProfileID = await resolveUserProfileID({
      userProfileID: bodyUserProfileID,
      userID
    });

    if (!foodID || !userProfileID || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: foodID, userProfileID/userID, content'
      });
    }

    const insertSql = `
      INSERT INTO discussion 
      (foodID, userProfileID, content, created_At, upVotes, downVotes) 
      VALUES (?, ?, ?, NOW(), 0, 0)
    `;

    const result = await db.query(insertSql, [foodID, userProfileID, content]);
    const newCommentId = result[0].insertId;

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

    let newCommentData = null;
    if (Array.isArray(newCommentResult) && newCommentResult.length > 0) {
      if (Array.isArray(newCommentResult[0]) && newCommentResult[0].length > 0) {
        newCommentData = newCommentResult[0][0];
      } else if (newCommentResult[0] && typeof newCommentResult[0] === 'object') {
        newCommentData = newCommentResult[0];
      }
    }

    if (!newCommentData) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve created comment' });
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
    console.error('Error creating comment:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ success: false, message: 'Failed to create comment: ' + (error.sqlMessage || error.message) });
  }
});

/** ---------------------------------------------
 * Update comment likes
 * --------------------------------------------- */
router.patch('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body; // 'up' or 'down'

    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid vote type. Must be "up" or "down"' });
    }

    const column = type === 'up' ? 'upVotes' : 'downVotes';
    const sql = `UPDATE discussion SET ${column} = ${column} + 1 WHERE discussionID = ?`;
    await db.query(sql, [commentId]);

    const updatedSql = `SELECT upVotes as likes, downVotes as dislikes FROM discussion WHERE discussionID = ?`;
    const updated = await db.query(updatedSql, [commentId]);

    res.json({ success: true, message: 'Vote updated successfully', data: updated[0] });
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ success: false, message: 'Failed to update vote' });
  }
});

/** ---------------------------------------------
 * Delete a comment
 * --------------------------------------------- */
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userProfileID, userID } = req.body;

    // accept either userProfileID or userID
    const resolvedProfileID = await resolveUserProfileID({ userProfileID, userID });
    if (!resolvedProfileID) {
      return res.status(400).json({ success: false, message: 'userProfileID or userID is required' });
    }

    const checkSql = 'SELECT * FROM discussion WHERE discussionID = ? AND userProfileID = ?';
    const [comment] = await db.query(checkSql, [commentId, resolvedProfileID]);

    if (!comment || comment.length === 0) {
      return res.status(403).json({ success: false, message: 'Comment not found or you do not have permission to delete it' });
    }

    const deleteSql = 'DELETE FROM discussion WHERE discussionID = ?';
    await db.query(deleteSql, [commentId]);

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

/** ---------------------------------------------
 * Get comment statistics for a food
 * --------------------------------------------- */
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
    res.status(500).json({ success: false, message: 'Failed to fetch comment statistics' });
  }
});

module.exports = router;
