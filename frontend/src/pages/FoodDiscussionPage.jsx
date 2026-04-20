// ✅ src/pages/FoodDiscussionPage.jsx 
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css";
import "../css/lrp.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {CheckCircle2, AlertTriangle} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import LoginPromptModal from "../components/LoginPromptModal";
import { getTierById } from "../utils/gamificationTiers";
import { useTranslation } from "react-i18next";
import { translateTexts } from "../hooks/useAITranslation";

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ show, onClose, onConfirm, type = "comment", isAdminAction = false }) => {
  const { t } = useTranslation(); 
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-card-header">
          <h3>
            {isAdminAction ? t("foodDiscussion.adminDelete") : t("foodDiscussion.delete")}
            {type === "reply" ? t("foodDiscussion.reply") : t("foodDiscussion.comment")}
          </h3>
          {isAdminAction && (
            <div className="admin-delete-warning">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{t("foodDiscussion.adminDeleteWarning")}</span>
            </div>
          )}
        </div>
        <div className="modal-card-body">
          <p>
            {isAdminAction 
              ? t("foodDiscussion.confirmDeleteAdmin", { type: t(`foodDiscussion.${type}`) })
              : t("foodDiscussion.confirmDelete", { type: t(`foodDiscussion.${type}`) })
            }
          </p>
        </div>
        <div className="modal-card-actions">
          <button className="lrp-btn lrp-btn-outline" onClick={onClose}>
            {t("foodDiscussion.cancel")}
          </button>
          <button className="lrp-btn lrp-btn-danger" onClick={onConfirm}>
            {t("foodDiscussion.delete")}
          </button>
        </div>
      </div>
    </div>
  );
};

// Format "time ago"
function getTimeAgo(timestamp, lang = "en") {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = Math.floor((now - past) / 1000);
  
  if (diff >= 172800) return formatToDate(timestamp, lang);
  
  if (lang === "ms") {
    if (diff < 60) return "baru sahaja";
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}h lalu`;
    return `${Math.floor(diff / 2592000)}bln lalu`;
  }

  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function formatToDate(timestamp, lang = "en") {
  const date = new Date(timestamp);

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesMs = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const monthNames = lang === "ms" ? monthNamesMs : monthNamesEn;
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// Single Comment Component
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
  onProfileClick
}) {
  const itemId = isReply ? (item.replyID || item.id) : (item.id || item.discussionID);
  const username = item.username || item.user || item.author || 'Unknown User';
  const avatar = item.avatar;
  const content = item.content || item.reply || "No content";
  const timestamp = item.timestamp || item.createdAt;
  const likes = isReply ? 0 : item.likes || item.upVotes || 0;
  const userLiked = item.user_liked || false;

  const commentIsAdmin = item.isAdmin || item.userRole === 'admin';
  
  // Enhanced user ID extraction 
  const commentUserId = item.userProfileID || item.userID || item.authorID || item.user_id;
  const isOwner = currentUserId && commentUserId && currentUserId.toString() === commentUserId.toString();
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
      <div 
        className="fd-disc-avatar"
        onClick={() => onProfileClick && onProfileClick(commentUserId)}
        style={{ cursor: "pointer" }}
        title={`View ${username}'s profile`}
      >
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
          <span 
            className="fd-disc-user"
            onClick={() => onProfileClick && onProfileClick(commentUserId)}
            style={{ cursor: "pointer", textDecoration: "underline transparent", transition: "text-decoration 0.2s" }}
            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.target.style.textDecoration = "underline transparent"}
            title={`View ${username}'s profile`}
          >
            {username}

            {item.equippedBadge && item.equippedBadge !== 'null' && (
              <span className="user-badge-inline">
                {getTierById(item.equippedBadge).icon}
                <span className="badge-tooltip-mini" style={{ color: getTierById(item.equippedBadge).color }}>
                  {getTierById(item.equippedBadge).title}
                </span>
              </span>
              )}
            {item.contributorBadgeType && (
              <span className="user-badge-inline">
                {getTierById(item.contributorBadgeType).icon}
                <span className="badge-tooltip-mini" style={{ color: getTierById(item.contributorBadgeType).color }}>
                  {getTierById(item.contributorBadgeType).title} — {item.contributorBadgeMonth}
                </span>
              </span>
            )}
          </span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp, i18n.language)}</span>
          
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
              ↩ {t("foodDiscussion.reply")}
            </button>
          </div>
        )}

        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder={t("foodDiscussion.writeReply")}
              value={replyTexts[itemId] || ""}
              onChange={handleReplyChange}
              rows="2"
            />
            <div className="fd-reply-actions">
              <button className="lrp-btn lrp-btn-primary" disabled={!replyTexts[itemId]?.trim()} onClick={handlePostReply}>
               {t("foodDiscussion.sendReply")}
              </button>
              <button className="lrp-btn lrp-btn-outline" onClick={() => setReplyToId(null)}>
                {t("foodDiscussion.cancel")}
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
                  onProfileClick={onProfileClick}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
});

// Main Component
export default function FoodDiscussionPage() {
  const { user } = useAuth();
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [userProfileID, setUserProfileID] = useState(null);

  // to get userProfileID from userID
  const getUserProfileID = async () => {
    try {
      const res = await fetch(`${API}/api/foodDiscussion/get-user-profile`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data.userProfileID;
        }
      }
    } catch (error) {
      console.error('Error fetching userProfileID:', error);
    }
    return null;
  };

  const isGuest = !user || user.role === "guest";
  const actualUserID = userProfileID;
  
//CSRF
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrfToken();
  }, []);
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";

  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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

  const [infoDlg, setInfoDlg] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "OK",
  });

  const openInfo = ({ title, message, icon, primaryText = "OK" }) =>
    setInfoDlg({ open: true, title, message, icon, primaryText });

  const closeInfo = () => setInfoDlg((d) => ({ ...d, open: false}));

  //FoodDiscussionPage clickable Profile
  const handleProfileClick = (commentUserProfileID) => {
    const currentUID = userProfileID || user?.userProfileID || user?.userID || user?.id;
    if (currentUID && String(currentUID) === String(commentUserProfileID)) {
      navigate("/profile"); 
    } else if (commentUserProfileID) {
      navigate(`/profile/${commentUserProfileID}`); 
    }
  };

  useEffect(() => {
    if (user?.userID && !userProfileID) {
      getUserProfileID().then(profileID => {
        setUserProfileID(profileID);
        console.log('🟢 Fetched userProfileID:', profileID);
      });
    }
  }, [user?.userID, userProfileID]);

  useEffect(() => {
  if (foodId && userProfileID) { 
    fetchComments();
    fetchFoodLikeStatus(); 
  }
}, [foodId, userProfileID]); 

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

  // Fetch comments
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

// ✅ Load likes from localStorage on component mount - USER-SPECIFIC
const loadLikesFromStorage = () => {
  if (!userProfileID) {
    console.log('🟡 userProfileID not available yet');
    return null;
  }
  
  try {
    const userSpecificKey = `foodLikes_${foodId}_${userProfileID}`;
    const storedLikes = localStorage.getItem(userSpecificKey);
    if (storedLikes) {
      return JSON.parse(storedLikes);
    }
  } catch (error) {
    console.warn('Failed to load likes from localStorage:', error);
  }
  return null;
};

// Fetch food like status 
const fetchFoodLikeStatus = async () => {
  console.log('🟡 fetchFoodLikeStatus called - userProfileID:', userProfileID);
  try {
    const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}/like-status`, {
      credentials: "include",
    });

    console.log('🟡 fetchFoodLikeStatus - Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('🟡 fetchFoodLikeStatus - Response data:', data);
      
      if (data.success) {
        const serverLikeData = {
          isLiked: data.data.isLiked,
          likesCount: data.data.likesCount,
          loading: false
        };
        
        setFoodLike(prev => ({
          ...prev,
          ...serverLikeData,
          initialized: true
        }));
        
        // ✅ Sync localStorage with server data - USER-SPECIFIC
        try {
          if (userProfileID) { // ✅ Check if userProfileID exists
            const userSpecificKey = `foodLikes_${foodId}_${userProfileID}`;
            localStorage.setItem(userSpecificKey, JSON.stringify({
              ...serverLikeData,
              lastUpdated: new Date().toISOString(),
              syncedWithServer: true
            }));
          }
        } catch (storageError) {
          console.warn('Failed to sync server likes to localStorage:', storageError);
        }
        
        console.log('🟢 fetchFoodLikeStatus - Updated state:', serverLikeData);
      }
    } else {
      const errorText = await res.text();
      console.log('🔴 fetchFoodLikeStatus - API error details:', errorText);
    }
  } catch (error) {
    console.error('❌ fetchFoodLikeStatus - Network error:', error);
  }
};

// ✅ Toggle food like - USER-SPECIFIC STORAGE
const toggleFoodLike = async () => {
  if (isGuest) return setShowLoginPrompt(true);
  
  if (foodLike.loading) return;

  console.log('🟡 BEFORE toggle - isLiked:', foodLike.isLiked, 'likesCount:', foodLike.likesCount);

  // Optimistic update
  const previousState = { ...foodLike };
  const newIsLiked = !foodLike.isLiked;
  const newLikesCount = newIsLiked ? foodLike.likesCount + 1 : foodLike.likesCount - 1;

  // ✅ IMMEDIATELY update state AND localStorage
  setFoodLike(prev => ({
    ...prev,
    isLiked: !prev.isLiked,
    likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
    loading: true
  }));

  // ✅ Save to localStorage immediately 
  try {
    const userSpecificKey = `foodLikes_${foodId}_${userProfileID}`;
    localStorage.setItem(userSpecificKey, JSON.stringify({
      isLiked: newIsLiked,
      likesCount: newLikesCount, // This is just for this user's view
      lastUpdated: new Date().toISOString()
    }));
  } catch (storageError) {
    console.warn('Failed to save likes to localStorage:', storageError);
  }

  try {
    console.log('🟡 Calling toggle-like API for food:', foodId);
    const res = await fetch(`${API}/api/foodDiscussion/food/${foodId}/toggle-like`, {
      method: "POST",
      headers: { "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
       },
      credentials: "include",
    });

    console.log('🟡 API Response status:', res.status);
    const data = await res.json();
    console.log('🟡 API Response data:', data);

    if (res.ok && data.success) {
      console.log('🟢 API Success - isLiked:', data.data.isLiked, 'likesCount:', data.data.likesCount);
      
      // ✅ Update both state and localStorage with server response
      setFoodLike(prev => ({
        ...prev,
        isLiked: data.data.isLiked,
        likesCount: data.data.likesCount, // Use server's count
        loading: false
      }));

      // ✅ Sync localStorage with server data - USER-SPECIFIC
      try {
        const userSpecificKey = `foodLikes_${foodId}_${userProfileID}`;
        localStorage.setItem(userSpecificKey, JSON.stringify({
          isLiked: data.data.isLiked,
          likesCount: data.data.likesCount,
          lastUpdated: new Date().toISOString(),
          syncedWithServer: true
        }));
      } catch (storageError) {
        console.warn('Failed to sync likes with localStorage:', storageError);
      }
    } else {
      console.log('🔴 API Error:', data.message);
      // Revert on error
      setFoodLike(prev => ({
        ...prev,
        ...previousState,
        loading: false
      }));
      
      // ✅ Also revert localStorage on error - USER-SPECIFIC
      try {
        const userSpecificKey = `foodLikes_${foodId}_${userProfileID}`;
        localStorage.setItem(userSpecificKey, JSON.stringify(previousState));
      } catch (storageError) {
        console.warn('Failed to revert likes in localStorage:', storageError);
      }
      
      openInfo({
        title: "Couldn't update like",
        message: data?.message || "Please try again",
        icon: <AlertTriangle />,
      });
    }
  } catch (err) {
    console.error("❌ Network error:", err);
    // Revert on error
    setFoodLike(prev => ({
      ...prev,
      ...previousState,
      loading: false
    }));
    
    // ✅ Also revert localStorage on network error - USER-SPECIFIC
    try {
      const userSpecificKey = `foodLikes_${foodId}_${userProfileID}`;
      localStorage.setItem(userSpecificKey, JSON.stringify(previousState));
    } catch (storageError) {
      console.warn('Failed to revert likes in localStorage:', storageError);
    }
    
    openInfo({
      title: "Network Error",
      message: "We couldn't update your like. Please check your connection",
      icon: <AlertTriangle />,
    });
  }
};

    useEffect(() => {
      if (foodId) {
        fetchComments();
        fetchFoodLikeStatus(); 
      }
    }, [foodId]);

    // ✅ Post Comment
    const postComment = async () => {
      if (isGuest) return setShowLoginPrompt(true);
      if (!newComment.trim()) return;

      const actualUserProfileID = userProfileID;

      const actualFoodID = foodId;

      console.log("🚨 CRITICAL DEBUG - User data:", {
      userID: user?.userID,
      userProfileID: user?.userProfileID,
      actualUserProfileID: actualUserProfileID,
      role: user?.role,
      fullUserObject: user
    });
      
      if (!actualUserProfileID) {
        openInfo({
          title: "Failed to post comment",
          message: "Admin account needs a userProfileID to post comments. Please contact support.",
          icon: <AlertTriangle />,
        });
        return;
      }

      if (!actualFoodID) {
        openInfo({
          title: "Food ID not found",
          message: "Please go back and try again",
          icon: <AlertTriangle />,
        });
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
        headers: { "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
         },
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
        openInfo({
          title: "Comment posted",
          message: "Your comment is visibile now.",
          icon: <CheckCircle2 />,
        });
      } else {
        setComments((prev) => prev.filter(comment => 
          comment.id !== tempComment.id || !comment.isTemp
        ));
        openInfo({
          title: "Failed to post reply",
          message: data?.message || "Please try again",
          icon: <AlertTriangle />,
        });
      }
    } catch (err) {
      setComments((prev) => prev.filter(comment => 
        comment.id !== tempComment.id || !comment.isTemp
      ));
      console.error("Error posting comment:", err);
      openInfo({
        title: "Server error",
        message: "We couldn't post your comment. Try again later",
        icon: <AlertTriangle />,
      });
    }
  };

  // ✅ Post Reply
const postReply = async (discussionId) => {
  if (isGuest) return setShowLoginPrompt(true);
  const text = replyTexts[discussionId]?.trim();
  if (!text) return;

  const actualUserProfileID = userProfileID;

  console.log("FRONTEND - postReply called:", {
    discussionId,
    actualUserProfileID,
    userRole: user?.role
  });

  if (!actualUserProfileID) {
    openInfo({
      title: "User profile ID not found",
      message: "Please log in again",
      icon: <AlertTriangle />,
    });
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
      headers: { "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
       },
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
      openInfo({
        title: "Reply posted",
        message: "Your reply is visible now.",
        icon: <CheckCircle2 />,
      });
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
      openInfo({
        title: "Failed to post reply",
        message: data?.message || "We couldn't post your reply. Please try again later.",
        icon: <AlertTriangle />,
      });
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
    openInfo({
      title: "Server error",
      message: "We couldn't post your reply. Please try again later.",
      icon: <AlertTriangle />,
    });
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
        headers: { "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
         },
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
        openInfo({
          title: "Failed to update like",
          message: data?.message || "Please try again",
          icon: <AlertTriangle />,
        });
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
      openInfo({
        title: "Network error",
        message: "We couldn't update your like. Please try again later",
        icon: <AlertTriangle />,
      });
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
        headers: { "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
         },
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
        openInfo({
          title: "Failed to delete comment",
          message: data?.message || "We couldn't delete this comment. Please try again later.",
          icon: <AlertTriangle />,
        });
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      openInfo({
        title: "Server error",
        message: "We couldn't delete this comment. Please try again later.",
        icon: <AlertTriangle />,
      });
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

      console.log('🔍 FRONTEND - DELETE REQUEST DETAILS:');
      console.log('URL:', `${API}/api/foodDiscussion/${commentId}/replies/${replyId}`);
      console.log('User role:', user?.role);
      console.log('isAdminAction:', isAdminAction);
      console.log('Request body:', requestBody);

      const res = await fetch(`${API}/api/foodDiscussion/${commentId}/replies/${replyId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken  
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 FRONTEND - RESPONSE:');
      console.log('Status:', res.status);
      console.log('Status Text:', res.statusText);

      const responseText = await res.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        data = { message: 'Invalid server response' };
      }
      
      console.log('Parsed response data:', data);

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
        openInfo({
          title: "Failed to delete reply",
          message: data?.message || "We couldn't delete this reply. Please try again later.",
          icon: <AlertTriangle />,
        });
      }
    } catch (err) {
      console.error("Error deleting reply:", err);
      openInfo({
        title: "Server error",
        message: "We couldn't delete this reply. Please try again later.",
        icon: <AlertTriangle />,
      });
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
            ← {t("foodDiscussion.back")}
          </button>
        </div>

        <div className="fd-card-2 fd-summary">
          {/* Hero Image */}
          <div className="fd-hero">
            <img 
              src={food?.image}
              alt={food?.name}
              className="fd-hero-img"
            />
            <div className="fd-hero-title">
              {translatedFood.name || food?.name || "Food Discussion"}
            </div>
          </div>

          {/* Description */}
          <div className="fd-summary-content">
            <p className="fd-muted">{translatedFood.description || food?.description}</p>

            {/* Stats */}
            <div className="fd-sum-stats">
              💬 {totalComments} {t("foodDiscussion.comments")}
              <span 
                className={`fd-food-like-btn ${foodLike.isLiked ? 'liked' : ''}`}
                onClick={toggleFoodLike}
                style={{
                  cursor: foodLike.loading ? 'not-allowed' : 'pointer',
                  opacity: foodLike.loading ? 0.6 : 1
                }}
                title={foodLike.isLiked ? "Unlike this food" : "Like this food"}
              >
                {foodLike.loading ? '⏳' : (foodLike.isLiked ? "♥" : "♡")} {foodLike.likesCount} likes
              </span>
            </div>
          </div>
        </div>


        {/* Add Comment Box */}
        <div className="fd-card">
          <h3 className="fd-section-title">{t("foodDiscussion.addComment")}</h3>
          <textarea
            className="fd-input"
            placeholder={t("foodDiscussion.sharePlaceholder")}
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
              <i className="fas fa-paper-plane fdp-post-btn"></i>
              {t("foodDiscussion.postComment")}
            </button>
          </div>
        </div>

        {/* List Comments */}
        <div className="fd-card">
          <h3 className="fd-section-title">
            <i className="fas fa-comment-dots" /> {t("foodDiscussion.communityComments", { count: comments.length })}
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
                    currentUserId={actualUserID}
                    isAdmin={isAdmin} // ✅ PASS ADMIN PROP
                    onProfileClick={handleProfileClick}
                  />
                  {i < comments.length - 1 && <hr className="fd-divider" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className = "fdp-no-cmt">
              {t("foodDiscussion.noComments2")}
            </p>
          )}
        </div>
      </div>

      <Modal
        open = {infoDlg.open}
        title = {infoDlg.title}
        icon = {infoDlg.icon}
        primaryText = {infoDlg.primaryText}
        onPrimary = {closeInfo}
        onClose = {closeInfo}
      >
        {infoDlg.message}
      </Modal>

      <Footer />
    </div>
  );
}