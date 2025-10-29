// ✅UserProfilePage.jsx – Final Version with Guest Popup & Avatar Upload
// - Shows Login Prompt Modal instead of redirecting for guests
// - Supports /profile & /profile/:userProfileID
// - Keeps saved foods, contributions, preferences, settings, stats
// - ✅ Added avatar upload functionality

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/UserProfilePage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Bell, Eye, Globe, Shield, ExternalLink, OctagonX, Camera, X } from "lucide-react";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Guest popup

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Options
const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "halal", "gluten-free", "dairy-free", "low-fat", "high-protein", "spicy", "None"
];
const ALLERGY_OPTIONS = [
  "tree-nuts", "peanuts", "seafood", "shellfish", "egg", "soy", "sesame", "wheat", "no-spicy", "None"
];

const DEFAULT_PREFS = {
  dietary: [],
  allergies: [],
  emailNotifications: true,
  pushNotifications: true,
  profileVisibility: true,
  language: "en"
};

const uploadAvatar = async () => {
  if (!avatarFile) {
    alert('Please select an image first');
    return;
  }

  try {
    setIsUploadingAvatar(true);
    
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    // ✅ DEBUG: Log the exact URL being called
    const uploadUrl = `${API_BASE_URL}/api/userProfile/avatar`;
    console.log('🔍 Uploading to URL:', uploadUrl);
    console.log('🔍 Full API_BASE_URL:', API_BASE_URL);

    const res = await fetch(uploadUrl, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    console.log('🔍 Response status:', res.status);
    console.log('🔍 Response headers:', res.headers);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Server error response:', errorText);
      throw new Error(`Failed to upload avatar (${res.status}): ${errorText}`);
    }

    const result = await res.json();
    
    if (result.success) {
      // Update user state with new avatar
      setUser(prev => ({ ...prev, avatar: result.avatarUrl }));
      alert('Avatar updated successfully!');
      closeAvatarModal();
      
      // Reload the profile to get updated data
      const endpoint = userProfileID
        ? `${API_BASE_URL}/api/userProfile/${userProfileID}`
        : `${API_BASE_URL}/api/userProfile`;
      const r2 = await fetch(endpoint, { credentials: "include" });
      if (r2.ok) {
        const updatedUser = await r2.json();
        setUser(updatedUser);
      }
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Avatar upload error:', error);
    alert(error.message || 'Failed to upload avatar');
  } finally {
    setIsUploadingAvatar(false);
  }
};

const normalizePrefs = (data = {}) => {
  const dietary = Array.isArray(data.dietary) ? data.dietary : 
                 (typeof data.dietary === 'string' ? JSON.parse(data.dietary || "[]") : []);
  
  const allergies = Array.isArray(data.allergies) ? data.allergies : 
                   (typeof data.allergies === 'string' ? JSON.parse(data.allergies || "[]") : []);
  return {
    ...DEFAULT_PREFS,
    dietary: dietary,
    allergies: allergies,
    emailNotifications: data.emailNotifications ?? true,
    pushNotifications: data.pushNotifications ?? true,
    profileVisibility: data.profileVisibility ?? true,
    language: data.language || "en"
  };
};

const toggleInArray = (arr, value) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

const fmtStatus = (s) => {
  if (!s) return "Unknown";
  
  const statusMap = {
    "approved": "Approved",
    "pending": "Pending Review", 
    "rejected": "Rejected",
    "Approved": "Approved",
    "Pending": "Pending Review",
    "Rejected": "Rejected"
  };
  
  return statusMap[s] || "Unknown";
};

const formatContributionDate = (dateString) => {
  if (!dateString) return "Date not available";
  const d = new Date(dateString);
  return isNaN(d.getTime())
    ? "Date not available"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export default function UserProfilePage() {
  const { userProfileID } = useParams();
  const navigate = useNavigate();

  // State
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", location: "" });
  const [bio, setBio] = useState("");

  const [tab, setTab] = useState("info");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // ✅ Guest popup control

  // ✅ Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Saved Foods Pagination
  const [savedPage, setSavedPage] = useState(1);
  const [currentSaved, setCurrentSaved] = useState([]);
  const [totalSavedPages, setTotalSavedPages] = useState(1);

  // ✅ Fetch Profile Data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        const endpoint = userProfileID
          ? `${API_BASE_URL}/api/userProfile/${userProfileID}`
          : `${API_BASE_URL}/api/userProfile`;

        console.log("🔍 Fetching profile from:", endpoint);
      
        const res = await fetch(endpoint, { 
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log("🔍 Response status:", res.status);

        if (res.status === 401) {
          // ✅ Show login popup instead of redirect/logout
          setShowLoginPrompt(true);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Server response not OK:", errorText);
          throw new Error(`Failed to load profile (status ${res.status})`);
        }

        const data = await res.json();
        console.log("🔍 Profile data received:", data);

        console.log("🔍 Does data have savedFoods?", 'savedFoods' in data);
        console.log("🔍 All keys in data:", Object.keys(data));
        
        if (!data || !data.userID) {
          throw new Error(data?.error || "Profile not found or server error");
        }
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
        setError(err.message || "Unable to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userProfileID]);

  // Delete account handler - Backend password verification
  const handleDeleteAccount = async () => {
    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will remove all your data."
    );
    
    if (!confirmed) return;

    // Ask for password to verify
    const password = prompt("For security, please enter your password to confirm account deletion:");
    
    if (!password) {
      alert("Account deletion cancelled.");
      return;
    }

    try {
      // Verify password with backend
      const verifyRes = await fetch(`${API_BASE_URL}/api/auth/verifyAccountDeletion`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        alert(verifyData.error || "Incorrect password. Account deletion cancelled.");
        return;
      }

      console.log("Password verified");

      // Delete account (backend handles both MySQL and Firebase)
      const res = await fetch(`${API_BASE_URL}/api/userProfile/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert('Account deleted successfully');
        window.location.href = '/';
      } else {
        alert(data.error || 'Failed to delete account');
      }
      
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  // ✅ Pagination for saved foods
  useEffect(() => {
    const savedFoodsArray = user?.savedFoods || [];
    if (Array.isArray(savedFoodsArray)) {
      const perPage = 6;
      const start = (savedPage - 1) * perPage;
      const items = savedFoodsArray.slice(start, start + perPage);
      setCurrentSaved(items);
      setTotalSavedPages(Math.ceil(savedFoodsArray.length / perPage));
    } else {
      setCurrentSaved([]);
      setTotalSavedPages(1);
    }
  }, [user, user?.savedFoods, savedPage]);

  // ===== ✅ Avatar Upload Functions =====
  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      alert('Please select an image first');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch(`${API_BASE_URL}/api/userProfile/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to upload avatar (${res.status})`);
      }

      const result = await res.json();
      
      if (result.success) {
        // Update user state with new avatar
        setUser(prev => ({ ...prev, avatar: result.avatarUrl }));
        alert('Avatar updated successfully!');
        closeAvatarModal();
        
        // Reload the profile to get updated data
        const endpoint = userProfileID
          ? `${API_BASE_URL}/api/userProfile/${userProfileID}`
          : `${API_BASE_URL}/api/userProfile`;
        const r2 = await fetch(endpoint, { credentials: "include" });
        if (r2.ok) {
          const updatedUser = await r2.json();
          setUser(updatedUser);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your avatar?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/userProfile/avatar`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to remove avatar (${res.status})`);
      }

      const result = await res.json();
      
      if (result.success) {
        // Update user state to remove avatar
        setUser(prev => ({ ...prev, avatar: null }));
        alert('Avatar removed successfully!');
        closeAvatarModal();
        
        // Reload the profile
        const endpoint = userProfileID
          ? `${API_BASE_URL}/api/userProfile/${userProfileID}`
          : `${API_BASE_URL}/api/userProfile`;
        const r2 = await fetch(endpoint, { credentials: "include" });
        if (r2.ok) {
          const updatedUser = await r2.json();
          setUser(updatedUser);
        }
      } else {
        throw new Error(result.error || 'Remove failed');
      }
    } catch (error) {
      console.error('Avatar remove error:', error);
      alert(error.message || 'Failed to remove avatar');
    }
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
    setAvatarPreview(null);
    setAvatarFile(null);
    // Clear file input
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
  };

  // ===== Save: Personal Info =====
  const savePersonal = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/userProfile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          location: form.location, 
          bio: bio 
        }),
      });
      
      if (!res.ok) throw new Error(`Failed to update profile (${res.status})`);
      
      const result = await res.json();
      if (result.success) {
        alert("Profile updated successfully!");

        // Reload the user after update
        const endpoint = userProfileID
          ? `${API_BASE_URL}/api/userProfile/${userProfileID}`
          : `${API_BASE_URL}/api/userProfile`;
        const r2 = await fetch(endpoint, { credentials: "include" });
        if (r2.ok) setUser(await r2.json());
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (e) {
      alert(e.message);
      console.error("Update error:", e);
    }
  };

  // ===== Save: Preferences =====
  const savePrefs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/userProfile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          dietary: prefs.dietary,
          allergies: prefs.allergies,
          emailNotifications: prefs.emailNotifications,
          pushNotifications: prefs.pushNotifications,
          profileVisibility: prefs.profileVisibility,
          language: prefs.language
        }),
      });
      
      if (!res.ok) throw new Error(`Failed to update preferences (${res.status})`);
      
      const result = await res.json();
      if (result.success) {
        alert("Preferences updated successfully!");
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (e) {
      alert(e.message);
      console.error("Preferences update error:", e);
    }
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page"><div className="upp-loading">Loading profile…</div></div>
        <Footer />
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error && !showLoginPrompt) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page">
          <h2 className="upp-404-h2">Error Loading Profile</h2>
          <p className="upp-error-message">{error}</p>
          <button className="lrp-btn lrp-btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // ===== MAIN UI START =====
  return (
    <div className="user-profile-page">
      <Header />

      {/* ✅ If guest, show pop-up modal instead of redirect */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Please login or register to view your profile."
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}

      {/* ✅ Avatar Upload Modal */}
      {showAvatarModal && (
        <div className="upp-modal-overlay">
          <div className="upp-modal">
            <div className="upp-modal-header">
              <h3>Change Avatar</h3>
              <button className="upp-modal-close" onClick={closeAvatarModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="upp-modal-body">
              <div className="upp-avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="Current Avatar" />
                ) : (
                  <div className="upp-avatar-initials-large">
                    {(user?.firstName?.[0] || "").toUpperCase()}
                    {(user?.lastName?.[0] || "").toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="upp-avatar-actions">
                <label htmlFor="avatar-upload" className="lrp-btn lrp-btn-primary">
                  <Camera size={16} />
                  Choose Image
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileSelect}
                  style={{ display: 'none' }}
                />
                
                {user?.avatar && (
                  <button 
                    className="lrp-btn lrp-btn-outline upp-btn--danger" 
                    onClick={removeAvatar}
                    type="button"
                  >
                    Remove Current
                  </button>
                )}
              </div>
              
              <div className="upp-avatar-help">
                <p>Supported formats: JPEG, JPG, PNG, GIF, WebP, SVG, BMP</p>
                <p>Max file size: 5MB</p>
              </div>
            </div>
            
            <div className="upp-modal-footer">
              <button 
                className="lrp-btn lrp-btn-outline" 
                onClick={closeAvatarModal}
                disabled={isUploadingAvatar}
              >
                Cancel
              </button>
              <button 
                className="lrp-btn lrp-btn-primary" 
                onClick={uploadAvatar}
                disabled={!avatarFile || isUploadingAvatar}
              >
                {isUploadingAvatar ? 'Uploading...' : 'Save Avatar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Only render profile if user exists & not guest */}
      {!showLoginPrompt && user && (
        <div className="upp-page">
          {/* ===== USER HEADER ===== */}
          <div className="upp-header">
            <div 
              className="upp-avatar upp-avatar-editable" 
              onClick={handleAvatarClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAvatarClick();
                }
              }}
              aria-label="Change avatar"
            >
              {user?.avatar && /\.(jpg|jpeg|png|gif|webp)$/i.test(user.avatar) ? (
                <>
                  <img src={user.avatar} alt="Profile Avatar" />
                  <div className="upp-avatar-overlay">
                    <Camera size={20} />
                  </div>
                </>
              ) : (
                <div className="upp-avatar-initials">
                  {(user?.firstName?.[0] || "").toUpperCase()}
                  {(user?.lastName?.[0] || "").toUpperCase()}
                  <div className="upp-avatar-overlay">
                    <Camera size={16} />
                  </div>
                </div>
              )}
            </div>
            <h1 className="upp-title">My Profile</h1>
            <p className="upp-sub">
              {user?.firstName} {user?.lastName} • {user?.role || "Member"}
            </p>
          </div>

          {/* ===== TABS ===== */}
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

          {/* ===== TAB CONTENT ===== */}
          <div className="upp-tab-content">
            {/* ===== Personal Information ===== */}
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

                    {/* Email & Location side-by-side for consistent styling */}
                    <div className="upp-form-grid">
                      <label>
                        <span>Email</span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        />
                      </label>

                      <label>
                        <span>Location</span>
                        <input
                          value={form.location}
                          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                        />
                      </label>
                    </div>

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

                    <button className="lrp-btn lrp-btn-primary" onClick={savePersonal}>
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Sidebar stats */}
                <aside className="upp-sticky">
                  <div className="upp-card">
                    <h3 className="upp-card-title">My Contributions</h3>
                    <div className="upp-stat">
                      <div className="upp-stat-val">{user?.stats?.recipes || 0}</div>
                      <div className="upp-muted">recipes shared</div>
                    </div>
                    <div className="upp-stat">
                      <div className="upp-stat-val">{user?.stats?.posts || 0}</div>
                      <div className="upp-muted">stories shared</div>
                    </div>
                    <div className="upp-stat">
                      <div className="upp-stat-val">{user?.stats?.likes || 0}</div>
                      <div className="upp-muted">likes received</div>
                    </div>
                  </div>
                </aside>
              </div>
            )}

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
                          onClick={() => navigate(`/fooddetail/${f.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              navigate(`/fooddetail/${f.id}`);
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

            {/* ===== Contributions (Status) ===== */}
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
                                c.status === "approved" || c.status === "Approved"
                                  ? "chip-blue"
                                  : c.status === "pending" || c.status === "Pending"
                                  ? "chip-yellow"
                                  : c.status === "rejected" || c.status === "Rejected"
                                  ? "chip-red"
                                  : "chip-gray"
                              }`}
                            >
                              {fmtStatus(c.status)}
                            </span>
                          </div>
                          <div className="upp-row-meta">
                            <div className="upp-muted">
                              {c.type || "Food"} • Submitted on {formatContributionDate(c.submittedDate)}
                            </div>
                            {(c.status === "needs_revision" || c.status === "rejected" || c.status === "Rejected") && (
                              <button
                                className="lrp-btn lrp-btn-outline upp-revise-btn"
                                onClick={() => {
                                  // ✅ Navigate to different pages based on contribution type
                                  if (c.type === "community" || c.type === "post" || c.type === "story") {
                                    // Navigate to community post revision page
                                    navigate("/revisecommunitypostpage", {
                                      state: {
                                        contribution: c,
                                        user: user,
                                        id: c.id,
                                        snapshot: JSON.parse(JSON.stringify(c)),
                                      },
                                    });
                                  } else {
                                    // Navigate to food revision page
                                    navigate(`/revise/${c.id}`, {
                                      state: {
                                        owner: `${user.firstName} ${user.lastName}`,
                                        id: c.id,
                                        snapshot: JSON.parse(JSON.stringify(c)),
                                        contributionData: c,
                                        adminFeedback: c.feedback,
                                        fieldsWithIssues: c.fieldsWithIssues || []
                                      },
                                    });
                                  }
                                }}
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

            {/* ===== Preferences ===== */}
            {tab === "prefs" && (
              <div className="upp-stack">
                {/* Dietary */}
                <div className="upp-card">
                  <h3 className="upp-card-title">Dietary Preferences</h3>
                  <div className="upp-choice-grid">
                    {DIETARY_OPTIONS.map((id) => (
                      <label key={id} className={`upp-choice ${prefs.dietary.includes(id) ? "is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={prefs.dietary.includes(id)}
                          onChange={() => setPrefs((p) => ({ ...p, dietary: toggleInArray(p.dietary, id) }))}
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                    ))}
                  </div>
                  {prefs.dietary.length === 0 && <div className="upp-muted" style={{ marginTop: 8 }}>No dietary preferences selected</div>}
                </div>

                {/* Allergies */}
                <div className="upp-card">
                  <h3 className="upp-card-title">Allergies / Restrictions</h3>
                  <div className="upp-choice-grid">
                    {ALLERGY_OPTIONS.map((id) => (
                      <label key={id} className={`upp-choice ${prefs.allergies.includes(id) ? "is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={prefs.allergies.includes(id)}
                          onChange={() => setPrefs((p) => ({ ...p, allergies: toggleInArray(p.allergies, id) }))}
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                    ))}
                  </div>
                  {prefs.allergies.length === 0 && <div className="upp-muted" style={{ marginTop: 8 }}>No allergies selected</div>}
                </div>

                <button className="lrp-btn lrp-btn-primary" onClick={savePrefs}>Save Preferences</button>
              </div>
            )}

            {/* ===== Settings ===== */}
            {tab === "settings" && (
              <div className="upp-stack">
                <div className="upp-card">
                  <h3 className="upp-card-title"><Bell className="rdp-sec-icon" color={"#6a4a2f"} /> Notifications</h3>
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
                  <h3 className="upp-card-title"><Globe className="rdp-sec-icon" color={"#6a4a2f"} /> Language</h3>
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
                  <h3 className="upp-card-title"><Eye className="rdp-sec-icon" color={"#6a4a2f"}/> Privacy</h3>
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

                {user?.role === "admin" && (
                  <div className="upp-card">
                    <h3 className="upp-card-title"><Shield className="rdp-sec-icon" color={"#6a4a2f"} /> Admin Access</h3>
                    <div className="upp-row between">
                      <div>
                        <div className="upp-strong">Admin Panel</div>
                        <div className="upp-muted">Access administrative features and management tools</div>
                      </div>
                      <button className="lrp-btn lrp-btn-outline upp-btn" onClick={() => navigate("/admin")}>
                        <ExternalLink className="rdp-sec-icon" /> Open Admin Dashboard
                      </button>
                    </div>
                  </div>
                )}

                <div className="upp-card">
                  <h3 className="upp-card-title"><OctagonX className="rdp-sec-icon" color={"#6a4a2f"}/> Account Deletion</h3>
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">Delete Account</div>
                      <div className="upp-muted">Permanently remove your account and all associated data.</div>
                    </div>
                    <button
                      type="button"
                      className="lrp-btn lrp-btn-outline upp-btn upp-btn--danger"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}