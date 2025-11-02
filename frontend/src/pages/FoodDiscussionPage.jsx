// ✅ src/pages/FoodDiscussionPage.jsx 
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/LoginPromptModal";

// ✅ Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ show, onClose, onConfirm, type = "comment", isAdminAction = false }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-card-header">
          <h3>
            {isAdminAction ? "Admin: Delete " : "Delete "}
            {type === "reply" ? "Reply" : "Comment"}
          </h3>
          {isAdminAction && (
            <div className="admin-delete-warning">
              <i className="fas fa-exclamation-triangle"></i>
              <span>You are deleting this as an administrator</span>
            </div>
          )}
        </div>
        <div className="modal-card-body">
          <p>
            {isAdminAction 
              ? `Are you sure you want to delete this ${type} as an administrator? This action cannot be undone.`
              : `Are you sure you want to delete this ${type}? This action cannot be undone.`
            }
          </p>
        </div>
        <div className="modal-card-actions">
          <button className="lrp-btn lrp-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className={`lrp-btn ${isAdminAction ? 'lrp-btn-warning' : 'lrp-btn-danger'}`} onClick={onConfirm}>
            {isAdminAction ? "Delete as Admin" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Format "time ago"
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = Math.floor((now - past) / 1000);
  
  // If more than 2 days, show actual date
  if (diff >= 172800) { 
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

// ✅ Single Comment Component
const Comment = React.memo(function Comment({
  item,
  isReply = false,
  onToggleLike,
  replyToId,
  setReplyToId,
  replyTexts,
  setReplyTexts,
  onPostReply,
  onDeleteComment,
  onDeleteReply,
  isGuest,
  setShowLoginPrompt,
  currentUserId,
  isAdmin = false, 
}) {
  const itemId = isReply ? (item.replyID || item.id) : (item.id || item.discussionID);
  const username = item.username || "User";
  const avatar = item.avatar;
  const content = item.content || item.reply || "No content";
  const timestamp = item.timestamp || item.createdAt;
  const likes = isReply ? 0 : item.likes || item.upVotes || 0;
  const userLiked = item.user_liked || false;

  const commentIsAdmin = item.isAdmin || item.userRole === 'admin';
  
  // Enhanced user ID extraction 
  const commentUserId = item.userProfileID || item.userID || item.authorID || item.user_id;
  
  // Check if current user is the owner of this comment/reply
  const isOwner = currentUserId && commentUserId && currentUserId.toString() === commentUserId.toString();
  
  // Admin can delete any comment/reply
  const canDelete = isOwner || isAdmin;

  console.log('🟢 Comment data:', {
    username,
    avatar, 
    commentIsAdmin,
    isOwner,
    currentUserId,
    commentUserId
  });

  const handleLike = () => {
    if (isGuest) return setShowLoginPrompt(true);
    onToggleLike(itemId);
  };

  const handleToggleReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  const handleReplyChange = (e) => {
    if (isGuest) return setShowLoginPrompt(true);
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handlePostReply = () => {
    if (isGuest) return setShowLoginPrompt(true);
    onPostReply(itemId);
  };

  const handleDelete = () => {
    if (isReply) {
      onDeleteReply(item.discussionID, itemId, isAdmin && !isOwner);
    } else {
      onDeleteComment(itemId, isAdmin && !isOwner);
    }
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">
          {item.avatar ? (
            <img 
              src={item.avatar} 
              alt={username}
              className="fd-disc-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
          
          <div className="fd-disc-avatar-initials">
            {username.substring(0, 2).toUpperCase()}
          </div>
          )}
        </div>
      <div className="fd-disc-body">
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
          
          {/* ✅ UPDATED DELETE BUTTON - Show for owners AND admins */}
          {canDelete && (
            <button 
              className={`fd-delete-btn ${isAdmin && !isOwner ? 'fd-admin-delete-btn' : ''}`} 
              onClick={handleDelete}
              title={`Delete ${isReply ? 'reply' : 'comment'}${isAdmin && !isOwner ? ' (Admin)' : ''}`}
              aria-label={`Delete ${isReply ? 'reply' : 'comment'} by ${username}`}
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          )}
        </div>
        <p className="fd-disc-text">{content}</p>

        {!isReply && (
          <div className="fd-disc-actions">
            <button 
              className={`fd-link-btn ${userLiked ? 'liked' : ''}`} 
              onClick={handleLike}
            >
              {userLiked ? "♥" : "♡"} {likes}
            </button>
            <button className="fd-link-btn" onClick={handleToggleReply}>
              ↩ Reply
            </button>
          </div>
        )}

        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply..."
              value={replyTexts[itemId] || ""}
              onChange={handleReplyChange}
              rows="2"
            />
            <div className="fd-reply-actions">
              <button className="lrp-btn lrp-btn-primary" disabled={!replyTexts[itemId]?.trim()} onClick={handlePostReply}>
                Send Reply
              </button>
              <button className="lrp-btn lrp-btn-outline" onClick={() => setReplyToId(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

          {item.replies && item.replies.length > 0 && (
            <div className="fd-disc-replies">
              {item.replies.map((reply, idx) => (
                <Comment
                  key={reply.replyID || idx}
                  item={{
                    ...reply,
                    discussionID: item.id || item.discussionID 
                  }}
                  isReply={true}
                  onToggleLike={onToggleLike}
                  replyToId={replyToId}
                  setReplyToId={setReplyToId}
                  replyTexts={replyTexts}
                  setReplyTexts={setReplyTexts}
                  onPostReply={onPostReply}
                  onDeleteComment={onDeleteComment}
                  onDeleteReply={onDeleteReply}
                  isGuest={isGuest}
                  setShowLoginPrompt={setShowLoginPrompt}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin} // ✅ PASS ADMIN PROP TO REPLIES
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
});

// ✅ Main Component
export default function FoodDiscussionPage() {
  const { user } = useAuth();
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const isGuest = !user || user.role === "guest";
  const userProfileID = isGuest ? null : user?.userProfileID || user?.userID || user?.id || user?.profileID;
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ✅ NEW: Food like state
  const [foodLike, setFoodLike] = useState({
    isLiked: false,
    likesCount: 0,
    loading: false
  });
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    type: "comment", // "comment" or "reply"
    commentId: null,
    replyId: null,
    onConfirm: null,
    isAdminAction: false // Track if this is an admin action
  });

  // UPDATED: Delete confirmation function
  const showDeleteConfirmation = (type, commentId, replyId = null, isAdminAction = false) => {
    setDeleteModal({
      show: true,
      type,
      commentId,
      replyId,
      isAdminAction,
      onConfirm: () => {
        if (type === "comment") {
          deleteComment(commentId, isAdminAction);
        } else {
          deleteReply(commentId, replyId, isAdminAction);
        }
      }
    });
  };

  // ✅ Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}`, {
        credentials: "include",
      });

      if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.data);
      } else {
        setComments([]);
        console.error("API returned error:", data.message);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (foodId) fetchComments();
  }, [foodId]);

  // ✅ NEW: Fetch food like status
  const fetchFoodLikeStatus = async () => {
    try {
      const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}/like-status`, {
        credentials: "include",
      });

      console.log('🟡 fetchFoodLikeStatus - Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('🟡 fetchFoodLikeStatus - Response data:', data);
        
        if (data.success) {
          setFoodLike(prev => ({
            ...prev,
            isLiked: data.data.isLiked,
            likesCount: data.data.likesCount
          }));
          console.log('🟢 fetchFoodLikeStatus - Updated state:', { 
            isLiked: data.data.isLiked, 
            likesCount: data.data.likesCount 
          });
        }
      } else {
        console.log('🔴 fetchFoodLikeStatus - API error:', res.status);
      }
    } catch (error) {
      console.error('❌ fetchFoodLikeStatus - Network error:', error);
    }
  };

  // Toggle food like
  const toggleFoodLike = async () => {
    if (isGuest) return setShowLoginPrompt(true);
    
    if (foodLike.loading) return;

    console.log('🟡 BEFORE toggle - isLiked:', foodLike.isLiked, 'likesCount:', foodLike.likesCount);

    // Optimistic update
    const previousState = { ...foodLike };
    setFoodLike(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
      loading: true
    }));

    try {
      console.log('🟡 Calling toggle-like API for food:', foodId);
      const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}/toggle-like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      console.log('🟡 API Response status:', res.status);
      const data = await res.json();
      console.log('🟡 API Response data:', data);

      if (res.ok && data.success) {
        console.log('🟢 API Success - isLiked:', data.data.isLiked, 'likesCount:', data.data.likesCount);
        setFoodLike(prev => ({
          ...prev,
          isLiked: data.data.isLiked,
          likesCount: data.data.likesCount,
          loading: false
        }));
      } else {
        console.log('🔴 API Error:', data.message);
        // Revert on error
        setFoodLike(prev => ({
          ...prev,
          ...previousState,
          loading: false
        }));
        alert(data?.message || "Failed to update like");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      // Revert on error
      setFoodLike(prev => ({
        ...prev,
        ...previousState,
        loading: false
      }));
      alert("Network error while updating like");
    }
  };

  useEffect(() => {
    if (foodId) {
      fetchComments();
      fetchFoodLikeStatus(); // ✅ Fetch like status on component mount
    }
  }, [foodId]);

  // ✅ Post Comment
  const postComment = async () => {
    if (isGuest) return setShowLoginPrompt(true);
    if (!newComment.trim()) return;

    const actualUserProfileID = user?.role === 'admin' 
    ? (user?.userProfileID || user?.profileID || user?.id)
    : userProfileID;

    const actualFoodID = foodId;

    console.log("🚨 CRITICAL DEBUG - User data:", {
    userID: user?.userID,
    userProfileID: user?.userProfileID,
    actualUserProfileID: actualUserProfileID,
    role: user?.role,
    fullUserObject: user
  });
    
    if (!actualUserProfileID) {
      alert("Admin account needs a userProfileID to post comments. Please contact support.");
      return;
    }

    if (!actualFoodID) {
      alert("Food ID not found. Please go back and try again.");
      return;
    }

    try {
    const tempComment = {
      id: `temp-${Date.now()}`,
      userProfileID: actualUserProfileID,
      username: user?.username || user?.firstname || 'You',
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      user_liked: false,
      replies: [],
      timeAgo: 'now',
      isTemp: true,
      isAdmin: user?.role === "admin",
      avatar: user?.avatar,
      userRole: user?.role
    };

    setComments((prev) => [tempComment, ...prev]);
    setNewComment(""); 

    const res = await fetch(`${API}/api/foodDiscussion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        foodID: actualFoodID,
        userProfileID: actualUserProfileID,
        content: newComment.trim(),
      }),
    });

      const data = await res.json();

      if (res.ok && data.success) {
        console.log("🟢 FRONTEND - Backend response data structure:", {
        id: data.data.id,
        username: data.data.username,
        avatar: data.data.avatar,
        userRole: data.data.userRole,
        userProfileID: data.data.userProfileID
      });
      
      setComments((prev) => 
        prev.map(comment => 
          comment.id === tempComment.id && comment.isTemp
            ? { 
                ...data.data,
                user_liked: false,
                timeAgo: 'now',
                replies: [],
              }
            : comment
        )
      );
      alert("Comment posted successfully!");
    } else {
      setComments((prev) => prev.filter(comment => 
        comment.id !== tempComment.id || !comment.isTemp
      ));
      alert(data?.message || "Unable to post comment");
    }
  } catch (err) {
    setComments((prev) => prev.filter(comment => 
      comment.id !== tempComment.id || !comment.isTemp
    ));
    console.error("Error posting comment:", err);
    alert("Server error while posting comment.");
  }
};

  // ✅ Post Reply
const postReply = async (discussionId) => {
  if (isGuest) return setShowLoginPrompt(true);
  const text = replyTexts[discussionId]?.trim();
  if (!text) return;

  const actualUserProfileID = user?.role === 'admin' 
    ? (user?.userProfileID || user?.profileID || user?.id)
    : userProfileID;

  console.log("FRONTEND - postReply called:", {
    discussionId,
    actualUserProfileID,
    userRole: user?.role
  });

  if (!actualUserProfileID) {
    alert("User profile ID not found. Please log in again.");
    return;
  }


  try {
    const tempReply = {
      replyID: `temp-reply-${Date.now()}`,
      userProfileID: actualUserProfileID,
      username: user?.username || `${user?.firstname} ${user?.lastname}`.trim() || '',
      avatar: user?.avatar, 
      userRole: user?.role,
      isAdmin: user?.role === 'admin',
      content: text,
      reply: text,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      timeAgo: 'now',
      isTemp: true,
      discussionID: discussionId
    };

    setComments((prev) =>
      prev.map((c) =>
        c.id === discussionId || c.discussionID === discussionId
          ? { 
              ...c, 
              replies: [...(c.replies || []), tempReply] 
            }
          : c
      )
    );
    
    setReplyTexts((prev) => ({ ...prev, [discussionId]: "" })); //Clear the input
    setReplyToId(null);

    const res = await fetch(`${API}/api/foodDiscussion/${discussionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userProfileID: actualUserProfileID,
        reply: text,
      }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      // Replace temporary reply with real one, ensuring userProfileID is included
      setComments((prev) =>
        prev.map((c) =>
          c.id === discussionId || c.discussionID === discussionId
            ? {
                ...c,
                replies: (c.replies || []).map(reply =>
                  reply.replyID === tempReply.replyID
                    ? { 
                        ...data.data,
                        timeAgo: 'now',
                        discussionID: discussionId,
                      }
                    : reply
                ),
              }
            : c
        )
      );
      alert("Reply posted successfully!");
    } else {
      // ✅ Remove temporary reply if failed
      setComments((prev) =>
        prev.map((c) =>
          c.id === discussionId || c.discussionID === discussionId
            ? {
                ...c,
                replies: (c.replies || []).filter(reply => reply.replyID !== tempReply.replyID),
              }
            : c
        )
      );
      alert(data?.message || "Unable to post reply");
    }
  } catch (err) {
    // ✅ Remove temporary reply on error
    setComments((prev) =>
      prev.map((c) =>
        c.id === discussionId || c.discussionID === discussionId
          ? {
              ...c,
              replies: (c.replies || []).filter(reply => reply.replyID !== tempReply.replyID),
            }
          : c
      )
    );
    console.error("Error posting reply:", err);
    alert("Server error while posting reply.");
  }
};

  // Toggle Like
  const toggleLike = async (targetId) => {
    if (isGuest) return setShowLoginPrompt(true);

    if (!userProfileID) {
      console.error("No valid userProfileID found");
      return;
    }

    // ✅ IMMEDIATELY update UI state
    setComments(prev => prev.map(comment => {
      if (comment.id === targetId || comment.discussionID === targetId) {
        const currentlyLiked = comment.user_liked || false;
        const currentLikes = comment.likes || 0;
        
        return {
          ...comment,
          user_liked: !currentlyLiked,
          likes: currentlyLiked ? currentLikes - 1 : currentLikes + 1
        };
      }
      return comment;
    }));

    try {
      const res = await fetch(`${API}/api/foodDiscussion/${targetId}/vote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userProfileID: userProfileID  
        }),
      });
      
      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("Like failed:", data.message);
        // Revert the UI state on error
        setComments(prev => prev.map(comment => {
          if (comment.id === targetId || comment.discussionID === targetId) {
            const currentlyLiked = comment.user_liked || false;
            const currentLikes = comment.likes || 0;
            
            return {
              ...comment,
              user_liked: !currentlyLiked, // Revert the like state
              likes: currentlyLiked ? currentLikes + 1 : currentLikes - 1 // Revert the count
            };
          }
          return comment;
        }));
        alert("Failed to update like: " + data.message);
      }
    } catch (err) {
      console.error("Error updating like:", err);
      // Revert the UI state on network error
      setComments(prev => prev.map(comment => {
        if (comment.id === targetId || comment.discussionID === targetId) {
          const currentlyLiked = comment.user_liked || false;
          const currentLikes = comment.likes || 0;
          
          return {
            ...comment,
            user_liked: !currentlyLiked, // Revert the like state
            likes: currentlyLiked ? currentLikes + 1 : currentLikes - 1 // Revert the count
          };
        }
        return comment;
      }));
      alert("Network error while updating like");
    }
  };

  // Delete Comment (with admin support)
  const deleteComment = async (commentId, isAdminAction = false) => {
    if (isGuest) return setShowLoginPrompt(true);

    try {

      const requestBody = {
      userProfileID: userProfileID,
      isAdminAction: isAdminAction,
      adminRole: user?.role, 
      adminId: user?.id || user?.userID
      };

      const res = await fetch(`${API}/api/foodDiscussion/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log('Delete response:', data);

      if (res.ok && data.success) {
        // Remove comment from state
        setComments(prev => prev.filter(comment => 
          comment.id !== commentId && comment.discussionID !== commentId
        ));
        setDeleteModal({ show: false, type: "comment", commentId: null, replyId: null, onConfirm: null, isAdminAction: false });
        //alert(isAdminAction ? "Comment deleted successfully as administrator." : "Comment deleted successfully.");
      } else {
        alert(data?.message || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Server error while deleting comment.");
    }
  };

  // Delete Reply (with admin support)
  const deleteReply = async (commentId, replyId, isAdminAction = false) => {
    if (isGuest) return setShowLoginPrompt(true);

    try {

      const requestBody = {
      userProfileID: userProfileID,
      isAdminAction: isAdminAction,
      adminRole: user?.role,
      adminId: user?.id || user?.userID
      };

      const res = await fetch(`${API}/api/foodDiscussion/${commentId}/replies/${replyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remove reply from state
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId || comment.discussionID === commentId) {
            return {
              ...comment,
              replies: comment.replies?.filter(reply => reply.replyID !== replyId && reply.id !== replyId) || []
            };
          }
          return comment;
        }));
        setDeleteModal({ show: false, type: "reply", commentId: null, replyId: null, onConfirm: null, isAdminAction: false });
        //alert(isAdminAction ? "Reply deleted successfully as administrator." : "Reply deleted successfully.");
      } else {
        alert(data?.message || "Failed to delete reply");
      }
    } catch (err) {
      console.error("Error deleting reply:", err);
      alert("Server error while deleting reply.");
    }
  };

  // ✅ UPDATED: Handle comment deletion
  const handleDeleteComment = (commentId, isAdminAction = false) => {
    showDeleteConfirmation("comment", commentId, null, isAdminAction);
  };

  // ✅ UPDATED: Handle reply deletion
  const handleDeleteReply = (commentId, replyId, isAdminAction = false) => {
    showDeleteConfirmation("reply", commentId, replyId, isAdminAction);
  };

  // ✅ Render Loading
  if (loading) {
    return (
      <div className="food-discussion-page">
        <Header />
        <div className="fdp-disc-container">
          <p>Loading comments...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const handleBack = () => navigate(-1);
  const totalComments =
  comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
  //const totalLikes = comments.reduce((acc, c) => acc + (c.likes || 0), 0);

  return (
    <div className="food-discussion-page">
      <Header />
      <LoginPromptModal show={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        show={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, type: "comment", commentId: null, replyId: null, onConfirm: null, isAdminAction: false })}
        onConfirm={deleteModal.onConfirm}
        type={deleteModal.type}
        isAdminAction={deleteModal.isAdminAction}
      />

      <div className="fdp-disc-container">
        <div className="fdp-disc-topbar">
          <button className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
            ← Back to Food Details
          </button>
        </div>

        <div className="fd-card fd-summary">
          <div className="fd-sum-left">
            <div className="fd-sum-thumb">{food?.icon || "🍽️"}</div>
            <div>
              <h2 className="fd-title">{food?.name || "Food Discussion"}</h2>
              <p className="fd-muted">{food?.description}</p>
              <div className="fd-sum-stats">
                <span>💬 {totalComments} comments</span>
                <span 
                  className="fd-food-like-btn"
                  onClick={toggleFoodLike}
                  style={{cursor: 'pointer'}}
                  title={foodLike.isLiked ? "Unlike this food" : "Like this food"}
                >
                  {foodLike.isLiked ? "♥" : "♡"} {foodLike.likesCount} likes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Comment Box */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts…"
            value={newComment}
            onChange={(e) => !isGuest && setNewComment(e.target.value)}
            onClick={() => isGuest && setShowLoginPrompt(true)}
            rows="3"
          />
          <div className="fd-right">
            <button
              className="lrp-btn lrp-btn-primary"
              disabled={!newComment.trim()}
              onClick={postComment}
            >
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i>
              Post Comment
            </button>
          </div>
        </div>

        {/* List Comments */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots" /> Community Comments ({comments.length})
          </h3>
          {comments.length > 0 ? (
            <div className="fd-disc-list">
              {comments.map((c, i) => (
                <React.Fragment key={c.id || c.discussionID ||  `comment-${i}`}>
                  <Comment
                    item={c}
                    onToggleLike={toggleLike}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyTexts={replyTexts}
                    setReplyTexts={setReplyTexts}
                    onPostReply={postReply}
                    onDeleteComment={handleDeleteComment}
                    onDeleteReply={handleDeleteReply}
                    isGuest={isGuest}
                    setShowLoginPrompt={setShowLoginPrompt}
                    currentUserId={userProfileID}
                    isAdmin={isAdmin} // ✅ PASS ADMIN PROP
                  />
                  {i < comments.length - 1 && <hr className="fd-divider" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#888" }}>
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}