// ✅ backend/routes/foodDiscussion.js (Fixed endpoints)
const express = require('express');
const router = express.Router();
const { pool: db } = require("../config/db");

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
    //const userProfileID = req.user?.userProfileID;

    let userProfileID = null;
    if (req.session && req.session.user) {
      const userID = req.session.user.userID;
      const [profileResult] = await db.query(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );

      if (profileResult.length > 0) {
        userProfileID = profileResult[0].userProfileID;
      }
    }

    console.log("🟢 GET COMMENTS - foodId:", foodId, "userProfileID:", userProfileID);

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
    
    // check user_liked 
    comments = comments.map(comment => {
      let user_liked = false;
      
      if (userProfileID && comment.upvoted_by) {
        try {
          const upvotedData = comment.upvoted_by;
          
          // Handle JSON database type
          let upvotedArray;
          if (Array.isArray(upvotedData)) {
            upvotedArray = upvotedData; // Already an array (JSON type)
          } else if (typeof upvotedData === 'string') {
            // String fallback
            upvotedArray = JSON.parse(upvotedData);
          } else {
            upvotedArray = [];
          }
          
          // Clean and convert to numbers
          const cleanArray = upvotedArray
            .filter(id => id !== null && id !== undefined)
            .map(id => Number(id));
          
          user_liked = cleanArray.includes(Number(userProfileID));
          
        } catch (error) {
          console.error(`❌ Error parsing upvoted_by for comment ${comment.id}:`, error.message);
          user_liked = false;
        }
      }

      console.log(`✅ Comment ${comment.id}: user_liked = ${user_liked} (userProfileID: ${userProfileID})`);

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
    const { foodID, content } = req.body;

    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userID = req.session.user.userID;
    const userRole = req.session.user.role; // Get user role

    console.log('👤 User attempting comment:', { userID, userRole });

    //Handle both regular users and admins
    let userProfileID;
    let [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );
    
    if (profileResult.length === 0) {
      console.log('🆕 Creating userProfile for user:', { userID, userRole });
      
      // Create userProfile if it doesn't exist (works for both regular users and admins)
      const [createResult] = await db.query(
        `INSERT INTO userProfile 
         (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language) 
         VALUES (?, '[]', '[]', true, true, true, 'en')`,
        [userID]
      );
      
      // Get the newly created userProfileID
      [profileResult] = await db.query(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );
      
      if (profileResult.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to create user profile' 
        });
      }
    }
    
    userProfileID = profileResult[0].userProfileID;
    console.log('✅ Using userProfileID:', userProfileID, 'for role:', userRole);

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

    console.log("🟢 CREATE COMMENT - New comment ID:", newCommentId);

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
        d.downVotes as dislikes,
        d.upvoted_by
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

    const responseData = {
      success: true,
      message: 'Comment created successfully',
      data: { 
        ...newCommentData, 
        timeAgo: 'now', 
        replies: [], 
        user_liked: false,
        isAdmin: newCommentData.userRole === 'admin'
      },
    };

    console.log("✅ Comment created by:", { 
      user: newCommentData.username, 
      role: newCommentData.userRole,
      isAdmin: newCommentData.userRole === 'admin'
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment: ' + error.message });
  }
});

// ✅ Add reply to a discussion 
router.post('/:discussionId/replies', async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { reply } = req.body;

    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userID = req.session.user.userID;
    const userRole = req.session.user.role;

    console.log('👤 User attempting reply:', { userID, userRole });

    //Handle both regular users and admins
    let userProfileID;
    let [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );
    
    if (profileResult.length === 0) {
      console.log('🆕 Creating userProfile for user:', { userID, userRole });
      
      // Create userProfile if it doesn't exist
      const [createResult] = await db.query(
        `INSERT INTO userProfile 
         (userID, dietaryPreference, allergies, emailNotifications, pushNotifications, profileVisibility, language) 
         VALUES (?, '[]', '[]', true, true, true, 'en')`,
        [userID]
      );
      
      [profileResult] = await db.query(
        'SELECT userProfileID FROM userProfile WHERE userID = ?',
        [userID]
      );
      
      if (profileResult.length === 0) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to create user profile' 
        });
      }
    }
    
    userProfileID = profileResult[0].userProfileID;
    console.log('✅ Using userProfileID:', userProfileID, 'for role:', userRole);

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

    console.log("🟢 CREATE REPLY - New reply ID:", newReplyId);

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

    if (!newReplyData) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve created reply data' });
    }

    const responseData = {
      success: true,
      message: 'Reply created successfully',
      data: { 
        ...newReplyData, 
        timeAgo: 'now', 
        isAdmin: newReplyData.userRole === 'admin' 
      },
    };

    console.log("✅ Reply created by:", { 
      user: newReplyData.username, 
      role: newReplyData.userRole,
      isAdmin: newReplyData.userRole === 'admin'
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ success: false, message: 'Failed to create reply: ' + error.message });
  }
});

router.patch('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    console.log("🟡 VOTE REQUEST - commentId:", commentId);
    
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userID = req.session.user.userID;
    const [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );
    
    if (profileResult.length === 0) {
      return res.status(400).json({ error: 'User profile not found' });
    }
    
    const userProfileID = profileResult[0].userProfileID;

    // 1. Get current upvoted_by data and upVotes
    const [existing] = await db.query(
      `SELECT upvoted_by, upVotes FROM discussion WHERE discussionID = ?`,
      [commentId]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    let upvotedBy = [];
    const currentUpvotedBy = existing[0].upvoted_by;
    const currentUpVotes = existing[0].upVotes || 0;
    
    console.log("🟡 RAW upvoted_by from DB:", currentUpvotedBy);
    console.log("🟡 Type of upvoted_by:", typeof currentUpvotedBy);
    
    // Handle different data types for upvoted_by
    if (currentUpvotedBy !== null && currentUpvotedBy !== undefined) {
      try {
        // If it's already a JavaScript array (JSON database type)
        if (Array.isArray(currentUpvotedBy)) {
          upvotedBy = currentUpvotedBy;
        } 
        // If it's a string that might be JSON
        else if (typeof currentUpvotedBy === 'string') {
          // Check if it's a valid JSON string
          if (currentUpvotedBy.trim().startsWith('[') || currentUpvotedBy.trim().startsWith('{')) {
            const parsed = JSON.parse(currentUpvotedBy);
            // If it's an object, extract values; if array, use as-is
            upvotedBy = Array.isArray(parsed) ? parsed : Object.values(parsed);
          } else {
            // If it's not JSON, treat as empty array
            upvotedBy = [];
          }
        }
        // If it's an object, convert to array
        else if (typeof currentUpvotedBy === 'object' && currentUpvotedBy !== null) {
          upvotedBy = Object.values(currentUpvotedBy);
        }
      } catch (e) {
        console.error('❌ Parse error:', e.message);
        upvotedBy = [];
      }
    }

    // Ensure it's an array and clean it
    if (!Array.isArray(upvotedBy)) {
      upvotedBy = [];
    }

    // Convert all IDs to numbers for consistent comparison
    upvotedBy = upvotedBy.map(id => Number(id)).filter(id => !isNaN(id) && id !== null);
    const userProfileIDNum = Number(userProfileID);

    console.log("🟡 PARSED upvotedBy:", upvotedBy, "userProfileID:", userProfileIDNum);

    let newUpvotedBy;
    let newUpVotes;
    let userLiked;

    // Check if user already liked
    const userIndex = upvotedBy.indexOf(userProfileIDNum);
    
    if (userIndex > -1) {
      // User already liked - REMOVE like
      newUpvotedBy = upvotedBy.filter(id => id !== userProfileIDNum);
      newUpVotes = Math.max(0, currentUpVotes - 1);
      userLiked = false;
      console.log("🟡 ACTION: REMOVING like - user found at index:", userIndex);
    } else {
      // User hasn't liked - ADD like
      newUpvotedBy = [...upvotedBy, userProfileIDNum];
      newUpVotes = currentUpVotes + 1;
      userLiked = true;
      console.log("🟡 ACTION: ADDING like - user not found in array");
    }

    console.log("🟡 NEW upvotedBy to save:", newUpvotedBy);
    console.log("🟡 NEW upVotes:", newUpVotes);

    const updateResult = await db.query(
      `UPDATE discussion SET 
        upVotes = ?, 
        upvoted_by = ?
       WHERE discussionID = ?`,
      [newUpVotes, JSON.stringify(newUpvotedBy), commentId]
    );

    console.log("🟡 UPDATE result - affected rows:", updateResult[0]?.affectedRows);

    res.json({ 
      success: true, 
      message: userLiked ? 'Liked successfully' : 'Unliked successfully',
      data: {
        likes: newUpVotes,
        userLiked: userLiked
      }
    });

  } catch (error) {
    console.error('❌ Error updating like:', error);
    res.status(500).json({ success: false, message: 'Failed to update like: ' + error.message });
  }
});

// ✅ Delete a comment (with admin support)
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { isAdminAction, adminRole } = req.body;

    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userID = req.session.user.userID;
    const [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );
    
    if (profileResult.length === 0) {
      return res.status(400).json({ error: 'User profile not found' });
    }
    
    const userProfileID = profileResult[0].userProfileID;

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
    const { isAdminAction, adminRole } = req.body;

    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userID = req.session.user.userID;
    const [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );
    
    if (profileResult.length === 0) {
      return res.status(400).json({ error: 'User profile not found' });
    }
    
    const userProfileID = profileResult[0].userProfileID;

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

// DELETE like from the comment
router.delete('/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userID = req.session.user.userID;
    const [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );
    
    if (profileResult.length === 0) {
      return res.status(400).json({ error: 'User profile not found' });
    }
    
    const userProfileID = profileResult[0].userProfileID;

    // Get current upvoted_by array
    const [existing] = await db.query(
      `SELECT upvoted_by, upVotes FROM discussion WHERE discussionID = ?`,
      [commentId]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    let upvotedBy = [];
    try {
      if (existing[0]?.upvoted_by && existing[0].upvoted_by !== 'null' && existing[0].upvoted_by !== '' && existing[0].upvoted_by !== '[]') {
        upvotedBy = JSON.parse(existing[0].upvoted_by);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      upvotedBy = [];
    }

    // Check if user actually liked this post
    const userIndex = upvotedBy.indexOf(userProfileID);
    if (userIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have not liked this comment' 
      });
    }

    // Remove user from upvoted_by array
    upvotedBy.splice(userIndex, 1);
    
    // Update database
    await db.query(
      `UPDATE discussion SET 
        upVotes = upVotes - 1, 
        upvoted_by = ?
       WHERE discussionID = ?`,
      [JSON.stringify(upvotedBy), commentId]
    );

    // Get updated count
    const [updated] = await db.query(
      `SELECT upVotes as likes FROM discussion WHERE discussionID = ?`,
      [commentId]
    );

    res.json({ 
      success: true, 
      message: 'Like removed successfully',
      data: {
        likes: updated[0]?.likes || 0,
        userLiked: false
      }
    });
  } catch (error) {
    console.error('Error removing like:', error);
    res.status(500).json({ success: false, message: 'Failed to remove like' });
  }
});

// ✅ Get food like status for current user
router.get('/food/:foodId/like-status', async (req, res) => {
  try {
    const { foodId } = req.params;

    if (!req.session || !req.session.user) {
      return res.json({ success: true, data: { isLiked: false, likesCount: 0 } });
    }

    const userID = req.session.user.userID;
    const [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );

    if (profileResult.length === 0) {
      return res.json({ success: true, data: { isLiked: false, likesCount: 0 } });
    }

    const userProfileID = profileResult[0].userProfileID;

    // Get food like data from discussion table
    const [discussionResult] = await db.query(
      `SELECT likes_count, liked_by 
       FROM discussion 
       WHERE foodID = ? 
       ORDER BY created_At DESC 
       LIMIT 1`,
      [foodId]
    );

    let isLiked = false;
    let likesCount = 0;

    if (discussionResult.length > 0) {
      const discussion = discussionResult[0];
      likesCount = discussion.likes_count || 0;
      
      // Check if user liked this food
      const likedBy = discussion.liked_by;
      if (likedBy) {
        try {
          let likedByArray = [];
          if (Array.isArray(likedBy)) {
            likedByArray = likedBy;
          } else if (typeof likedBy === 'string') {
            likedByArray = JSON.parse(likedBy);
          }
          
          // Convert to numbers and check if user exists
          likedByArray = likedByArray.map(id => Number(id)).filter(id => !isNaN(id));
          isLiked = likedByArray.includes(Number(userProfileID));
        } catch (error) {
          console.error('Error parsing liked_by:', error);
        }
      }
    }

    res.json({
      success: true,
      data: {
        isLiked,
        likesCount
      }
    });
  } catch (error) {
    console.error('Error fetching food like status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch like status' });
  }
});

// ✅ Toggle food like
  router.get('/food/:foodId/like-status', async (req, res) => {
  try {
    const { foodId } = req.params;

    const [foodResult] = await db.query(
      `SELECT likes_count FROM food WHERE foodID = ?`,
      [foodId]
    );

    const likesCount = foodResult.length > 0 ? (foodResult[0].likes_count || 0) : 0;

    res.json({
      success: true,
      data: { likesCount }
    });
    } catch (error) {
      console.error('❌ like-status error:', error);
      res.json({ success: true, data: { likesCount: 0 } });
    }
  });

  // ✅ Toggle food like (POST route)
router.post('/food/:foodId/toggle-like', async (req, res) => {
  try {
    const { foodId } = req.params;
    console.log('🔵 BACKEND toggle-like - foodId:', foodId);

    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userID = req.session.user.userID;
    console.log('🔵 BACKEND toggle-like - userID:', userID);
    
    const [profileResult] = await db.query(
      'SELECT userProfileID FROM userProfile WHERE userID = ?',
      [userID]
    );

    if (profileResult.length === 0) {
      return res.status(400).json({ success: false, message: 'User profile not found' });
    }

    const userProfileID = profileResult[0].userProfileID;
    console.log('🔵 BACKEND toggle-like - userProfileID:', userProfileID);

    // Get current food like data from FOOD table
    const [foodResult] = await db.query(
      `SELECT likes_count, liked_by 
       FROM food 
       WHERE foodID = ?`,
      [foodId]
    );

    if (foodResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }

    const food = foodResult[0];
    let currentLikesCount = food.likes_count || 0;
    let currentLikedBy = [];
    
    // Parse existing liked_by data
    const likedBy = food.liked_by;
    if (likedBy) {
      try {
        if (Array.isArray(likedBy)) {
          currentLikedBy = likedBy;
        } else if (typeof likedBy === 'string') {
          currentLikedBy = JSON.parse(likedBy);
        }
      } catch (error) {
        console.error('Error parsing existing liked_by:', error);
        currentLikedBy = [];
      }
    }

    // Clean the array
    currentLikedBy = currentLikedBy.map(id => Number(id)).filter(id => !isNaN(id));
    const userProfileIDNum = Number(userProfileID);

    let newLikedBy;
    let newLikesCount;
    let isLiked;

    // Check if user already liked
    const userIndex = currentLikedBy.indexOf(userProfileIDNum);
    
    if (userIndex > -1) {
      // Unlike: remove user from array
      newLikedBy = currentLikedBy.filter(id => id !== userProfileIDNum);
      newLikesCount = Math.max(0, currentLikesCount - 1);
      isLiked = false;
      console.log('🔵 BACKEND toggle-like - UNLIKING food');
    } else {
      // Like: add user to array
      newLikedBy = [...currentLikedBy, userProfileIDNum];
      newLikesCount = currentLikesCount + 1;
      isLiked = true;
      console.log('🔵 BACKEND toggle-like - LIKING food');
    }

    console.log('🔵 BACKEND toggle-like - newLikesCount:', newLikesCount);
    console.log('🔵 BACKEND toggle-like - newLikedBy:', newLikedBy);

    // Update the FOOD table
    await db.query(
      `UPDATE food 
       SET likes_count = ?, liked_by = ?
       WHERE foodID = ?`,
      [newLikesCount, JSON.stringify(newLikedBy), foodId]
    );

    console.log('🟢 BACKEND toggle-like - Update successful');

    res.json({
      success: true,
      data: {
        isLiked,
        likesCount: newLikesCount
      }
    });
  } catch (error) {
    console.error('❌ BACKEND toggle-like - Error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

module.exports = router;