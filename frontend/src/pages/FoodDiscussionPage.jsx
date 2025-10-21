import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css"; 
import '@fortawesome/fontawesome-free/css/all.min.css';

// Helper function for time formatting
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

// MOVED COMMENT COMPONENT OUTSIDE 
const Comment = React.memo(function Comment({
  item,
  isReply = false,
  likedIds,
  onToggleLike,
  replyToId,
  setReplyToId,
  replyTexts,
  setReplyTexts,
  onPostReply,
}) {
  // Generate avatar from username (first two characters)
  const getAvatar = (username) => {
    if (!username) return "UU";
    return username.substring(0, 2).toUpperCase();
  };

  //comment component
  const itemId = isReply 
    ? (item.replyID || item.id || `reply-${Date.now()}-${Math.random()}`)
    : (item.id || item.discussionID || `comment-${Date.now()}-${Math.random()}`);
  const content = item.content || item.reply || item.text || "No content";
  const timestamp = item.timestamp || item.createdAt || new Date().toISOString();
  const likes = isReply ? 0 : (item.likes || item.upVotes || 0);
  const username = item.username || "Loading...";

  const handleReplyTextChange = (e) => {
    setReplyTexts((prev) => ({ ...prev, [itemId]: e.target.value }));
  };

  const handlePostReply = () => {
    onPostReply(itemId);
  };

  const handleCancelReply = () => {
    setReplyToId(null);
    setReplyTexts(prev => ({ ...prev, [itemId]: "" }));
  };

  const handleToggleReply = () => {
    setReplyToId(replyToId === itemId ? null : itemId);
  };

  return (
    <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
      <div className="fd-disc-avatar">{getAvatar(username)}</div>
      <div className="fd-disc-body">
        <div className="fd-disc-meta">
          <span className="fd-disc-user">{username}</span>
          <span className="fd-disc-time">• {getTimeAgo(timestamp)}</span>
        </div>

        <p className="fd-disc-text">{content}</p>

        <div className="fd-disc-actions">
          {!isReply && (
            <button 
              className="fd-link-btn" 
              type="button" 
              onClick={() => onToggleLike(itemId)}
            >
              {likedIds.has(itemId) ? "♥" : "♡"} {likes || 0} likes
            </button>
          )}

          {!isReply && (
            <button
              className="fd-link-btn"
              type="button"
              onClick={handleToggleReply}
            >
              ↩ Reply
            </button>
          )}
        </div>

        {!isReply && replyToId === itemId && (
          <div className="fd-reply-box">
            <textarea
              className="fd-input"
              placeholder="Write your reply…"
              value={replyTexts[itemId] ?? ""}
              onChange={handleReplyTextChange}
              rows="3"
            />
            <div className="fd-reply-actions">
              <button 
                className="lrp-btn lrp-btn-primary" 
                type="button" 
                onClick={handlePostReply}
                disabled={!replyTexts[itemId]?.trim()}
              >
                Send Reply
              </button>
              <button 
                className="lrp-btn lrp-btn-outline" 
                type="button" 
                onClick={handleCancelReply}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!!item.replies?.length && (
          <div className="fd-disc-replies">
            {item.replies.map((r, index) => {
              // Validate reply data before rendering
              const replyId = r.replyID || `reply-${itemId}-${index}`;
              const replyContent = r.content || r.reply || r.text;
              
              if (!replyId || !replyContent) {
                console.warn('Skipping invalid reply:', r);
                return null;
              }
              
              return (
                <Comment
                  key={replyId}
                  item={r}
                  isReply={true}
                  likedIds={likedIds}
                  onToggleLike={onToggleLike}
                  replyToId={replyToId}
                  setReplyToId={setReplyToId}
                  replyTexts={replyTexts}
                  setReplyTexts={setReplyTexts}
                  onPostReply={onPostReply}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});


export default function FoodDiscussionPage() {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get food data from navigation state or fetch it
  const [food, setFood] = useState(location.state?.food || null);
  const [comments, setComments] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});

  // Get userProfileID (for demo purposes - in real app, get from auth)
  const getUserProfileID = () => {
    return 1; // Demo user ID
  };

  // Fetch food details if not passed via state
  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!food && foodId) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const res = await fetch(`${API_BASE_URL}/api/foodDetail/${foodId}`);
          if (res.ok) {
            const result = await res.json();
            if (result.success) {
              setFood(result.data);
            }
          }
        } catch (error) {
          console.error('Error fetching food details:', error);
        }
      }
    };

    fetchFoodDetails();
  }, [food, foodId]);

  // Fetch comments from API
useEffect(() => {
  const fetchComments = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/food/${foodId}`);
      
      if (res.ok) {
        const result = await res.json();
        console.log('Raw API response:', result);
        
        if (result.success && result.data) {
          // Flatten the data structure and ensure replies are properly formatted
          const flattenData = (data) => {
            if (Array.isArray(data)) {
              return data.flatMap(item => {
                if (item && typeof item === 'object') {
                  const hasNumericKeys = Object.keys(item).some(key => !isNaN(key));
                  if (hasNumericKeys) {
                    return Object.values(item).filter(val => 
                      val && typeof val === 'object' && (val.id || val.discussionID)
                    );
                  }
                  return item;
                }
                return [];
              });
            }
            return data ? [data] : [];
          };
          
          let commentsData = flattenData(result.data);
          
          // Ensure each comment has proper timeAgo and process replies
          commentsData = commentsData.map(comment => ({
            ...comment,
            timeAgo: getTimeAgo(comment.timestamp || comment.createdAt),
            replies: (comment.replies || []).map(reply => ({
              ...reply,
              timeAgo: getTimeAgo(reply.timestamp || reply.createdAt)
            }))
          }));
          
          console.log('Final comments data:', commentsData);
          setComments(commentsData);
        } else {
          setComments([]);
        }
      } else {
        console.error('Failed to fetch comments');
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  if (foodId) {
    fetchComments();
  }
}, [foodId]);

  const toggleLike = async (targetId) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const userProfileID = getUserProfileID();
      
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${targetId}/vote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'up',
          userProfileID: userProfileID 
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          // Update the specific comment's like count
          setComments(prev =>
            prev.map(comment => {
              if (comment.id === targetId) {
                const wasLiked = likedIds.has(targetId);
                const likeChange = wasLiked ? -1 : 1;
                return { 
                  ...comment, 
                  upVotes: Math.max(0, (comment.likes || 0) + likeChange) 
                };
              }
              return comment;
            })
          );

          // Update likedIds set
          setLikedIds(prev => {
            const next = new Set(prev);
            if (next.has(targetId)) {
              next.delete(targetId);
            } else {
              next.add(targetId);
            }
            return next;
          });
        }
      } else {
        console.error('Failed to update like');
      }
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  const postComment = async () => {
    const text = newComment.trim();
    if (!text) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const userProfileID = getUserProfileID();
      
      const res = await fetch(`${API_BASE_URL}/api/foodDiscussion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodID: foodId,
          userProfileID: userProfileID,
          content: text
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setComments(prev => [result.data, ...prev]);
          setNewComment("");
        }
      } else {
        console.error('Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const postReply = async (discussionId) => {
  const text = (replyTexts[discussionId] ?? "").trim();
  if (!text) return;

  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const userProfileID = getUserProfileID();
    
    const res = await fetch(`${API_BASE_URL}/api/foodDiscussion/${discussionId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userProfileID: userProfileID,
        reply: text
      })
    });

    const result = await res.json();
    console.log('Reply API response:', result);

    if (res.ok && result.success) {
      // Update the comments state with the new reply
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === discussionId) {
            const updatedReplies = [
              ...(comment.replies || []),
              {
                replyID: result.data.replyID,
                username: result.data.username,
                content: result.data.content,
                timestamp: result.data.timestamp,
                timeAgo: result.data.timeAgo,
                avatar: result.data.avatar,
                type: result.data.type
              }
            ];
            
            return {
              ...comment,
              replies: updatedReplies
            };
          }
          return comment;
        })
      );
      
      // Clear the reply form
      setReplyTexts(prev => ({ ...prev, [discussionId]: "" }));
      setReplyToId(null);
    }
  } catch (err) {
    console.error('Error posting reply:', err);
  }
};

  const handleBack = () => {
    navigate(-1);
  };

  const totalComments = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
  const totalLikes = comments.reduce((acc, c) => acc + (c.likes || 0), 0);

  if (loading) {
    return (
      <div className="food-discussion-page">
        <Header />
        <div className="fdp-disc-container">
          <div className="fd-empty">
            <div className="fd-empty-icon">⏳</div>
            <p className="fd-muted">Loading comments...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="food-discussion-page">
      <Header />

      <div className="fdp-disc-container">
        {/* top bar */}
        <div className="fdp-disc-topbar">
          <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={handleBack}>
            ← Back to Food Details
          </button>
        </div>

        {/* summary card */}
        <div className="fd-card fd-summary">
          <div className="fd-sum-left">
            <div className="fd-sum-thumb">{food?.icon || "🍽️"}</div>
            <div>
              <h2 className="fd-title">{food?.name || "Food Discussion"}</h2>
              <p className="fd-muted">{food?.description}</p>
              <div className="fd-sum-stats">
                <span>💬 {totalComments} comments</span>
                <span>♡ {totalLikes} likes</span>
              </div>
            </div>
          </div>
        </div>

        {/* add comment */}
        <div className="fd-card">
          <h3 className="fd-section-title">Add Your Comment</h3>
          <textarea
            className="fd-input"
            placeholder="Share your thoughts about this food…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="4"
          />
          <div className="fd-right">
            <button 
              className="lrp-btn lrp-btn-primary" 
              type="button" 
              onClick={postComment}
              disabled={!newComment.trim()}
            > 
              <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i> Post Comment
            </button>
          </div>
        </div>

        {/* comments */}
        <div className="fd-card">
          <h3 className="fd-section-title"><i className="fas fa-comment-dots"></i> Community Comments ({comments.length})</h3>
          {comments.length ? (
            
            <div className="fd-disc-list">
              {comments.map((c, idx) => (
                <React.Fragment key={c.id || `comment-${idx}`}>
                  <Comment
                    item={c}
                    likedIds={likedIds}
                    onToggleLike={toggleLike}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyTexts={replyTexts}
                    setReplyTexts={setReplyTexts}
                    onPostReply={postReply}
                  />
                  {idx < comments.length - 1 && <hr className="fd-divider" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="fd-empty">
              <div className="fd-empty-icon">💬</div>
              <p className="fd-muted">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}