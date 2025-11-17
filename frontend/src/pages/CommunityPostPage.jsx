import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoginPromptModal from "../components/LoginPromptModal"; 
import Modal from "../components/Modal";
import '@fortawesome/fontawesome-free/css/all.min.css';

// ------------ Helpers -------------
function computeIsLoggedIn(user) {
  // Consider the user logged in only if:
  // - user exists, AND
  // - has a non-guest role, AND
  // - has a stable id we can use (userID / id / userProfileID)
  if (user?.role === "admin") {
    const hasAdminId = Boolean(user?.userProfileID || user?.userID || user?.id || user?.adminID);
    return Boolean(user && user.role === "admin" && hasAdminId);
  }

  const hasId = Boolean(user?.userID || user?.id || user?.userProfileID);
  const notGuest = user?.role && user.role.toLowerCase() !== "guest";
  return Boolean(user && hasId && notGuest);
}

function getStableProfileId(user) {
  // For admin users, we need to handle the case where userProfileID is null
  if (user?.role === "admin") {
    // Try to get userProfileID from multiple possible sources
    const adminProfileId = user?.userProfileID || user?.userID || user?.id;
    
    console.log("🔍 Admin Profile ID Check:", {
      userProfileID: user?.userProfileID,
      userID: user?.userID,
      id: user?.id,
      finalProfileId: adminProfileId
    });
    
    if (!adminProfileId) {
      console.error("❌ Admin user missing profile ID - this will prevent posting");
      return "admin-fallback"; 
    }
    
    return adminProfileId;
  }
  
  // For regular users
  return user?.userProfileID || user?.userID || user?.id || null;
}

// ------------ Like Button Component -------------
const LikeButton = ({ postId, initialLikes, user, onAlert  }) => {
  const [likes, setLikes] = useState(initialLikes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isLoggedIn = computeIsLoggedIn(user);
  const userProfileID = getStableProfileId(user);

  const openLoginModal = () => setShowLoginModal(true);

  // Check if user already liked this post
  useEffect(() => {
    const checkUserLike = async () => {
      if (!isLoggedIn || !userProfileID) return;
      
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(
          `${API_BASE_URL}/api/likes/check?postId=${postId}`,
          {
            credentials: "include",
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          setIsLiked(result.isLiked || false);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };
    
    checkUserLike();
  }, [postId, isLoggedIn, userProfileID]);

  const handleLike = async () => {
  if (!isLoggedIn || !userProfileID) {
    openLoginModal();
    return;
  }

  if (loading) return;

  try {
    setLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    
    if (isLiked) {
      // Unlike the post 
      const response = await fetch(`${API_BASE_URL}/api/likes/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          postID: postId, 
          //userProfileID: userProfileID,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setIsLiked(false);
        // Update like count locally
        setLikes(prev => prev - 1);
      } else {
        throw new Error(result.message || "Failed to unlike post");
      }
    } else {
      // Like the post 
      const response = await fetch(`${API_BASE_URL}/api/likes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          postID: postId, 
          //userProfileID: userProfileID,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setIsLiked(true);
        // Update like count locally
        setLikes(prev => prev + 1);
      } else {
        throw new Error(result.message || "Failed to like post");
      }
    }
  } catch (error) {
    console.error("Error updating like:", error);
    onAlert?.("Error Updating Like", "We couldn't update your like. Please try again.", null, <i className="fas fa-triangle-exclamation"></i>);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      {showLoginModal && (
        <LoginPromptModal onClose={() => setShowLoginModal(false)} />
      )}
      
      <div 
        className={`likes-bar ${isLiked ? 'liked' : ''} ${loading ? 'loading' : ''}`}
        onClick={handleLike}
      >
        <span className="heart-icon">
          {isLiked ? "♥" : "♡"}
        </span>
        <span className="likes-count">{likes} {likes === 1 ? 'like' : 'likes'}</span>
      </div>
    </>
  );
};

// ------------ Comment Section -------------
const CommentSection = ({ postId, user, comments, onCommentAdded, onCommentDeleted, onAlert }) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const isLoggedIn = computeIsLoggedIn(user);
  const isGuest = !isLoggedIn; // single source of truth
  const currentUserProfileID = getStableProfileId(user);
  const isAdmin = user?.role === "admin";

  const openLoginModal = () => setShowLoginModal(true);

  const isCommentAuthor = (commentUserProfileID) => {
    if (!currentUserProfileID || !commentUserProfileID) return false;
    return parseInt(currentUserProfileID) === parseInt(commentUserProfileID);
  };

  const canDeleteComment = (commentUserProfileID) => {
    if (!currentUserProfileID) return false;
    
    // Convert both to numbers for consistent comparison
    const currentUserIdNum = parseInt(currentUserProfileID);
    const commentUserIdNum = parseInt(commentUserProfileID);
    
    const isOwner = currentUserIdNum === commentUserIdNum;
    const canDelete = isOwner || isAdmin;
    
    console.log('🔍 Delete Permission Check:', {
      currentUserId: currentUserIdNum,
      commentUserId: commentUserIdNum,
      isOwner,
      isAdmin,
      canDelete
    });
    
    return canDelete;
  };

  // Open delete confirmation modal
  const openDeleteModal = (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    const isAdminAction = isAdmin && !isCommentAuthor(comment?.userProfileID);
    
    setCommentToDelete({ 
      id: commentId, 
      isAdminAction 
    });
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  // Confirm and delete comment
  const confirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      setDeletingCommentId(commentToDelete.id);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
       const requestBody = {
        userProfileID: currentUserProfileID,
        isAdmin: commentToDelete.isAdminAction // Send admin flag to backend
      };

      console.log('🗑️ Deleting comment request:', {
        commentId: commentToDelete.id,
        userProfileID: currentUserProfileID,
        isAdmin: commentToDelete.isAdminAction
      });
      
      const response = await fetch(`${API_BASE_URL}/api/communityPost/comments/${commentToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        onCommentDeleted(commentToDelete.id);
      } else {
        onAlert?.("Delete Failed", result.message || "Failed to delete comment", null, <i className="fas fa-times-circle"></i>);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      onAlert?.("Delete Error", "An unexpected error occurred while deleting the comment.", null, <i className="fas fa-triangle-exclamation"></i>);
    } finally {
      setDeletingCommentId(null);
      closeDeleteModal();
    }
  };

  // Block typing & show modal when guest interacts with the box
  const trapGuestFocus = (e) => {
    if (isGuest) {
      e.preventDefault();
      e.stopPropagation();
      if (e.target && typeof e.target.blur === "function") e.target.blur();
      openLoginModal();
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (isGuest) {
    openLoginModal();
    return;
  }
  if (!comment.trim()) return;

  try {
    setLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    console.log("📤 Sending comment:", { 
      content: comment, 
      postId 
    });

    const response = await fetch(`${API_BASE_URL}/api/communityPost/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        content: comment,
        postId: postId,
      }),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Server error response:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `Failed to post comment (${response.status})`);
      } catch (e) {
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log("✅ Comment result:", result);
    
    if (result.success && result.comment) {
      onCommentAdded(result.comment);
      setComment("");
      onAlert?.("Comment Posted", "Your comment has been posted.", null, <i className="fas fa-check-circle"></i>);
    } else {
      throw new Error(result.message || "Failed to post comment");
    }
  } catch (err) {
    console.error("Error posting comment:", err);
    onAlert?.("Post Failed", err.message || "Failed to post comment. Please try again.", null, <i className="fas fa-times-circle"></i>);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="comment-section">
      {/* Login Modal */}
      {showLoginModal && (
        <LoginPromptModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-card-header">
              <h3>
                {isAdmin && commentToDelete && 
                !isCommentAuthor(comments.find(c => c.id === commentToDelete)?.userProfileID) 
                  ? "Delete Comment (Admin)" 
                  : "Delete Comment"
                }
              </h3>
              {commentToDelete?.isAdminAction && (
                <div className="admin-delete-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
              )}
            </div>
            <div className="modal-card-body">
              <p>
                {isAdmin && commentToDelete && 
                !isCommentAuthor(comments.find(c => c.id === commentToDelete)?.userProfileID)
                  ? "You are deleting this comment as an administrator. This action cannot be undone."
                  : "Are you sure you want to delete this comment? This action cannot be undone."
                }
              </p>
            </div>
            <div className="modal-card-actions">
              <button className="lrp-btn lrp-btn-outline" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button 
                className={`lrp-btn ${commentToDelete?.isAdminAction ? 'lrp-btn-warning' : 'lrp-btn-danger'}`}  
                onClick={confirmDelete}
                disabled={deletingCommentId}
              >
                {deletingCommentId ? "Deleting..." : (commentToDelete?.isAdminAction ? "Delete as Admin" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="comment-form" onSubmit={handleSubmit} noValidate>
        <textarea
          className="comment-input"
          rows="3"
          placeholder={
            isGuest ? "Please log in to comment" : "Add a comment..."
          }
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          readOnly={isGuest}
          onMouseDown={trapGuestFocus}
          onFocus={trapGuestFocus}
        />

        <button
          type="submit"
          className="comment-btn"
          onMouseDown={(e) => {
            if (isGuest) {
              e.preventDefault();
              openLoginModal();
            }
          }}
          onClick={(e) => {
            if (isGuest) {
              e.preventDefault();
              openLoginModal();
            }
          }}
          disabled={loading || (!comment.trim() && !isGuest)}
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>
            No comments yet.
          </p>
        ) : (
          comments.map((c) => {
            const canDelete = canDeleteComment(c.userProfileID);
            const isOwner = isCommentAuthor(c.userProfileID);
            const isAdminAction = canDelete && !isOwner && isAdmin;
            
            console.log('🟢 Comment Display:', {
              commentId: c.id,
              commentUserProfileID: c.userProfileID,
              currentUserProfileID: currentUserProfileID,
              canDelete,
              isOwner,
              isAdmin,
              isAdminAction
            });

            return (
            <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">
                    {c.username || c.author || 'Unknown User'}
                    {isAdmin && !isOwner && (
                      <span style={{color: '#8B4513', marginLeft: '5px', fontSize: '0.8em'}}>
                      </span>
                    )}
                  </span>
                  <span className="comment-date">{c.daysAgo}</span>
                  
                  {/* ✅ UPDATED: Delete Button - Show for owners AND admins */}
                  {canDelete && (
                    <button
                      className={`fd-delete-btn ${isAdminAction ? 'fd-admin-delete-btn' : ''}`}
                      onClick={() => openDeleteModal(c.id)}
                      disabled={deletingCommentId === c.id}
                      title={isAdminAction ? "Delete comment (Admin)" : "Delete comment"}
                    >
                      {deletingCommentId === c.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash-alt"></i>
                      )}
                    </button>
                  )}
                </div>
                <div className="comment-content">{c.text}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ------------ Main Page -------------
export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dlg, setDlg] = useState({ open:false, title:"", message:"", primaryText:"OK", onPrimary:null, icon:null });
  const closeDlg = () => setDlg(m => ({ ...m, open:false, onPrimary:null }));
  const openAlert = (title, message, onPrimary, icon=null) =>
    setDlg({
      open: true,
      title,
      message,
      primaryText: "OK",
      onPrimary: () => { try { onPrimary?.(); } finally { closeDlg(); } }
    });

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/communityPost/${id}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setPost(result.data);
        setComments(result.data.comments || []);
      } else {
        throw new Error(result.message || "Failed to load post");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewComment = (newComment) => {
    setComments((prev) => {
      if (prev.some((c) => c.id === newComment.id)) return prev;
      return [...prev, newComment];
    });
  };

  const handleCommentDeleted = (deletedCommentId) => {
  setComments(prev => prev.filter(comment => comment.id !== deletedCommentId));
  };

  if (loading) {
    return (
      <div className="community-page">
        <Header />
        <div className="loading">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-page">
        <Header />
        <div className="error">
          <h2>Error loading post</h2>
          <p>{error}</p>
          <button onClick={fetchPost}>Try Again</button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="community-page">
        <Header />
        <div className="not-found">
          <h2>Post not found</h2>
          <button onClick={() => navigate("/community")}>
            Back to Community
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="community-page">
      <Header />
      <div className="post-layout">
        {/* LEFT */}
        <div className="post-left">
          <div className="image-carousel">
            <img
              src={
                post.images?.length
                  ? post.images[currentImg]
                  : "https://images.unsplash.com/photo-1551218808-94e220e084d2"
              }
              alt={post.foodName}
              className="post-img-small"
            />
            {post.images?.length > 1 && (
              <>
                <button
                  className="arrow left"
                  onClick={() =>
                    setCurrentImg((prev) =>
                      prev === 0 ? post.images.length - 1 : prev - 1
                    )
                  }
                >
                  ◀
                </button>
                <button
                  className="arrow right"
                  onClick={() =>
                    setCurrentImg((prev) =>
                      prev === post.images.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  ▶
                </button>
              </>
            )}
          </div>

          <div className="post-info">
            <h1>{post.foodName}</h1>
            <p className="meta">
              by <b>{post.author}</b> • {post.daysAgo} •{" "}
              <span>{post.culturalOrigin}</span>
            </p>

            <div className="story-section">
              <h3>Cultural Story</h3>
              <p>{post.culturalStory}</p>
            </div>

            {post.recipe && (
              <div className="recipe-box">
                <h3>Recipe</h3>
                {post.recipe.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            <button className="back-btn" onClick={() => navigate("/community")}>
              ← Back
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="post-right">
          {/* Updated to use clickable LikeButton component */}
          <LikeButton 
            postId={post.id} 
            initialLikes={post.likeCount || 0} 
            user={user} 
            onAlert={openAlert}
          />
          <h3>Comments ({comments.length})</h3>

          <CommentSection
            postId={post.id}
            user={user}
            comments={comments}
            onCommentAdded={handleNewComment}
            onCommentDeleted={handleCommentDeleted}
            onAlert={openAlert}
          />
        </div>
      </div>
      <Modal
        open={dlg.open}
        title={dlg.title}
        icon={dlg.icon}
        primaryText={dlg.primaryText}
        onPrimary={dlg.onPrimary || closeDlg}
        onClose={closeDlg}
      >
        {dlg.message}
      </Modal>

      <Footer />
    </div>
  );
}