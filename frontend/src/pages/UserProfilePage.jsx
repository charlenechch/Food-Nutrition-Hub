import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/UserProfilePage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Bell, ExternalLink, Eye, Globe, Shield } from "lucide-react";


const DIETARY_OPTIONS = ["vegetarian","vegan","halal","gluten-free","dairy-free","low-fat","high-protein","spicy"];
const ALLERGY_OPTIONS = ["tree-nuts","peanuts","seafood","shellfish","egg","soy","sesame","wheat","no-spicy"];

// toggle a value inside an array
const toggleInArray = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

const toArray = (val, noneKeyword) => {
  if (Array.isArray(val)) return val;
  if (!val || val === noneKeyword) return [];
  return [val];
};
const DEFAULT_PREFS = {
  emailNotifications: true,
  pushNotifications: true,
  profileVisibility: true,
  language: "en",
};

const normalizePrefs = (p = {}) => {
  const dietary = Array.isArray(p.dietary)
    ? p.dietary
    : p.dietary && p.dietary !== "none"
    ? [p.dietary]
    : [];

  const allergies = Array.isArray(p.allergies)
    ? p.allergies
    : p.allergies && p.allergies !== "noAllergies"
    ? [p.allergies]
    : [];

  return { ...DEFAULT_PREFS, ...p, dietary, allergies };
};

export default function UserProfilePage() {
  const { userProfileID } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedPage, setSavedPage] = useState(1);
  const [currentSaved, setCurrentSaved] = useState([]);
  const [totalSavedPages, setTotalSavedPages] = useState(1);
  const [tab, setTab] = useState("info");
  const [uiDietary, setUiDietary] = useState([]);
  const [uiAllergies, setUiAllergies] = useState([]);

  // Initialize form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    bio: "",
  });

// 3) Initialize once using user.prefs (if user not ready yet, pass {})
const [prefs, setPrefs] = useState(() => normalizePrefs(user?.prefs || {}));

// 4) If the `user` can change (e.g., after fetch/route), keep prefs in sync:
useEffect(() => {
  if (!user) return;
  setUiDietary(Array.isArray(user?.prefs?.dietary) ? user.prefs.dietary : (user?.prefs?.dietary && user.prefs.dietary !== "none" ? [user.prefs.dietary] : []));
  setUiAllergies(Array.isArray(user?.prefs?.allergies) ? user.prefs.allergies : (user?.prefs?.allergies && user.prefs.allergies !== "noAllergies" ? [user.prefs.allergies] : []));
}, [user]);


  // date formatting helper function
const formatContributionDate = (dateString) => {
  if (!dateString) return 'Date not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Date not available';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Date not available';
  }
};

  // Debug: Log the userProfileID when it changes
  useEffect(() => {
    console.log("🔍 [FRONTEND] userProfileID from useParams():", userProfileID);
    console.log("🔍 [FRONTEND] Type of userProfileID:", typeof userProfileID);
    console.log("🔍 [FRONTEND] Full URL:", window.location.href);
  }, [userProfileID]);

  // Load user data from API
  useEffect(() => {
    const loadUserProfile = async () => {
      // Don't proceed if userProfileID is not available
      if (!userProfileID) {
        console.log("❌ [FRONTEND] No userProfileID available, skipping API call");
        setIsLoading(false);
        setError("No user profile ID provided");
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        
        console.log("🚀 [FRONTEND] Starting profile load for userProfileID:", userProfileID);
        
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const apiUrl = `${API_BASE_URL}/api/userProfile/${userProfileID}`;
        console.log("📡 [FRONTEND] Making API call to:", apiUrl);
        
        const response = await fetch(apiUrl);
        
        console.log("📡 [FRONTEND] Response status:", response.status);
        console.log("📡 [FRONTEND] Response ok:", response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ [FRONTEND] API error response:", errorText);
          throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
        }
        
        const userData = await response.json();
        console.log("✅ [FRONTEND] User data received:", userData);
        
        setUser(userData);
        
        // Update form state with API data
        setForm({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          location: userData.location || "",
          bio: userData.bio || "",
        });
        setBio(userData.bio || "");
        setPrefs(userData.prefs || {
          dietary: "none",
          allergies: "noAllergies",
          emailNotifications: true,
          pushNotifications: true,
          profileVisibility: true,
          language: "en",
        });
      } catch (err) {
        console.error("❌ [FRONTEND] Error loading profile:", err);
        setError(err.message);
      } finally {
        console.log("🏁 [FRONTEND] Loading complete");
        setIsLoading(false);
      }
    };

    console.log("🎯 [FRONTEND] useEffect triggered, userProfileID:", userProfileID);
    
    if (userProfileID && userProfileID !== "undefined" && userProfileID !== "null") {
      loadUserProfile();
    } else {
      console.log("⏸️ [FRONTEND] userProfileID not ready yet:", userProfileID);
      setIsLoading(false);
    }
  }, [userProfileID]);

  // Handle saved foods pagination
  useEffect(() => {
    if (user?.savedFoods) {
      const itemsPerPage = 6;
      const startIndex = (savedPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setCurrentSaved(user.savedFoods.slice(startIndex, endIndex));
      setTotalSavedPages(Math.ceil(user.savedFoods.length / itemsPerPage));
    }
  }, [user, savedPage]);

  useEffect(() => {
    if (!user) return;
    setPrefs(prev => {
      const next = normalizePrefs(user.prefs || {});
      // shallow compare to avoid unnecessary rerenders
      const sameArrays = (a, b) => a.length === b.length && a.every(v => b.includes(v));
      const same =
        prev.emailNotifications === next.emailNotifications &&
        prev.pushNotifications === next.pushNotifications &&
        prev.profileVisibility === next.profileVisibility &&
        prev.language === next.language &&
        sameArrays(prev.dietary, next.dietary) &&
        sameArrays(prev.allergies, next.allergies);

      return same ? prev : next;
    });
  }, [user]);


  // Update save functions to use direct fetch
  const savePersonal = async () => {
    if (!userProfileID) {
      alert("No user profile ID available");
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/userProfile/${userProfileID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bio })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      alert("Profile updated successfully!");
      
      // Reload the profile to get updated data
      const loadResponse = await fetch(`${API_BASE_URL}/api/userProfile/${userProfileID}`);
      if (loadResponse.ok) {
        const updatedUser = await loadResponse.json();
        setUser(updatedUser);
      }
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    }
  };

  const savePrefs = async () => {
    if (!userProfileID) {
      alert("No user profile ID available");
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/userProfile/${userProfileID}/preferences`, {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefs })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`);
      }
      
      alert("Preferences updated successfully!");
    } catch (err) {
      alert("Failed to update preferences: " + err.message);
    }
  };

  const fmtStatus = (s) =>
    s === "under_review"
      ? "Under Review"
      : s === "awaiting_approval"
      ? "Awaiting Approval"
      : s === "needs_revision"
      ? "Needs Revision"
      : s;

  // Loading state
  if (isLoading) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page">
          <div className="upp-loading">Loading profile...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page">
          <button className="lrp-btn lrp-btn-outline" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 className="upp-404-h2">Error Loading Profile</h2>
          <p className="upp-error-message">{error}</p>
          <p>Profile Identifier: {userProfileID || 'Not available'}</p>
          <div className="upp-error-actions">
            <button 
              className="lrp-btn lrp-btn-primary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button 
              className="lrp-btn lrp-btn-outline" 
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // User not found or no userProfileID
  if (!userProfileID || !user) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page">
          <button className="lrp-btn lrp-btn-outline" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 className="upp-404-h2">Profile Not Found</h2>
          <p>Unable to load user profile. The profile may not exist or you may not have permission to view it.</p>
          <p>Profile Identifier: {userProfileID || 'Not available'}</p>
          <div className="upp-error-actions">
            <button 
              className="lrp-btn lrp-btn-primary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button 
              className="lrp-btn lrp-btn-outline" 
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <Header />
      <div className="upp-page">
        {/* Header */}
        <div className="upp-header">
          <div className="upp-avatar" aria-hidden="true">
            {user.avatar && user.avatar.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={user.avatar} alt="Profile" />
            ) : (
              <div className="upp-avatar-initials">
                {user.avatar || `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}` || "👤"}
              </div>
            )}
          </div>
          <h1 className="upp-title">My Profile</h1>
          <p className="upp-sub">
            {user.firstName} {user.lastName} • {user.role || 'Member'}
          </p>
        </div>

        {/* Tabs */}
        <div className="upp-tabs lrp-tabs">
          {[
            ["info", "Personal Information"],
            ["saved", "Saved Foods"],
            ["status", "Contributions"],
            ["prefs", "Preferences"],
            ["settings", "Settings"],
          ].map(([val, label]) => (
            <button
              key={val}
              className={`upp-tab lrp-tab ${tab === val ? "is-active" : ""}`}
              onClick={() => setTab(val)}
              type="button"
              role="tab"
              aria-selected={tab === val}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="upp-tab-content">
          {/* Personal Information Tab */}
          {tab === "info" && (
            <div className="upp-grid">
              <div className="upp-main">
                <div className="upp-card">
                  <h3 className="upp-card-title">Personal Information</h3>
                  <div className="upp-form-grid">
                    <label>
                      <span>First Name</span>
                      <input
                        value={form.firstName}
                        onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Last Name</span>
                      <input
                        value={form.lastName}
                        onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="upp-input">
                    <label className="upp-block">
                      <span>Email</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </label>
                    <label className="upp-block">
                      <span>Location</span>
                      <input
                        value={form.location}
                        onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                      />
                    </label>
                    <label className="upp-block">
                      <span>Bio</span>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={200}
                        className="upp-textarea"
                        placeholder="Tell us about yourself…"
                      />
                      <div className="upp-help">{bio.length}/200</div>
                    </label>
                  </div>
                  <button className="lrp-btn lrp-btn-primary" onClick={savePersonal}>
                    Save Changes
                  </button>
                </div>
              </div>
              <aside className="upp-sticky">
                <div className="upp-card">
                  <h3 className="upp-card-title">My Contributions</h3>
                  <div className="upp-stat">
                    <div className="upp-stat-val">{user.stats?.recipes || 0}</div>
                    <div className="upp-muted">recipes shared</div>
                  </div>
                  <div className="upp-stat">
                    <div className="upp-stat-val">{user.stats?.foods || 0}</div>
                    <div className="upp-muted">foods documented</div>
                  </div>
                  <div className="upp-stat">
                    <div className="upp-stat-val">{user.stats?.likes || 0}</div>
                    <div className="upp-muted">likes received</div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* Saved Foods Tab */}
          {tab === "saved" && (
            <>
              {currentSaved.length ? (
                <>
                  <div className="upp-card-grid">
                    {currentSaved.map((f) => (
                      <div
                        key={f.saveId || f.id}
                        className="upp-food-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/fooddetail?id=${f.id}`, { state: { food: f } })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/fooddetail?id=${f.id}`, { state: { food: f } });
                        }}
                      >
                        <div className="upp-food-media">
                          <img src={f.image} alt={f.name} />
                        </div>
                        <div className="upp-food-body">
                          <h4 className="upp-food-title">{f.name}</h4>
                          <div className="upp-food-row">
                            <span className="upp-badge">{f.origin}</span>
                            <span className="upp-muted">{f.savedDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalSavedPages > 1 && (
                    <div className="efp-pagination">
                      <button
                        className="efp-btn"
                        disabled={savedPage === 1}
                        onClick={() => setSavedPage((p) => Math.max(1, p - 1))}
                      >
                        ‹ Prev
                      </button>

                      {Array.from({ length: totalSavedPages }, (_, i) => (
                        <button
                          key={i}
                          className={`efp-btn ${savedPage === i + 1 ? "is-active" : ""}`}
                          onClick={() => setSavedPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        className="efp-btn"
                        disabled={savedPage === totalSavedPages}
                        onClick={() => setSavedPage((p) => Math.min(totalSavedPages, p + 1))}
                      >
                        Next ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="upp-center">
                  <p className="upp-muted">No saved foods yet</p>
                  <p className="upp-muted">Explore foods to start saving your favorites</p>
                </div>
              )}
            </>
          )}

          {/* User Contributions Tab */}
          {tab === "status" && (
            <>
              {user.status?.length ? (
                <div className="upp-stack">
                  {user.status.map((c) => (
                    <div className="upp-row-card" key={c.id}>
                      <div className="upp-row-thumb">
                        <img src={c.image} alt={c.title} />
                      </div>
                      <div className="upp-row-body">
                        <div className="upp-row-top">
                          <h4 className="upp-food-title upp-row-title">{c.title}</h4>
                          <span
                            className={`upp-chip ${
                              c.status === "under_review"
                                ? "chip-yellow"
                                : c.status === "awaiting_approval"
                                ? "chip-blue"
                                : "chip-red"
                            }`}
                          >
                            {fmtStatus(c.status)}
                          </span>
                        </div>
                        <div className="upp-row-meta">
                          <div className="upp-muted">
                            {c.type} • Submitted on {formatContributionDate(c.submittedDate)}
                          </div>
                          {c.status === "needs_revision" && (
                            <button
                              className="lrp-btn lrp-btn-outline upp-revise-btn"
                              onClick={() =>
                                navigate(`/revise/${c.id}`, {
                                  state: {
                                    owner: user.username,
                                    id: c.id,
                                    snapshot: JSON.parse(JSON.stringify(c)),
                                  },
                                })
                              }
                              type="button"
                            >
                              Revise
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="upp-center">
                  <p className="upp-muted">No contributions</p>
                </div>
              )}
            </>
          )}

          {/* Preferences Tab */}
          {tab === "prefs" && (
            <div className="upp-stack">
              {/* Dietary (multiple, UI-only) */}
              <div className="upp-card">
                <h3 className="upp-card-title">Dietary Preferences (local only)</h3>
                <div className="upp-choice-grid">
                  {DIETARY_OPTIONS.map(id => (
                    <label
                      key={id}
                      className={`upp-choice ${uiDietary.includes(id) ? "is-on" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={uiDietary.includes(id)}
                        onChange={() => setUiDietary(prev => toggleInArray(prev, id))}
                      />
                      {id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </label>
                  ))}
                </div>

                <div className="upp-muted" style={{ marginTop: 8 }}>
                  (These selections are demo-only and won’t be sent to the server.)
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    className="lrp-btn lrp-btn-outline"
                    type="button"
                    onClick={() => {
                      // reset to backend values
                      setUiDietary(toArray(user?.prefs?.dietary, "none"));
                    }}
                  >
                    Reset (from backend)
                  </button>
                </div>
              </div>

              {/* Allergies (multiple, UI-only) */}
              <div className="upp-card">
                <h3 className="upp-card-title">Allergies / Restrictions (local only)</h3>
                <div className="upp-choice-grid">
                  {ALLERGY_OPTIONS.map(id => (
                    <label
                      key={id}
                      className={`upp-choice ${uiAllergies.includes(id) ? "is-on" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={uiAllergies.includes(id)}
                        onChange={() => setUiAllergies(prev => toggleInArray(prev, id))}
                      />
                      {id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </label>
                  ))}
                </div>

                <div className="upp-muted" style={{ marginTop: 8 }}>
                  (These selections are demo-only and won’t be sent to the server.)
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    className="lrp-btn lrp-btn-outline"
                    type="button"
                    onClick={() => {
                      // reset to backend values
                      setUiAllergies(toArray(user?.prefs?.allergies, "noAllergies"));
                    }}
                  >
                    Reset (from backend)
                  </button>
                </div>
              </div>

              <button className="lrp-btn lrp-btn-primary" onClick={savePrefs}>
                Save Preferences
              </button>
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && (
            <div className="upp-stack">
              <div className="upp-card">
                <h3 className="upp-card-title"><Bell size={18} color={"#6a4a2f"}/> Notifications</h3>
                <div className="upp-row between">
                  <div>
                    <div className="upp-strong">Email Notifications</div>
                    <div className="upp-muted">Receive updates about new recipes and foods</div>
                  </div>
                  <label className="upp-switch">
                    <input
                      type="checkbox"
                      checked={prefs.emailNotifications}
                      onChange={(e) => setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))}
                    />
                    <span />
                  </label>
                </div>
                <hr className="upp-sep" />
                <div className="upp-row between">
                  <div>
                    <div className="upp-strong">Push Notifications</div>
                    <div className="upp-muted">Get notified about community activities</div>
                  </div>
                  <label className="upp-switch">
                    <input
                      type="checkbox"
                      checked={prefs.pushNotifications}
                      onChange={(e) => setPrefs((p) => ({ ...p, pushNotifications: e.target.checked }))}
                    />
                    <span />
                  </label>
                </div>
              </div>

              <div className="upp-card">
                <h3 className="upp-card-title"><Globe size={18} color={"#6a4a2f"}/> Language</h3>
                <div className="upp-row between">
                  <div>
                    <div className="upp-strong">Language</div>
                    <div className="upp-muted">Choose your preferred language</div>
                  </div>
                  <button
                    className="lrp-btn lrp-btn-outline upp-btn"
                    onClick={() => setPrefs((p) => ({ ...p, language: p.language === "en" ? "ms" : "en" }))}
                  >
                    {prefs.language === "en" ? "Bahasa Malaysia" : "English"}
                  </button>
                </div>
              </div>

              <div className="upp-card">
                <h3 className="upp-card-title"><Eye size={18} color={"#6a4a2f"}/> Privacy</h3>
                <div className="upp-row between">
                  <div>
                    <div className="upp-strong">Profile Visibility</div>
                    <div className="upp-muted">Allow others to see your profile</div>
                  </div>
                  <label className="upp-switch">
                    <input
                      type="checkbox"
                      checked={prefs.profileVisibility}
                      onChange={(e) => setPrefs((p) => ({ ...p, profileVisibility: e.target.checked }))}
                    />
                    <span />
                  </label>
                </div>
                <hr className="upp-sep" />
                <div className="upp-row between">
                  <div>
                    <div className="upp-strong">Data Export</div>
                    <div className="upp-muted">Download your saved data</div>
                  </div>
                  <button className="lrp-btn lrp-btn-outline upp-btn" onClick={() => alert("Exported!")}>
                    Export Data
                  </button>
                </div>
              </div>

              {user.role === "admin" && (
                <div className="upp-card">
                  <h3 className="upp-card-title"><Shield size={18} color={"#6a4a2f"}/> Admin Access</h3>
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">Admin Panel</div>
                      <div className="upp-muted">Access administrative features and management tools</div>
                    </div>
                    <button className="lrp-btn lrp-btn-outline upp-btn" onClick={() => navigate("/admin")}>
                      <ExternalLink size={15} /> Open Admin Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}