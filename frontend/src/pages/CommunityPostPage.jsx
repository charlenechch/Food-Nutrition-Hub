/* src/pages/CommunityPostPage.jsx */
import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../css/Community.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoginPromptModal from "../components/LoginPromptModal";
import Modal from "../components/Modal";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useTranslation } from "react-i18next";
import { getTierById } from "../utils/gamificationTiers";

function computeIsLoggedIn(user) {
  if (user?.role === "admin") {
    const hasAdminId = Boolean(user?.userProfileID || user?.userID || user?.id || user?.adminID);
    return Boolean(user && user.role === "admin" && hasAdminId);
  }
  const hasId = Boolean(user?.userID || user?.id || user?.userProfileID);
  const notGuest = user?.role && user.role.toLowerCase() !== "guest";
  return Boolean(user && hasId && notGuest);
}

function getStableProfileId(user) {
  if (user?.role === "admin") return user?.userProfileID || user?.userID || user?.id || "admin-fallback";
  return user?.userProfileID || user?.userID || user?.id || null;
}

const formatTextForDisplay = (text) => {
  if (!text) return '';
  let cleanedText = text.replace(/\\t/g, ' ').replace(/\t/g, ' ').replace(/\\n/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
  const lines = cleanedText.split('\n').filter(line => line.trim());
  let html = ''; let inList = false;
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const boldMatch = trimmedLine.match(/\*\*(.*?)\*\*/);
    if (boldMatch) { html += `<div class="rdp-section-header">${boldMatch[1]}</div>`; inList = false; return; }
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.*)/);
    if (numberedMatch) { html += `<div class="rdp-step"><span class="rdp-step-number">${numberedMatch[1]}.</span><span class="rdp-step-text">${numberedMatch[2]}</span></div>`; inList = false; return; }
    const bulletMatch = trimmedLine.match(/^[-•*]\s+(.*)/);
    if (bulletMatch) { html += `<div class="rdp-bullet-item">${bulletMatch[1]}</div>`; inList = true; return; }
    if (trimmedLine.endsWith(':') && !trimmedLine.match(/^\d/)) { html += `<div class="rdp-section-header">${trimmedLine}</div>`; inList = false; return; }
    if (trimmedLine) { if (inList && !trimmedLine.match(/^[-•*]/)) inList = false; html += `<div class="rdp-text-line">${trimmedLine}</div>`; }
  });
  return html;
};

const LikeButton = ({ postId, initialLikes, user, onAlert }) => {
  const { t } = useTranslation();
  const [likes, setLikes] = useState(initialLikes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isLoggedIn = computeIsLoggedIn(user);
  const userProfileID = getStableProfileId(user);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) { console.error("Failed to fetch CSRF token", err); }
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    const checkUserLike = async () => {
      if (!isLoggedIn || !userProfileID) return;
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${API_BASE_URL}/api/likes/check?postId=${postId}`, { credentials: "include" });
        if (response.ok) { const result = await response.json(); setIsLiked(result.isLiked || false); }
      } catch (error) { console.error("Error checking like status:", error); }
    };
    checkUserLike();
  }, [postId, isLoggedIn, userProfileID]);

  const handleLike = async () => {
    if (!isLoggedIn || !userProfileID) { setShowLoginModal(true); return; }
    if (loading) return;
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/likes/`, {
        method: isLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ postID: postId }),
      });
      const result = await response.json();
      if (response.ok && result.success) { setIsLiked(!isLiked); setLikes(prev => isLiked ? prev - 1 : prev + 1); }
    } catch (error) { console.error("Error updating like:", error); } finally { setLoading(false); }
  };

  return (
    <>
      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}
      <div className={`likes-bar ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
        <span className="heart-icon">{isLiked ? "♥" : "♡"}</span>
        <span className="likes-count">{likes} {likes === 1 ? t("communityPost.like") : t("communityPost.likes")}</span>
      </div>
    </>
  );
};

// ==========================================
// UPDATED COMMENT SECTION COMPONENT
// ==========================================
const CommentSection = ({ postId, user, comments, onCommentAdded, onCommentDeleted, onAlert }) => {
  const { t } = useTranslation();
  const navigate = useNavigate(); 
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const isLoggedIn = computeIsLoggedIn(user);
  const isGuest = !isLoggedIn;
  const currentUserProfileID = getStableProfileId(user);
  const isAdmin = user?.role === "admin";
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, { credentials: "include" });
        const data = await res.json(); setCsrfToken(data.csrfToken);
      } catch (err) { console.error(err); }
    };
    fetchCsrfToken();
  }, []);

  const isCommentAuthor = (id) => currentUserProfileID && id && parseInt(currentUserProfileID) === parseInt(id);
  const canDeleteComment = (id) => currentUserProfileID && (parseInt(currentUserProfileID) === parseInt(id) || isAdmin);
  
  const openDeleteModal = (commentId) => {
    const c = comments.find(c => c.id === commentId);
    setCommentToDelete({ id: commentId, isAdminAction: isAdmin && !isCommentAuthor(c?.userProfileID) });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      setDeletingCommentId(commentToDelete.id);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/communityPost/comments/${commentToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', "X-CSRF-Token": csrfToken },
        credentials: 'include',
        body: JSON.stringify({ userProfileID: currentUserProfileID, isAdmin: commentToDelete.isAdminAction }),
      });
      const result = await response.json();
      if (response.ok && result.success) onCommentDeleted(commentToDelete.id);
    } catch (error) { console.error('Error deleting comment:', error); }
    finally { setDeletingCommentId(null); setShowDeleteModal(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) { setShowLoginModal(true); return; }
    if (!comment.trim()) return;
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/communityPost/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ content: comment, postId }),
      });
      const result = await response.json();
      if (result.success && result.comment) { onCommentAdded(result.comment); setComment(""); }
    } catch (err) { console.error("Error posting comment:", err); }
    finally { setLoading(false); }
  };

  const handleCommenterProfileClick = (commentUserProfileID) => {
    if (currentUserProfileID && String(currentUserProfileID) === String(commentUserProfileID)) {
      navigate("/profile"); 
    } else if (commentUserProfileID) {
      navigate(`/profile/${commentUserProfileID}`); 
    }
  };

  return (
    <div className="comment-section">
      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}
      {showDeleteModal && (
        <div className="lrp-modal-backdrop">
          <div className="lrp-modal">
            <div className="lrp-modal-header">
              <h3 className="lrp-modal-title">{t("communityPost.deleteComment")}</h3>
            </div>
            <div className="lrp-modal-body">
              <p>{t("communityPost.deleteWarning")}</p>
            </div>
            <div className="lrp-modal-actions lrp-modal-actions--center">
              <button className="lrp-btn lrp-btn-outline" onClick={() => setShowDeleteModal(false)}>{t("communityPost.cancel")}</button>
              <button className="lrp-btn lrp-btn-danger" onClick={confirmDelete} disabled={deletingCommentId}>{t("communityPost.delete")}</button>
            </div>
          </div>
        </div>
      )}
      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          className="comment-input" rows="3"
          placeholder={isGuest ? t("communityPost.loginToComment") : t("communityPost.addComment")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          readOnly={isGuest}
          onClick={() => isGuest && setShowLoginModal(true)}
        />
        <button type="submit" className="comment-btn" disabled={loading || (!comment.trim() && !isGuest)}>
          {loading ? t("communityPost.posting") : t("communityPost.postComment")}
        </button>
      </form>
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="comments-empty">{t("communityPost.noComments")}</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              {/* ✅ UPDATED: Avatar for Comments */}
              <div 
                className="comment-avatar-small"
                onClick={() => handleCommenterProfileClick(c.userProfileID)}
                style={{ cursor: "pointer", overflow: "hidden" }}
                title={`View ${c.username || c.author}'s profile`}
              >
                <img 
                  src={c.userProfilePic || `https://ui-avatars.com/api/?name=${c.username || c.author || "User"}&background=8b5e3c&color=fff&rounded=true`} 
                  alt={c.username || c.author || "User"} 
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = `https://ui-avatars.com/api/?name=${c.username || c.author || "User"}&background=8b5e3c&color=fff&rounded=true`;
                  }}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
              
              <div className="comment-body">
                <div className="comment-header-row">
                  <span 
                    className="comment-author-name"
                    onClick={() => handleCommenterProfileClick(c.userProfileID)}
                    style={{ cursor: "pointer", textDecoration: "underline transparent", transition: "text-decoration 0.2s" }}
                    title={`View ${c.username || c.author}'s profile`}
                    onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                    onMouseLeave={(e) => e.target.style.textDecoration = "underline transparent"}
                  >
                    {c.username || c.author || "User"}
                    <span className="user-badge-inline">
                      {getTierById(c.equippedBadge || "novice").icon}
                      <span className="badge-tooltip-mini" style={{ color: getTierById(c.equippedBadge || "novice").color }}>
                        {getTierById(c.equippedBadge || "novice").title}
                      </span>
                    </span>
                  </span>
                  <span className="comment-meta-dot">•</span>
                  <span className="comment-time">{c.daysAgo}</span>
                </div>
                <div className="comment-text-content">{c.text}</div>
              </div>
              {canDeleteComment(c.userProfileID) && (
                <button className="delete-icon-btn" onClick={() => openDeleteModal(c.id)} title={t("communityPost.deleteComment")}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
// ==========================================


export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dlg, setDlg] = useState({ open: false, title: "", message: "" });
  const closeDlg = () => setDlg({ ...dlg, open: false });
  const openAlert = (title, message) => setDlg({ open: true, title, message });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${API_BASE_URL}/api/communityPost/${id}`);
        const result = await response.json();
        if (response.ok && result.success) { setPost(result.data); setComments(result.data.comments || []); }
        else { throw new Error(result.message || "Failed to load post"); }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchPost();
  }, [id]);

  const handleNewComment = (newComment) => setComments(prev => [...prev, newComment]);
  const handleCommentDeleted = (deletedId) => setComments(prev => prev.filter(c => c.id !== deletedId));

  const handleProfileClick = () => {
    const currentUID = getStableProfileId(user);
    const postUID = post.userProfile?.id;

    if (currentUID && String(currentUID) === String(postUID)) {
      navigate("/profile");
    } else if (postUID) {
      navigate(`/profile/${postUID}`);
    }
  };  

  if (loading) return <><Header /><div className="community-page" style={{ marginTop: "100px" }}><div className="loading">{t("communityPost.loading")}</div></div><Footer /></>;
  if (error) return <><Header /><div className="community-page" style={{ marginTop: "100px" }}><div className="error"><h2>{t("communityPost.error")}</h2><p>{error}</p></div></div><Footer /></>;
  if (!post) return <><Header /><div className="community-page" style={{ marginTop: "100px" }}><div className="not-found"><h2>{t("communityPost.notFound")}</h2></div></div><Footer /></>;

  return (
    <>
      <Header />
      <div className="community-page" style={{ marginTop: "100px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <button className="back-btn" style={{ marginBottom: "20px" }} onClick={() => navigate("/community")}>
            {t("communityPost.backToCommunity")}
          </button>
        </div>

        <div className="post-layout">
          <div className="post-left">
            <div className="image-carousel">
              <img
                src={post.images?.length ? post.images[currentImg] : "https://via.placeholder.com/800"}
                alt={post.foodName} className="post-img-small"
              />
              {post.images?.length > 1 && (
                <>
                  <button className="arrow left" onClick={() => setCurrentImg(p => p === 0 ? post.images.length - 1 : p - 1)}>◀</button>
                  <button className="arrow right" onClick={() => setCurrentImg(p => p === post.images.length - 1 ? 0 : p + 1)}>▶</button>
                </>
              )}
            </div>

            <div className="post-info">
              <div className="title-and-likes-wrapper">
                <h1>{post.foodName}</h1>
                < LikeButton postId={post.id} initialLikes={post.likeCount || 0} user={user} onAlert={openAlert} />
              </div>

              {/* ✅ UPDATED AVATAR IMPLEMENTATION */}
              <div 
                className="post-author-lockup" 
                onClick={handleProfileClick} 
                style={{ cursor: "pointer" }}
                title={t("community.viewProfile", { name: post.author })}
              >
                <div className="author-avatar-large" style={{ overflow: "hidden" }}>
                  <img 
                    src={post.authorProfilePic || `https://ui-avatars.com/api/?name=${post.author || "User"}&background=8b5e3c&color=fff&rounded=true`} 
                    alt={post.author || "User"} 
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = `https://ui-avatars.com/api/?name=${post.author || "User"}&background=8b5e3c&color=fff&rounded=true`;
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  />
                </div>
                <div className="author-text-info">
                  <span className="author-name-large">
                    {post.author || t("communityPost.unknownChef")}
                    <span className="user-badge-inline">
                      {getTierById(post.equippedBadge || "novice").icon}
                      <span className="badge-tooltip-mini" style={{ color: getTierById(post.equippedBadge || "novice").color }}>
                        {getTierById(post.equippedBadge || "novice").title}
                      </span>
                    </span>
                  </span>
                  <div className="post-metadata-row">
                    <span className="post-date">{post.daysAgo}</span>
                    <span className="meta-dot">•</span>
                    <span className="origin-pill">{post.culturalOrigin}</span>
                  </div>
                </div>
              </div>

              <div className="story-section">
                <h3>{t("communityPost.culturalStory")}</h3>
                <p>{post.culturalStory}</p>
              </div>

              {post.recipe && (
                <div className="recipe-box">
                  <h3>{t("communityPost.recipe")}</h3>
                  <div className="recipe-content" dangerouslySetInnerHTML={{ __html: formatTextForDisplay(post.recipe) }} />
                </div>
              )}
            </div>
          </div>

          <div className="post-right">
            <h3>{t("communityPost.comments")} ({comments.length})</h3>
            <CommentSection
              postId={post.id} user={user} comments={comments}
              onCommentAdded={handleNewComment} onCommentDeleted={handleCommentDeleted} onAlert={openAlert}
            />
          </div>
        </div>

        <Modal open={dlg.open} title={dlg.title} onClose={closeDlg} primaryText="OK" onPrimary={closeDlg}>{dlg.message}</Modal>
      </div>
      <Footer />
    </>
  );
}