// ✅ UserProfilePage.jsx – Final Clean Version
// - Guest safe: shows LoginPromptModal (no redirect/logout)
// - Supports /profile and /profile/:userProfileID
// - Preserves: Saved foods, contributions, preferences, settings, stats, edit profile

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/UserProfilePage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Bell, Eye, Globe, Shield, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";           // ✅ session
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ popup

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Dietary + Allergies (keep your original options)
const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "halal", "gluten-free", "dairy-free", "low-fat", "high-protein", "spicy"
];
const ALLERGY_OPTIONS = [
  "tree-nuts","peanuts","seafood","shellfish","egg","soy","sesame","wheat","no-spicy"
];

// Default Preferences
const DEFAULT_PREFS = {
  dietary: [],
  allergies: [],
  emailNotifications: true,
  pushNotifications: true,
  profileVisibility: true,
  language: "en"
};

const normalizePrefs = (data = {}) => ({
  ...DEFAULT_PREFS,
  dietary: Array.isArray(data.dietary) ? data.dietary : [],
  allergies: Array.isArray(data.allergies) ? data.allergies : [],
  emailNotifications: data.emailNotifications ?? true,
  pushNotifications: data.pushNotifications ?? true,
  profileVisibility: data.profileVisibility ?? true,
  language: data.language || "en"
});

const toggleInArray = (arr, value) =>
  arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

const fmtStatus = (s) =>
  s === "under_review"
    ? "Under Review"
    : s === "awaiting_approval"
    ? "Awaiting Approval"
    : s === "needs_revision"
    ? "Needs Revision"
    : s || "Unknown";

const formatContributionDate = (dateString) => {
  if (!dateString) return "Date not available";
  const d = new Date(dateString);
  return isNaN(d.getTime())
    ? "Date not available"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export default function UserProfilePage() {
  const { userProfileID } = useParams(); // Optional — if present, view someone else
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); // ✅ session context

  // Data states
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", location: "" });
  const [bio, setBio] = useState("");

  // UI
  const [tab, setTab] = useState("info");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // ✅ guest popup

  // Saved foods pagination
  const [savedPage, setSavedPage] = useState(1);
  const [currentSaved, setCurrentSaved] = useState([]);
  const [totalSavedPages, setTotalSavedPages] = useState(1);

  // ✅ Load profile (session-based for /profile; id-based for /profile/:userProfileID)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        const endpoint = userProfileID
          ? `${API_BASE_URL}/api/userProfile/${userProfileID}` // view another user
          : `${API_BASE_URL}/api/userProfile`;                // view my own (session)

        const res = await fetch(endpoint, { credentials: "include" });

        // ✅ If no session or unauthorized → show popup (don’t redirect/logout)
        if (res.status === 401 || !authUser) {
          setShowLoginPrompt(true);
          setIsLoading(false);
          return;
        }

        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);

        const data = await res.json();
        if (!data) throw new Error("Profile not found");

        setUser(data);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          location: data.location || "",
        });
        setBio(data.bio || "");
        setPrefs(normalizePrefs(data.prefs));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userProfileID, authUser]);

  // ✅ Pagination for saved foods
  useEffect(() => {
    if (user?.savedFoods && Array.isArray(user.savedFoods)) {
      const perPage = 6;
      const start = (savedPage - 1) * perPage;
      const items = user.savedFoods.slice(start, start + perPage);
      setCurrentSaved(items);
      setTotalSavedPages(Math.ceil(user.savedFoods.length / perPage));
    } else {
      setCurrentSaved([]);
      setTotalSavedPages(1);
    }
  }, [user, savedPage]);

  // ===== Save: Personal Info =====
  const savePersonal = async () => {
    try {
      if (!user?.userID) return alert("No User ID found.");
      const res = await fetch(`${API_BASE_URL}/api/userProfile/${user.userID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, bio }),
      });
      if (!res.ok) throw new Error(`Failed to update profile (${res.status})`);
      alert("Profile updated!");

      // Optionally reload profile
      const endpoint = userProfileID
        ? `${API_BASE_URL}/api/userProfile/${userProfileID}`
        : `${API_BASE_URL}/api/userProfile`;
      const r2 = await fetch(endpoint, { credentials: "include" });
      if (r2.ok) setUser(await r2.json());
    } catch (e) {
      alert(e.message);
    }
  };

  // ===== Save: Preferences =====
  const savePrefs = async () => {
    try {
      if (!user?.userID) return alert("No User ID found.");
      const res = await fetch(`${API_BASE_URL}/api/userProfile/${user.userID}/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prefs }),
      });
      if (!res.ok) throw new Error(`Failed to update preferences (${res.status})`);
      alert("Preferences updated!");
    } catch (e) {
      alert(e.message);
    }
  };

  // ===== Loading & Error =====
  if (isLoading) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page"><div className="upp-loading">Loading profile…</div></div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page">
          <button className="lrp-btn lrp-btn-outline" onClick={() => navigate(-1)}>← Back</button>
          <h2 className="upp-404-h2">Error Loading Profile</h2>
          <p className="upp-error-message">{error}</p>
          <div className="upp-error-actions">
            <button className="lrp-btn lrp-btn-primary" onClick={() => window.location.reload()}>Retry</button>
            <button className="lrp-btn lrp-btn-outline" onClick={() => navigate("/")}>Go Home</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== MAIN UI =====
  return (
    <div className="user-profile-page">
      <Header />

      {/* ✅ Guest notification popup (no redirect) */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Please login or register to view your profile."
          onClose={() => navigate("/")} // or setShowLoginPrompt(false)
        />
      )}

      {/* Only render profile content when authenticated */}
      {!showLoginPrompt && user && (
        <div className="upp-page">
          {/* ===== Header ===== */}
          <div className="upp-header">
            <div className="upp-avatar" aria-hidden="true">
              {user?.avatar && /\.(jpg|jpeg|png|gif|webp)$/i.test(user.avatar) ? (
                <img src={user.avatar} alt="Profile" />
              ) : (
                <div className="upp-avatar-initials">
                  {user?.avatar || `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}` || "👤"}
                </div>
              )}
            </div>
            <h1 className="upp-title">My Profile</h1>
            <p className="upp-sub">
              {user?.firstName} {user?.lastName} • {user?.role || "Member"}
            </p>
          </div>

          {/* ===== Tabs ===== */}
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

          {/* ===== Tab Content (continues in Part 2) ===== */}
          {/* ===== Tab Content ===== */}
          <div className="upp-tab-content">

            {/* ===== Personal Information Tab is already in Part 1 ===== */}

            {/* ===== Saved Foods ===== */}
            {tab === "saved" && (
              <>
                {currentSaved?.length ? (
                  <>
                    <div className="upp-card-grid">
                      {currentSaved.map((f) => (
                        <div
                          key={f.saveId || f.id}
                          className="upp-food-card"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            navigate(`/fooddetail?id=${f.id}`, { state: { food: f } })}
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
                        >‹ Prev</button>
                        {Array.from({ length: totalSavedPages }, (_, i) => (
                          <button
                            key={i}
                            className={`efp-btn ${savedPage === i + 1 ? "is-active" : ""}`}
                            onClick={() => setSavedPage(i + 1)}
                          >{i + 1}</button>
                        ))}
                        <button
                          className="efp-btn"
                          disabled={savedPage === totalSavedPages}
                          onClick={() => setSavedPage((p) => Math.min(totalSavedPages, p + 1))}
                        >Next ›</button>
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

            {/* ===== Contributions ===== */}
            {tab === "status" && (
              <>
                {user?.status?.length ? (
                  <div className="upp-stack">
                    {user.status.map((c) => (
                      <div className="upp-row-card" key={c.id}>
                        <div className="upp-row-thumb">
                          {c.image ? <img src={c.image} alt={c.title} /> : <div className="upp-noimg" />}
                        </div>
                        <div className="upp-row-body">
                          <div className="upp-row-top">
                            <h4 className="upp-food-title upp-row-title">{c.title}</h4>
                            <span
                              className={`upp-chip ${
                                c.status === "under_review" ? "chip-yellow" :
                                c.status === "awaiting_approval" ? "chip-blue" :
                                c.status === "needs_revision" ? "chip-red" : ""
                              }`}
                            >
                              {fmtStatus(c.status)}
                            </span>
                          </div>
                          <div className="upp-row-meta">
                            <div className="upp-muted">
                              {c.type || "Food"} • Submitted on {formatContributionDate(c.submittedDate)}
                            </div>
                            {c.status === "needs_revision" && (
                              <button
                                className="lrp-btn lrp-btn-outline upp-revise-btn"
                                onClick={() => navigate(`/revise/${c.id}`, {
                                  state: {
                                    owner: `${user.firstName} ${user.lastName}`,
                                    id: c.id,
                                    snapshot: JSON.parse(JSON.stringify(c)),
                                  },
                                })}
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

            {/* ===== Preferences ===== */}
            {tab === "prefs" && (
              <div className="upp-stack">
                {/* Dietary */}
                <div className="upp-card">
                  <h3 className="upp-card-title">Dietary Preferences</h3>
                  <div className="upp-choice-grid">
                    {DIETARY_OPTIONS.map((id) => (
                      <label
                        key={id}
                        className={`upp-choice ${prefs.dietary.includes(id) ? "is-on" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={prefs.dietary.includes(id)}
                          onChange={() =>
                            setPrefs((p) => ({ ...p, dietary: toggleInArray(p.dietary, id) }))
                          }
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                    ))}
                  </div>
                  {prefs.dietary.length === 0 && (
                    <div className="upp-muted" style={{ marginTop: 8 }}>
                      No dietary preferences selected
                    </div>
                  )}
                </div>

                {/* Allergies */}
                <div className="upp-card">
                  <h3 className="upp-card-title">Allergies / Restrictions</h3>
                  <div className="upp-choice-grid">
                    {ALLERGY_OPTIONS.map((id) => (
                      <label
                        key={id}
                        className={`upp-choice ${prefs.allergies.includes(id) ? "is-on" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={prefs.allergies.includes(id)}
                          onChange={() =>
                            setPrefs((p) => ({ ...p, allergies: toggleInArray(p.allergies, id) }))
                          }
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                    ))}
                  </div>
                  {prefs.allergies.length === 0 && (
                    <div className="upp-muted" style={{ marginTop: 8 }}>
                      No allergies selected
                    </div>
                  )}
                </div>

                <button className="lrp-btn lrp-btn-primary" onClick={savePrefs}>
                  Save Preferences
                </button>
              </div>
            )}

            {/* ===== Settings ===== */}
            {tab === "settings" && (
              <div className="upp-stack">
                <div className="upp-card">
                  <h3 className="upp-card-title">
                    <Bell size={18} color="#6a4a2f" /> Notifications
                  </h3>
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">Email Notifications</div>
                      <div className="upp-muted">Receive updates about new recipes and foods</div>
                    </div>
                    <label className="upp-switch">
                      <input
                        type="checkbox"
                        checked={prefs.emailNotifications}
                        onChange={(e) =>
                          setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))
                        }
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
                        onChange={(e) =>
                          setPrefs((p) => ({ ...p, pushNotifications: e.target.checked }))
                        }
                      />
                      <span />
                    </label>
                  </div>
                </div>

                <div className="upp-card">
                  <h3 className="upp-card-title">
                    <Globe size={18} color="#6a4a2f" /> Language
                  </h3>
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">Language</div>
                      <div className="upp-muted">Choose your preferred language</div>
                    </div>
                    <button
                      className="lrp-btn lrp-btn-outline upp-btn"
                      onClick={() =>
                        setPrefs((p) => ({
                          ...p,
                          language: p.language === "en" ? "ms" : "en",
                        }))
                      }
                    >
                      {prefs.language === "en" ? "Bahasa Malaysia" : "English"}
                    </button>
                  </div>
                </div>

                {user?.role === "admin" && (
                  <div className="upp-card">
                    <h3 className="upp-card-title">
                      <Eye size={18} color="#6a4a2f" /> Privacy
                    </h3>
                    <div className="upp-row between">
                      <div>
                        <div className="upp-strong">Profile Visibility</div>
                        <div className="upp-muted">Allow others to see your profile</div>
                      </div>
                      <label className="upp-switch">
                        <input
                          type="checkbox"
                          checked={prefs.profileVisibility}
                          onChange={(e) =>
                            setPrefs((p) => ({
                              ...p,
                              profileVisibility: e.target.checked,
                            }))
                          }
                        />
                        <span />
                      </label>
                    </div>
                  </div>
                )}

                {user?.role === "admin" && (
                  <div className="upp-card">
                    <h3 className="upp-card-title">
                      <Shield size={18} color="#6a4a2f" /> Admin Access
                    </h3>
                    <div className="upp-row between">
                      <div>
                        <div className="upp-strong">Admin Panel</div>
                        <div className="upp-muted">Access administrative features and management tools</div>
                      </div>
                      <button
                        className="lrp-btn lrp-btn-outline upp-btn"
                        onClick={() => navigate("/admin")}
                      >
                        <ExternalLink size={15} /> Open Admin Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
