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

function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = Math.floor((now - past) / 1000);
  
  // If more than 2 days, show actual date
  if (diff >= 172800) { // 2 days in seconds (2 * 24 * 60 * 60)
    return formatToDate(timestamp);
  }
  
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function formatToDate(timestamp) {
  const date = new Date(timestamp);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

router.get('/food/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    const userProfileID = req.user?.userProfileID;

    const checkingUserProfileID = userProfileID || 0;

    console.log("🟢 GET ROUTE - foodId:", foodId, "userProfileID:", userProfileID, "Type:", typeof userProfileID);

    // First get all comments
    const sql = `
      SELECT 
        d.discussionID as id,
        d.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        up.avatar as avatar,
        u.role as userRole, 
        d.content,
        d.created_At as timestamp,
        d.upVotes as likes,
        d.downVotes as dislikes,
        d.upvoted_by
      FROM discussion d 
      JOIN userProfile up ON d.userProfileID = up.userProfileID 
      JOIN user u ON up.userID = u.userID
      WHERE d.foodID = ? 
      ORDER BY d.created_At DESC
    `;

    const results = await db.query(sql, [foodId]);
    let comments = firstRows(results);

    console.log("🟢 Raw comments from DB:", comments.length);
    
    // ✅ MANUAL user_liked check with detailed debugging
    comments = comments.map(comment => {
      console.log(`🟢 Processing comment ${comment.id}:`);
      console.log(`   upvoted_by:`, comment.upvoted_by);
      console.log(`   userProfileID to check:`, userProfileID);
      
      let user_liked = false;
      
      try {
        if (comment.upvoted_by) {
          // Handle different possible values
          if (comment.upvoted_by === 'null' || comment.upvoted_by === '' || comment.upvoted_by === '[]' || comment.upvoted_by === '[null]') {
            console.log(`   Empty upvoted_by, setting user_liked: false`);
            user_liked = false;
          } else {
            console.log(`   Parsing upvoted_by...`);
            const upvotedArray = JSON.parse(comment.upvoted_by);
            console.log(`   Parsed array:`, upvotedArray);
            console.log(`   Array type:`, typeof upvotedArray, "Is array:", Array.isArray(upvotedArray));
            
            if (typeof upvotedArray === 'number') {
              // If it's just a number, convert to array
              upvotedArray = [upvotedArray];
              console.log(`   Converted single number to array:`, upvotedArray);
            }

            if (Array.isArray(upvotedArray)) {
              // Clean the array - remove any null/undefined values
              const cleanArray = upvotedArray.filter(id => id !== null && id !== undefined);
              console.log(`   Cleaned array:`, cleanArray);
              
              user_liked = cleanArray.includes(checkingUserProfileID);
              console.log(`   user_liked result:`, user_liked, "(looking for", userProfileID, "in", cleanArray, ")");
            } else {
              console.log(`   ❌ upvoted_by is not an array!`);
              user_liked = false;
            }
          }
        } else {
          console.log(`   No upvoted_by field`);
          user_liked = false;
        }
      } catch (error) {
        console.error(`   ❌ Error parsing upvoted_by:`, error.message);
        user_liked = false;
      }

      console.log(`   Final user_liked for comment ${comment.id}:`, user_liked);
      console.log(`   ---`);

      return {
        ...comment,
        user_liked,
        isAdmin: comment.userRole === 'admin'
      };
    });

    // Pull replies
    const discussionsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const repliesSql = `
          SELECT 
            r.replyID,
            r.userProfileID,
            CONCAT(u.firstname, ' ', u.lastname) AS username,
            up.avatar as avatar,
            u.role as userRole,
            r.reply as content,
            r.createdAt as timestamp
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
          isAdmin: r.userRole === 'admin'
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
        d.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        up.avatar as avatar,
        u.role as userRole,
        d.content,
        d.created_At as timestamp,
        d.upVotes as likes,
        d.downVotes as dislikes
      FROM discussion d 
      JOIN userProfile up ON d.userProfileID = up.userProfileID 
      JOIN user u ON up.userID = u.userID
      WHERE d.discussionID = ? AND d.userProfileID = ?
    `;
    const newCommentResult = await db.query(newCommentSql, [newCommentId, userProfileID]);
    const newCommentData = firstRows(newCommentResult)[0];

    if (!newCommentData) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve created comment' });
    }

    res.json({
      success: true,
      message: 'Comment created successfully',
      data: { ...newCommentData, timeAgo: 'now', replies: [], isAdmin: newCommentData.userRole === 'admin'},
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
        r.userProfileID,
        CONCAT(u.firstname, ' ', u.lastname) AS username,
        up.avatar as avatar,
        u.role as userRole,
        r.reply as content,
        r.createdAt as timestamp
      FROM reply r
      JOIN userProfile up ON r.userProfileID = up.userProfileID 
      JOIN user u ON up.userID = u.userID
      WHERE r.replyID = ?
    `;
    const replyResult = await db.query(selectSql, [newReplyId]);
    const newReplyData = firstRows(replyResult)[0];

    console.log("🔵 BACKEND - Retrieved reply data:", {
      id: newReplyData?.replyID,
      username: newReplyData?.username,
      avatar: newReplyData?.avatar,
      userRole: newReplyData?.userRole,
      userProfileID: newReplyData?.userProfileID
    });

    if (!newReplyData) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve created reply data' });
    }

    res.json({
      success: true,
      message: 'Reply created successfully',
      data: { ...newReplyData, timeAgo: 'now', isAdmin: newReplyData.userRole === 'admin' },
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ success: false, message: 'Failed to create reply: ' + error.message });
  }
});

router.patch('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userProfileID } = req.body;

    console.log("🔵 Backend vote request:", { commentId, userProfileID });

    if (!userProfileID || typeof userProfileID !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userProfileID' 
      });
    }
    
    // 1. Get current state
    const [existing] = await db.query(
      `SELECT upvoted_by, upVotes FROM discussion WHERE discussionID = ?`,
      [commentId]
    );

    console.log("🔵 Existing data:", existing[0]);

    let upvotedBy = [];
    try {
      if (existing[0]?.upvoted_by) {
        const upvotedData = existing[0].upvoted_by;
        console.log("🔵 Raw upvoted_by:", upvotedData);
        if (upvotedData && upvotedData !== 'null' && upvotedData !== '' && upvotedData !== '[]') {
          upvotedBy = JSON.parse(upvotedData);
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      upvotedBy = [];
    }

    console.log("🔵 Parsed upvotedBy:", upvotedBy);
    
    // Ensure upvotedBy is always an array
    if (!Array.isArray(upvotedBy)) {
      upvotedBy = [];
    }
    
    // Filter out any invalid values
    upvotedBy = upvotedBy.filter(id => id !== null && id !== undefined && typeof id === 'number');
    
    console.log("🔵 Cleaned upvotedBy:", upvotedBy);
    console.log("🔵 User currently liked:", upvotedBy.includes(userProfileID));

    let newUpvoted = [...upvotedBy];
    let voteChange = 0;
    let userCurrentlyLiked = upvotedBy.includes(userProfileID);

    console.log("🔵 BEFORE - userCurrentlyLiked:", userCurrentlyLiked, "upvotedBy:", upvotedBy);

    if (userCurrentlyLiked) {
      // User already liked - REMOVE like
      newUpvoted = upvotedBy.filter(id => id !== userProfileID);
      voteChange = -1;
      userCurrentlyLiked = false;
      console.log("🔵 REMOVING like");
    } else {
      // User hasn't liked - ADD like
      newUpvoted.push(userProfileID);
      voteChange = 1;
      userCurrentlyLiked = true;
      console.log("🔵 ADDING like");
    }

    console.log("🔵 AFTER - userCurrentlyLiked:", userCurrentlyLiked, "newUpvoted:", newUpvoted, "voteChange:", voteChange);

    // Update database
    await db.query(
      `UPDATE discussion SET 
        upVotes = upVotes + ?, 
        upvoted_by = ?
       WHERE discussionID = ?`,
      [voteChange, JSON.stringify(newUpvoted), commentId]
    );

    // Get updated count
    const [updated] = await db.query(
      `SELECT upVotes as likes FROM discussion WHERE discussionID = ?`,
      [commentId]
    );

    console.log("🔵 Final result - likes:", updated[0]?.likes, "userLiked:", userCurrentlyLiked);

    res.json({ 
      success: true, 
      message: userCurrentlyLiked ? 'Liked successfully' : 'Unliked successfully',
      data: {
        likes: updated[0]?.likes || 0,
        userLiked: userCurrentlyLiked
      }
    });
  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({ success: false, message: 'Failed to update like' });
  }
});

// ✅ Delete a comment (with admin support)
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userProfileID, isAdminAction, adminRole } = req.body;

    if (!userProfileID) {
      return res.status(400).json({ success: false, message: 'userProfileID is required' });
    }

    // check if the comment exists
    const commentCheckSql = 'SELECT userProfileID FROM discussion WHERE discussionID = ?';
    const commentCheckRes = await db.query(commentCheckSql, [commentId]);
    const commentRows = firstRows(commentCheckRes);
    
    if (!commentRows.length) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const commentOwnerID = commentRows[0].userProfileID;
    const commentOwnerStr = commentOwnerID?.toString();
    const userProfileStr = userProfileID.toString();
    const isOwner = commentOwnerStr === userProfileStr;
    const isAdmin = Boolean(isAdminAction) && adminRole === 'admin';

    console.log('Permission check:', { 
      commentOwnerID, 
      userProfileID, 
      isOwner, 
      isAdminAction, 
      adminRole, 
      isAdmin 
    });

    // Allow deletion if user is owner OR admin
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Comment not found or permission denied' 
      });
    }

    // Delete the comment
    const deleteCommentSql = 'DELETE FROM discussion WHERE discussionID = ?';
    await db.query(deleteCommentSql, [commentId]);

    try {
      const deleteRepliesSql = 'DELETE FROM discussion_reply WHERE discussionID = ?';
      await db.query(deleteRepliesSql, [commentId]);
      console.log('✅ Successfully deleted replies');
    } catch (replyError) {
      console.log('⚠️ No replies table found or already empty:', replyError.message);
    }

    res.json({ 
      success: true, 
      message: isAdmin ? 'Comment deleted by admin' : 'Comment deleted successfully',
      deletedByAdmin: isAdmin 
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

// ✅ Delete a reply (with admin support)
router.delete('/:commentId/replies/:replyId', async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const { userProfileID, isAdminAction, adminRole } = req.body;

    if (!userProfileID) {
      return res.status(400).json({ success: false, message: 'userProfileID is required' });
    }

    console.log('🔧 DELETE REPLY REQUEST:', { 
      commentId, 
      replyId, 
      userProfileID, 
      isAdminAction, 
      adminRole 
    });

    let replyCheckSql = 'SELECT userProfileID FROM reply WHERE replyID = ? AND discussionID = ?';
    let replyCheckRes = await db.query(replyCheckSql, [replyId, commentId]);
    let replyRows = firstRows(replyCheckRes);

    console.log('🔧 REPLY CHECK (first attempt - reply table):', {
      replyId,
      commentId,
      rowsFound: replyRows.length,
      replyData: replyRows[0]
    });

    if (!replyRows.length) {
      try {
        replyCheckSql = 'SELECT userProfileID FROM discussion_reply WHERE replyID = ? AND discussionID = ?';
        replyCheckRes = await db.query(replyCheckSql, [replyId, commentId]);
        replyRows = firstRows(replyCheckRes);
        console.log('🔧 REPLY CHECK (second attempt - discussion_reply table):', {
          rowsFound: replyRows.length
        });
      } catch (tableError) {
        console.log('❌ discussion_reply table also failed:', tableError.message);
      }
    }

    if (!replyRows.length) {
      try {
        replyCheckSql = 'SELECT userProfileID FROM discussion_replies WHERE replyID = ? AND discussionID = ?';
        replyCheckRes = await db.query(replyCheckSql, [replyId, commentId]);
        replyRows = firstRows(replyCheckRes);
        console.log('🔧 REPLY CHECK (third attempt - discussion_replies table):', {
          rowsFound: replyRows.length
        });
      } catch (tableError) {
        console.log('❌ discussion_replies table also failed:', tableError.message);
      }
    }
    
    // ✅ Final check - if reply not found in any table
    if (!replyRows.length) {
      console.log('❌ Reply not found in any table');
      return res.status(404).json({ 
        success: false, 
        message: 'Reply not found' 
      });
    }

    const replyOwnerID = replyRows[0].userProfileID;
    const replyOwnerStr = replyOwnerID?.toString();
    const userProfileStr = userProfileID.toString();
    
    const isOwner = replyOwnerStr === userProfileStr;
    const isAdmin = Boolean(isAdminAction) && adminRole === 'admin';

    console.log('🔧 REPLY PERMISSION CHECK:', { 
      replyOwnerID, 
      userProfileID, 
      isOwner, 
      isAdminAction, 
      adminRole, 
      isAdmin 
    });

    // Allow deletion if user is owner OR admin
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Reply not found or permission denied' 
      });
    }

    // ✅ Delete the reply 
    let deleteSuccess = false;
    
    try {
      const deleteReplySql = 'DELETE FROM reply WHERE replyID = ? AND discussionID = ?';
      await db.query(deleteReplySql, [replyId, commentId]);
      console.log('✅ Reply deleted from "reply" table');
      deleteSuccess = true;
    } catch (deleteError) {
      console.log('❌ Failed to delete from "reply" table:', deleteError.message);
    }

    if (!deleteSuccess) {
      try {
        const deleteReplySql = 'DELETE FROM discussion_reply WHERE replyID = ? AND discussionID = ?';
        await db.query(deleteReplySql, [replyId, commentId]);
        console.log('✅ Reply deleted from "discussion_reply" table');
        deleteSuccess = true;
      } catch (deleteError) {
        console.log('❌ Failed to delete from "discussion_reply" table:', deleteError.message);
      }
    }

    if (!deleteSuccess) {
      try {
        const deleteReplySql = 'DELETE FROM discussion_replies WHERE replyID = ? AND discussionID = ?';
        await db.query(deleteReplySql, [replyId, commentId]);
        console.log('✅ Reply deleted from "discussion_replies" table');
        deleteSuccess = true;
      } catch (deleteError) {
        console.log('❌ Failed to delete from "discussion_replies" table:', deleteError.message);
      }
    }

    if (!deleteSuccess) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete reply from any table' 
      });
    }

    res.json({ 
      success: true, 
      message: isAdmin ? 'Reply deleted by admin' : 'Reply deleted successfully',
      deletedByAdmin: isAdmin 
    });

  } catch (error) {
    console.error('❌ Error deleting reply:', error);
    res.status(500).json({ success: false, message: 'Failed to delete reply: ' + error.message });
  }
});

// stats for a food
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
