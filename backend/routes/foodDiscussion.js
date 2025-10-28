// ✅ backend/routes/foodDiscussion.js (Fixed endpoints)
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Small helper: normalize MySQL2 result
const firstRows = (result) => {
  // mysql2/promise returns [rows, fields]
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
  return Array.isArray(result) ? result : [];
};

// Helper: time ago (string) – keep same behavior as frontend
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

// ✅ Get discussions for a specific food (with replies)
router.get('/food/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    const sql = `
      SELECT 
        d.discussionID as id,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        up.avatar as avatar,
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
    const comments = firstRows(results);

    // Pull replies
    const discussionsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const repliesSql = `
          SELECT 
            r.replyID,
            CONCAT(u.firstname, ' ', u.lastname) AS username,
            up.avatar as avatar,
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
        const replies = firstRows(repliesResult).map(r => ({
          ...r,
          timeAgo: getTimeAgo(r.timestamp),
        }));
        return {
          ...comment,
          timeAgo: getTimeAgo(comment.timestamp),
          replies,
        };
      })
    );

    res.json({ success: true, data: discussionsWithReplies, count: discussionsWithReplies.length });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch discussions' });
  }
});

// ✅ Create a new discussion comment
router.post('/', async (req, res) => {
  try {
    const { foodID, userProfileID, content } = req.body;

    if (!foodID || !userProfileID || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: foodID, userProfileID, content'
      });
    }

    const insertSql = `
      INSERT INTO discussion 
      (foodID, userProfileID, content, created_At, upVotes, downVotes) 
      VALUES (?, ?, ?, NOW(), 0, 0)
    `;
    const insertResult = await db.query(insertSql, [foodID, userProfileID, content.trim()]);
    const newCommentId = firstRows(insertResult).insertId || insertResult[0]?.insertId;

    if (!newCommentId) {
      return res.status(500).json({ success: false, message: 'Failed to create comment' });
    }

    const newCommentSql = `
      SELECT 
        d.discussionID as id,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        up.avatar as avatar,
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
    const newCommentData = firstRows(newCommentResult)[0];

    if (!newCommentData) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve created comment' });
    }

    res.json({
      success: true,
      message: 'Comment created successfully',
      data: { ...newCommentData, timeAgo: 'now', replies: [] },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment: ' + error.message });
  }
});

// ✅ Add reply to a discussion
router.post('/:discussionId/replies', async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { userProfileID, reply } = req.body;

    if (!discussionId || !userProfileID || !reply?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: discussionId, userProfileID, reply'
      });
    }

    const insertSql = `
      INSERT INTO reply (discussionID, userProfileID, reply, createdAt) 
      VALUES (?, ?, ?, NOW())
    `;
    const insertResult = await db.query(insertSql, [discussionId, userProfileID, reply.trim()]);
    const insertHeader = firstRows(insertResult);
    const newReplyId = insertHeader.insertId || insertResult[0]?.insertId;

    if (!newReplyId) {
      return res.status(500).json({ success: false, message: 'Failed to create reply' });
    }

    const selectSql = `
      SELECT 
        r.replyID,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        up.avatar as avatar,
        r.reply as content,
        r.createdAt as timestamp,
        'Member' as type
      FROM reply r
      JOIN userProfile up ON r.userProfileID = up.userProfileID 
      JOIN user u ON up.userID = u.userID
      WHERE r.replyID = ?
    `;
    const replyResult = await db.query(selectSql, [newReplyId]);
    const newReplyData = firstRows(replyResult)[0];

    if (!newReplyData) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve created reply data' });
    }

    res.json({
      success: true,
      message: 'Reply created successfully',
      data: { ...newReplyData, timeAgo: 'now' },
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ success: false, message: 'Failed to create reply: ' + error.message });
  }
});

// ✅ Update comment likes
router.patch('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body;

    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid vote type. Must be "up" or "down"' });
    }

    const column = type === 'up' ? 'upVotes' : 'downVotes';
    await db.query(`UPDATE discussion SET ${column} = ${column} + 1 WHERE discussionID = ?`, [commentId]);

    const updated = await db.query(
      `SELECT upVotes as likes, downVotes as dislikes FROM discussion WHERE discussionID = ?`,
      [commentId]
    );
    const row = firstRows(updated)[0] || { likes: 0, dislikes: 0 };

    res.json({ success: true, message: 'Vote updated successfully', data: row });
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ success: false, message: 'Failed to update vote' });
  }
});

// ✅ Delete a comment (ownership check)
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userProfileID } = req.body;

    if (!userProfileID) {
      return res.status(400).json({ success: false, message: 'userProfileID is required' });
    }

    const checkSql = 'SELECT discussionID FROM discussion WHERE discussionID = ? AND userProfileID = ?';
    const checkRes = await db.query(checkSql, [commentId, userProfileID]);
    const rows = firstRows(checkRes);
    if (!rows.length) {
      return res.status(403).json({ success: false, message: 'Comment not found or permission denied' });
    }

    await db.query('DELETE FROM discussion WHERE discussionID = ?', [commentId]);
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

// ✅ Simple stats for a food
router.get('/food/:foodId/stats', async (req, res) => {
  try {
    const { foodId } = req.params;
    const results = await db.query(
      `SELECT COUNT(*) as totalComments, COALESCE(SUM(upVotes),0) as totalLikes FROM discussion WHERE foodID = ?`,
      [foodId]
    );
    const row = firstRows(results)[0] || { totalComments: 0, totalLikes: 0 };
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comment statistics' });
  }
});

module.exports = router;
