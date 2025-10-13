import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/FoodDiscussionPage.css"; 

function getInitialComments(foodId) {
  return DEFAULT_COMMENTS_BY_FOOD[foodId] ?? [];
}

export const DEFAULT_COMMENTS_BY_FOOD = {
  1: [ // Manok Pansoh
    {
      id: 10101,
      user: "Ahmad Rahman",
      avatar: "AR",
      verified: true,
      role: "Local Expert",
      content:
        "Best cooked over charcoal. I marinate the chicken with salt, ginger, and lemongrass overnight.",
      timeAgo: "3h",
      likes: 14,
      replies: [
        {
          id: 10111,
          user: "Nadia",
          avatar: "N",
          verified: false,
          role: "Community Member",
          content: "Do you seal the bamboo with tapioca leaves or banana leaves?",
          timeAgo: "2h",
          likes: 2
        },
        {
          id: 10112,
          user: "Ahmad Rahman",
          avatar: "AR",
          verified: true,
          role: "Local Expert",
          content: "Tapioca leaves if you have them—adds aroma and keeps moisture.",
          timeAgo: "1h",
          likes: 5
        }
      ]
    },
    {
      id: 10102,
      user: "Jason Lee",
      avatar: "JL",
      verified: false,
      role: "Community Member",
      content:
        "Tried this last weekend! Even on gas stove with a metal tube it was tasty.",
      timeAgo: "1d",
      likes: 6,
      replies: []
    },
    {
      id: 10103,
      user: "Mary Lee",
      avatar: "ML",
      verified: false,
      role: "Community Member",
      content:
        "Tried this last weekend! Even on gas stove with a metal tube it was tasty.",
      timeAgo: "1d",
      likes: 6,
      replies: []
    }
  ],

  2: [ // Umai
    {
      id: 10201,
      user: "Melissa",
      avatar: "M",
      verified: true,
      role: "Local Expert",
      content:
        "Use very fresh fish and enough lime. Let it sit 15–20 mins to ‘cook’ before adding onions.",
      timeAgo: "5h",
      likes: 18,
      replies: [
        {
          id: 10211,
          user: "Daniel",
          avatar: "D",
          verified: false,
          role: "Community Member",
          content: "Any fish recommendations?",
          timeAgo: "4h",
          likes: 1
        },
        {
          id: 10212,
          user: "Melissa",
          avatar: "M",
          verified: true,
          role: "Local Expert",
          content: "Mackerel or freshly caught sea bass works well.",
          timeAgo: "3h",
          likes: 3
        }
      ]
    },
    {
      id: 10202,
      user: "Aisha",
      avatar: "A",
      verified: false,
      role: "Community Member",
      content:
        "I add a little bird’s eye chili for heat. So good with keropok.",
      timeAgo: "8h",
      likes: 7,
      replies: []
    }
  ],

  3: [ // Kasam Babi
    {
      id: 10301,
      user: "Roland",
      avatar: "R",
      verified: true,
      role: "Local Expert",
      content:
        "Ferment in a cool, dark place. Clean jars are crucial to avoid off flavors.",
      timeAgo: "6h",
      likes: 10,
      replies: [
        {
          id: 10311,
          user: "Mira",
          avatar: "M",
          verified: false,
          role: "Community Member",
          content: "How long do you ferment for a mild flavor?",
          timeAgo: "5h",
          likes: 0
        },
        {
          id: 10312,
          user: "Roland",
          avatar: "R",
          verified: true,
          role: "Local Expert",
          content: "3–4 weeks is a good start, then taste and continue if needed.",
          timeAgo: "4h",
          likes: 2
        }
      ]
    },
    {
      id: 10302,
      user: "Ken",
      avatar: "K",
      verified: false,
      role: "Community Member",
      content:
        "Great with chilies and lime when frying—cuts through the richness.",
      timeAgo: "1d",
      likes: 4,
      replies: []
    }
  ],

  4: [ // Midin Belacan
    {
      id: 10401,
      user: "Siti",
      avatar: "S",
      verified: true,
      role: "Local Expert",
      content:
        "High heat, quick stir-fry. Don’t overcook or it loses the crunch.",
      timeAgo: "2h",
      likes: 22,
      replies: [
        {
          id: 10411,
          user: "Hafiz",
          avatar: "H",
          verified: false,
          role: "Community Member",
          content: "Frozen midin okay?",
          timeAgo: "1h",
          likes: 1
        },
        {
          id: 10412,
          user: "Siti",
          avatar: "S",
          verified: true,
          role: "Local Expert",
          content: "Fresh is best. If frozen, cook from frozen and reduce water.",
          timeAgo: "45m",
          likes: 3
        }
      ]
    },
    {
      id: 10402,
      user: "Lydia",
      avatar: "L",
      verified: false,
      role: "Community Member",
      content:
        "A tiny bit of sugar balances the belacan—game changer.",
      timeAgo: "7h",
      likes: 5,
      replies: []
    }
  ],

  5: [ // Linut
    {
      id: 10501,
      user: "Aaron",
      avatar: "A",
      verified: false,
      role: "Community Member",
      content:
        "Stir vigorously while adding hot water or it gets lumpy.",
      timeAgo: "3h",
      likes: 6,
      replies: []
    },
    {
      id: 10502,
      user: "Rina",
      avatar: "R",
      verified: true,
      role: "Local Expert",
      content:
        "Serve immediately with grated coconut and gula apong syrup.",
      timeAgo: "2h",
      likes: 9,
      replies: [
        {
          id: 10511,
          user: "Jon",
          avatar: "J",
          verified: false,
          role: "Community Member",
          content: "Can I use palm sugar instead of gula apong?",
          timeAgo: "1h",
          likes: 0
        },
        {
          id: 10512,
          user: "Rina",
          avatar: "R",
          verified: true,
          role: "Local Expert",
          content: "Yes—flavor is slightly different but works fine.",
          timeAgo: "50m",
          likes: 1
        }
      ]
    }
  ],

  6: [ // Bubur Pedas
    {
      id: 10601,
      user: "Farah",
      avatar: "F",
      verified: true,
      role: "Local Expert",
      content:
        "Toast the spice mix until fragrant before simmering—deeper flavor.",
      timeAgo: "4h",
      likes: 13,
      replies: [
        {
          id: 10611,
          user: "Ishak",
          avatar: "I",
          verified: false,
          role: "Community Member",
          content: "Any protein you prefer?",
          timeAgo: "3h",
          likes: 1
        },
        {
          id: 10612,
          user: "Farah",
          avatar: "F",
          verified: true,
          role: "Local Expert",
          content: "Beef shank or chicken thigh; both hold up well.",
          timeAgo: "2h",
          likes: 2
        }
      ]
    },
    {
      id: 10602,
      user: "Elaine",
      avatar: "E",
      verified: false,
      role: "Community Member",
      content:
        "I add carrots and celery for texture. Kids love it.",
      timeAgo: "9h",
      likes: 3,
      replies: []
    }
  ],

  7: [ // Ayam Pansuh
    {
      id: 10701,
      user: "Darren",
      avatar: "D",
      verified: false,
      role: "Community Member",
      content:
        "I used banana leaves to seal—still moist but different aroma.",
      timeAgo: "6h",
      likes: 8,
      replies: []
    },
    {
      id: 10702,
      user: "Helen",
      avatar: "H",
      verified: true,
      role: "Local Expert",
      content:
        "Tapioca leaves bring a subtle bitterness that balances richness.",
      timeAgo: "5h",
      likes: 11,
      replies: [
        {
          id: 10711,
          user: "Kai",
          avatar: "K",
          verified: false,
          role: "Community Member",
          content: "Can I substitute spinach?",
          timeAgo: "4h",
          likes: 0
        },
        {
          id: 10712,
          user: "Helen",
          avatar: "H",
          verified: true,
          role: "Local Expert",
          content: "You can, but flavor won’t be the same. Still tasty though!",
          timeAgo: "3h",
          likes: 2
        }
      ]
    }
  ],

  8: [ // Kek Lapis Sarawak
    {
      id: 10801,
      user: "Benny",
      avatar: "B",
      verified: true,
      role: "Local Expert",
      content:
        "Patience! Bake thin layers and press gently to keep lines neat.",
      timeAgo: "1d",
      likes: 21,
      replies: [
        {
          id: 10811,
          user: "Tia",
          avatar: "T",
          verified: false,
          role: "Community Member",
          content: "How do you prevent cracks?",
          timeAgo: "22h",
          likes: 1
        },
        {
          id: 10812,
          user: "Benny",
          avatar: "B",
          verified: true,
          role: "Local Expert",
          content: "Don’t overbake layers; a touch of moisture helps.",
          timeAgo: "20h",
          likes: 3
        }
      ]
    },
    {
      id: 10802,
      user: "Grace",
      avatar: "G",
      verified: false,
      role: "Community Member",
      content:
        "I add a little cinnamon in one layer—great aroma.",
      timeAgo: "18h",
      likes: 6,
      replies: []
    }
  ],

  9: [ // Laksa Sarawak
    {
      id: 10901,
      user: "Wilson",
      avatar: "W",
      verified: true,
      role: "Local Expert",
      content:
        "A good paste is everything. Simmer long enough for the spice oil to bloom.",
      timeAgo: "3h",
      likes: 25,
      replies: [
        {
          id: 10911,
          user: "Mabel",
          avatar: "M",
          verified: false,
          role: "Community Member",
          content: "Coconut milk ratio?",
          timeAgo: "2h",
          likes: 2
        },
        {
          id: 10912,
          user: "Wilson",
          avatar: "W",
          verified: true,
          role: "Local Expert",
          content: "Roughly 1:3 coconut milk to stock—adjust to taste.",
          timeAgo: "90m",
          likes: 4
        }
      ]
    },
    {
      id: 10902,
      user: "Ivy",
      avatar: "I",
      verified: false,
      role: "Community Member",
      content:
        "Fresh lime and sambal on the side—non-negotiable.",
      timeAgo: "8h",
      likes: 9,
      replies: []
    }
  ],

  10: [ // Terung Dayak Soup
    {
      id: 11001,
      user: "Putri",
      avatar: "P",
      verified: true,
      role: "Local Expert",
      content:
        "Smash the lemongrass stalks before simmering; releases aroma.",
      timeAgo: "7h",
      likes: 12,
      replies: [
        {
          id: 11011,
          user: "Andre",
          avatar: "A",
          verified: false,
          role: "Community Member",
          content: "Can I use dried fish instead of prawns?",
          timeAgo: "6h",
          likes: 0
        },
        {
          id: 11012,
          user: "Putri",
          avatar: "P",
          verified: true,
          role: "Local Expert",
          content: "Yes—dried anchovies work well; adjust salt.",
          timeAgo: "5h",
          likes: 2
        }
      ]
    },
    {
      id: 11002,
      user: "Ray",
      avatar: "R",
      verified: false,
      role: "Community Member",
      content:
        "I like it slightly tangier—add a bit more terung dayak at the end.",
      timeAgo: "1d",
      likes: 4,
      replies: []
    }
  ]
};
  
export default function FoodDiscussionPage({ food, onBack }) {
  const foodId = String(food?.id || "");
  const [comments, setComments] = useState(() => getInitialComments(foodId));
  const [likedIds, setLikedIds] = useState(() => new Set());

  const toggleLike = (targetId) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id === targetId) {
          const delta = likedIds.has(targetId) ? -1 : 1;
          return { ...c, likes: Math.max(0, (c.likes || 0) + delta) };
        }
        // check replies
        const updatedReplies = (c.replies || []).map(r => {
          if (r.id === targetId) {
            const delta = likedIds.has(targetId) ? -1 : 1;
            return { ...r, likes: Math.max(0, (r.likes || 0) + delta) };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      })
    );

    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };
  
  useEffect(() => {
    if (!foodId) return;
    setComments(getInitialComments(foodId));
  }, [foodId]);

  // Persist the current food's thread
  useEffect(() => {
    if (!foodId) return;
    localStorage.setItem(`comments_${foodId}`, JSON.stringify(comments));
  }, [foodId, comments]);

  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({}); 

  const totalComments =
    comments.length +
    comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);

  const postComment = () => {
    const text = newComment.trim();
    if (!text) return;
    const next = {
      id: Date.now(),
      user: "You",
      avatar: "YY",
      verified: false,
      role: "Community Member",
      content: text,
      timeAgo: "now",
      likes: 0,
      replies: [],
    };
    setComments(prev => [next, ...prev]);
    setNewComment("");
  };

  const postReply = (commentId) => {
    const text = (replyTexts[commentId] ?? "").trim();
    if (!text) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [
                ...(c.replies || []),
                {
                  id: Date.now(),
                  user: "You",
                  avatar: "YY",
                  verified: false,
                  role: "Community Member",
                  content: text,
                  timeAgo: "now",
                  likes: 0,
                },
              ],
            }
          : c
      )
    );
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
    setReplyToId(null);
  };

  const Comment = React.useMemo(() => 
    React.memo(function Comment({
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
      return (
        <div className={`fd-disc-comment ${isReply ? "fd-disc-reply" : ""}`}>
          <div className="fd-disc-avatar">{item.avatar}</div>
          <div className="fd-disc-body">
            <div className="fd-disc-meta">
              <span className="fd-disc-user">{item.user}</span>
              {item.verified && <span className="fd-disc-badge">Verified</span>}
              <span className="fd-disc-role">{item.role}</span>
              <span className="fd-disc-time">• {item.timeAgo}</span>
            </div>

            <p className="fd-disc-text">{item.content}</p>

            <div className="fd-disc-actions">
              <button className="fd-link-btn" type="button" onClick={() => onToggleLike(item.id)}>
                {likedIds.has(item.id) ? "♥" : "♡"} {item.likes} likes
              </button>

              {!isReply && (
                <button
                  className="fd-link-btn"
                  type="button"
                  onClick={() => setReplyToId(replyToId === item.id ? null : item.id)}
                >
                  ↩ Reply
                </button>
              )}
            </div>

            {!isReply && replyToId === item.id && (
              <div className="fd-reply-box">
                <textarea
                  className="fd-input"
                  placeholder="Write your reply…"
                  value={replyTexts[item.id] ?? ""}
                  onChange={(e) =>
                    setReplyTexts((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                />
                <div className="fd-reply-actions">
                  <button className="lrp-btn lrp-btn-primary" type="button" onClick={() => onPostReply(item.id)}>
                    Send Reply
                  </button>
                  <button className="lrp-btn lrp-btn-outline" type="button" onClick={() => setReplyToId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!!item.replies?.length && (
              <div className="fd-disc-replies">
                {item.replies.map((r) => (
                  <Comment
                    key={r.id}
                    item={r}
                    isReply
                    likedIds={likedIds}
                    onToggleLike={onToggleLike}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyTexts={replyTexts}
                    setReplyTexts={setReplyTexts}
                    onPostReply={onPostReply}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    })
  , []);

  return (
    <div className="food-discussion-page">
      <Header />

      <div className="fdp-disc-container">
        {/* top bar */}
        <div className="fdp-disc-topbar">
          <button type="button" className="lrp-btn lrp-btn-outline fdp-back" onClick={onBack}>
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
                <span>♡ {comments.reduce((a, c) => a + c.likes, 0)} likes</span>
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
          />
          <div className="fd-right">
            <button className="lrp-btn lrp-btn-primary" type="button" onClick={postComment}>
              Post Comment
            </button>
          </div>
        </div>

        {/* comments */}
        <div className="fd-card">
          <h3 className="fd-section-title">Comments ({comments.length})</h3>
          {comments.length ? (
            <div className="fd-disc-list">
              {comments.map((c, idx) => (
                <React.Fragment key={c.id}>
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
