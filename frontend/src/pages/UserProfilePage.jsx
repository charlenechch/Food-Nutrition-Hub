import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/UserProfilePage.css";
import "../css/lrp.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Bell, Eye, EyeOff, Globe, Shield, ExternalLink, OctagonX, Camera, X, AlertTriangle, CheckCircle2, Trash2, Lock } from "lucide-react";
import LoginPromptModal from "../components/LoginPromptModal"; // ✅ Guest popup
import Modal from "../components/Modal";
import { useTranslation } from "react-i18next";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


// Options
const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "halal", "gluten-free", "dairy-free", "low-fat", "high-protein", "spicy"
];
const ALLERGY_OPTIONS = [
  "tree-nuts", "peanuts", "seafood", "shellfish", "egg", "soy", "sesame", "wheat", "no-spicy"
];

const DEFAULT_PREFS = {
  dietary: [],
  allergies: [],
  emailNotifications: true,
  pushNotifications: true,
  profileVisibility: true,
  language: "en"
};

// Better normalization that ensures clean string arrays
const normalizePrefs = (data = {}) => {
  const prefsData = data.prefs || data;

  // Enhanced array normalizer
  const ensureCleanArray = (value) => {
    console.log("🔄 Raw value to normalize:", value);
    
    let resultArray = [];
    
    if (Array.isArray(value)) {
      resultArray = value.map(item => 
        typeof item === 'string' ? item.trim() : String(item).trim()
      );
    } else if (typeof value === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          resultArray = parsed.map(item => 
            typeof item === 'string' ? item.trim() : String(item).trim()
          );
        } else {
          resultArray = [String(parsed).trim()];
        }
      } catch (e) {
        // If not JSON, use as is
        resultArray = value.trim() ? [value.trim()] : [];
      }
    } else if (value && typeof value === 'object') {
      // Convert object to array (handle the case where it's object-like)
      resultArray = Object.values(value)
        .map(item => typeof item === 'string' ? item.trim() : String(item).trim())
        .filter(item => item !== '' && item !== 'null' && item !== 'undefined');
    }
    
    // Final cleanup - ensure all values are valid strings
    const finalArray = resultArray
      .filter(item => item && typeof item === 'string')
      .map(item => item.substring(0, 60)); // Enforce max length like backend
    
    console.log("✅ Normalized array result:", finalArray);
    return finalArray;
  };

  const normalized = {
    dietary: ensureCleanArray(prefsData.dietary),
    allergies: ensureCleanArray(prefsData.allergies),
    emailNotifications: Boolean(prefsData.emailNotifications ?? true),
    pushNotifications: Boolean(prefsData.pushNotifications ?? true),
    profileVisibility: Boolean(prefsData.profileVisibility ?? true),
    language: prefsData.language || "en"
  };

  console.log("🎯 Final normalized prefs:", normalized);
  return normalized;
};

const toggleInArray = (arr, value) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

const isCommunity = (c) => {
  const type = (c?.type || "").toLowerCase();
  return type === "community";
};

const isRecipe = (c) => {
    return c && c.foodName !== undefined;
  };

const byDateDesc = (a, b) => {
  const dateA = new Date(a?.submittedDate || a?.created_at || 0);
  const dateB = new Date(b?.submittedDate || b?.created_at || 0);
  return dateB - dateA;
};

// Helper function for status classes
const getStatusClass = (status) => {
  const statusMap = {
    "approved": "chip-blue",
    "pending": "chip-yellow", 
    "rejected": "chip-red",
    "Approved": "chip-blue",
    "Pending": "chip-yellow",
    "Rejected": "chip-red"
  };
  return statusMap[status] || "chip-gray";
};


// GAMIFICATION: USER XP BAR COMPONENT
const calculateLevelInfo = (totalXp, highestLevel) => {
  const safeXpForMath = Math.max(0, totalXp);
  const naturalLevel = Math.floor(1 + Math.pow(safeXpForMath / 100, 2/3));
  
  const displayLevel = Math.max(naturalLevel, highestLevel || 1);

  const currentBaseXp = Math.floor(100 * Math.pow(displayLevel - 1, 1.5));
  const nextBaseXp = Math.floor(100 * Math.pow(displayLevel, 1.5));

  const levelSize = nextBaseXp - currentBaseXp;
  const xpIntoLevel = totalXp - currentBaseXp;

  let progressPercent = 0;
  if (xpIntoLevel > 0) {
    progressPercent = (xpIntoLevel / levelSize) * 100;
  }
  
  progressPercent = Math.min(100, progressPercent);

  return {
    level: displayLevel,
    relativeCurrentXp: Math.max(0, Math.floor(xpIntoLevel)), 
    relativeNextXp: levelSize,
    progressPercent: progressPercent
  };
};

const UserXpBar = ({ totalXp, highestLevel }) => {
  const info = calculateLevelInfo(totalXp, highestLevel);
  const navigate = useNavigate(); 

  return (
    <div 
      className="xp-bar-container xp-bar-clickable" 
      onClick={() => navigate('/xplogs')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate('/xplogs'); }}
    >
      <div className="xp-bar-header">
        <div className="xp-level-badge">Lvl {info.level}</div>
        <div className="xp-numbers">
          <span className="xp-current">{info.relativeCurrentXp}</span>
          <span className="xp-divider"> / </span>
          <span className="xp-next">{info.relativeNextXp} XP</span>
        </div>
      </div>
      <div className="xp-track">
        <div
          className="xp-fill"
          style={{ width: `${info.progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function UserProfilePage() {
  const { t } = useTranslation();
  const { userProfileID } = useParams();
  const navigate = useNavigate();
  const { setBypassSessionCheck } = useAuth();
  //Controls view and edit mode
  const [isEditing, setIsEditing] = useState(false);

  //CSRF Token State
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

  const fmtStatus = (s) => {
    if (!s) return t("profile.unknown");
    
    const statusMap = {
        "approved": t("profile.statusApproved"),
        "pending": t("profile.statusPending"),
        "rejected": t("profile.statusRejected"),
        "Approved": t("profile.statusApproved"),
        "Pending": t("profile.statusPending"),
        "Rejected": t("profile.statusRejected")
      };
      
      return statusMap[s] || t("profile.unknown");
  };

const formatContributionDate = (dateString) => {
  if (!dateString) return t("profile.dateNotAvailable");
  const d = new Date(dateString);
  return isNaN(d.getTime())
    ? t("profile.dateNotAvailable")
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

  // Export State
  const [exportModal, setExportModal] = useState({
    open: false,
    title: '',
    loading: false,
    includeProfile: false,
    selectedFoods: [],
    selectedRecipes: [],
    selectedPosts: [],
    selectedLikedPosts: [],
    expandedType: null,
    exportRecipes: [],
    exportPosts: [],
    exportLikedPosts: [],
    exportLoading: false,
  });

  // State
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", location: "" });
  const [bio, setBio] = useState("");

  const [tab, setTab] = useState(() => {
  // ✅ Read URL param immediately on first load
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get("tab");
  const validTabs = ["info", "saved", "status", "prefs", "settings"];
  
  return validTabs.includes(requestedTab) ? requestedTab : "info";
});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // ✅ Guest popup control

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Saved Foods Pagination
  const [savedPage, setSavedPage] = useState(1);
  const [currentSaved, setCurrentSaved] = useState([]);
  const [totalSavedPages, setTotalSavedPages] = useState(1);
  const [recipePage, setRecipePage] = useState(1);
  const [postPage, setPostPage] = useState(1);

  //recipe contributions
  const [recipeContributions, setRecipeContributions] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // Community Posts State
  const [communityPosts, setCommunityPosts] = useState([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  // Generic alert dialog
  const [dlg, setDlg] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    primaryText: "",
    onPrimary: null,
  });
  const closeDlg = () =>
    setDlg(m => ({ ...m, open: false, onPrimary: null }));

  const openAlert = (title, message, icon, onPrimary) =>
    setDlg({ open: true, title, message, icon, primaryText: t("profile.ok"), onPrimary: () => {try { onPrimary?.(); } finally { closeDlg(); }},});

  // Confirm dialog
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    icon: null,
    confirmText: "",
    cancelText: "",
    onConfirm: null,
  });
  const closeConfirm = () =>
    setConfirm(m => ({ ...m, open: false, onConfirm: null }));

  const openConfirm = (opts) =>
    setConfirm({
      open: true,
      title: opts.title || t("profile.confirm"),
      message: opts.message || "",
      confirmText: opts.confirmText || t("profile.confirm"),
      cancelText: opts.cancelText || t("profile.cancel"),
      onConfirm: async () => {
        closeConfirm();
        await opts.onConfirm?.();
      },
    });

  // Password modal (for account deletion)
  const [pwModal, setPwModal] = useState({
    open: false,
    title: "",
    message: "",
    password: "",
    onSubmit: null,
  });
  const openPasswordModal = (onSubmit) =>
    setPwModal({ open: true, title: t("profile.confirmDeletion"), message: t("profile.confirmDeletionMsg"), password: "", onSubmit });
  const closePasswordModal = () =>
    setPwModal(m => ({ ...m, open: false, onSubmit: null, password: "" }));

  const fetchExportData = async () => {
    setExportModal(m => ({ ...m, exportLoading: true }));
    try {
      const [recipesRes, postsRes, likedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/recipe/user/${user.userID}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/communityPost/user/${user.userID}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/communityPost/liked/${user.userID}`, { credentials: 'include' }),
      ]);
      const recipesData = recipesRes.ok ? await recipesRes.json() : { data: [] };
      const postsData = postsRes.ok ? await postsRes.json() : [];
      const likedData = likedRes.ok ? await likedRes.json() : [];
      setExportModal(m => ({
        ...m,
        exportRecipes: (recipesData.data || []).map(r => ({ ...r, id: r.recipeID || r.id })),
        exportPosts: Array.isArray(postsData) ? postsData : postsData.data || [],
        exportLikedPosts: Array.isArray(likedData) ? likedData : likedData.data || [],
        exportLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch export data:', error);
      setExportModal(m => ({ ...m, exportLoading: false }));
    }
  };

  const openExportModal = () => {
    setExportModal({
      open: true,
      title: t("profile.exportTitle"),
      message: t("profile.exportMsg"),
      loading: false,
      includeProfile: false,
      selectedFoods: [], // Start with none selected
      selectedRecipes: [],
      selectedPosts: [],
      selectedLikedPosts: [],
      expandedType: null,
      exportRecipes: [],
      exportPosts: [],
      exportLikedPosts: [],
      exportLoading: false,
    });
    fetchExportData();
  };

const closeExportModal = () => {
  setExportModal(m => ({ ...m, open: false, loading: false }));
};

// Toggle individual food selection
const toggleFoodSelection = (saveId) => {
  console.log('🔍 Toggling selection for saveId:', saveId);
  console.log('🔍 saveId type:', typeof saveId);

  setExportModal(m => {
    const newSelected = m.selectedFoods.includes(saveId)
      ? m.selectedFoods.filter(id => id !== saveId)
      : [...m.selectedFoods, saveId];
    
    return {
      ...m,
      selectedFoods: newSelected,
      selectAll: newSelected.length === (user?.savedFoods?.length || 0)
    };
  });
};

// Toggle select all
const toggleSelectAll = () => {
  setExportModal(m => {
    const savedFoodsArray = user?.savedFoods || [];
    const selectAll = !m.selectAll;
    
    return {
      ...m,
      selectAll: selectAll,
      selectedFoods: selectAll 
        ? savedFoodsArray.map(f => f.saveId)
        : []
    };
  });
};

// Save: Auto-Save Individual Profile Settings
  const toggleSetting = async (settingKey, newValue) => {
    // 1. Update UI instantly
    setPrefs((p) => ({ ...p, [settingKey]: newValue }));

    // Prepare data for backend
    const updateData = {
      dietary: prefs.dietary,
      allergies: prefs.allergies,
      emailNotifications: prefs.emailNotifications,
      pushNotifications: prefs.pushNotifications,
      profileVisibility: prefs.profileVisibility,
      language: prefs.language,
      location: user?.location || "",
      bio: user?.bio || "",
      [settingKey]: newValue // Override with the exact toggle you just clicked
    };

    // Send to database silently
    try {
      await fetch(`${API_BASE_URL}/api/userProfile/update`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
    } catch (e) {
      console.error("Failed to save setting", e);
    }
  };

// Save: Personal Info
const savePersonal = async () => {
  try {
    const updateData = { 
      location: form.location, 
      bio: bio,
      emailNotifications: prefs.emailNotifications,
      pushNotifications: prefs.pushNotifications,
      profileVisibility: prefs.profileVisibility,
      language: prefs.language,
      dietary: prefs.dietary,
      allergies: prefs.allergies
    };
    
    console.log("📤 Saving personal info:", updateData);
    
    const res = await fetch(`${API_BASE_URL}/api/userProfile/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
       },
      credentials: "include",
      body: JSON.stringify(updateData),
    });
    
    console.log("📥 Personal info response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Personal info update error:", errorText);
      throw new Error(`Failed to update profile (${res.status}): ${errorText}`);
    }
    
    const result = await res.json();
    console.log("✅ Personal info update result:", result);
    
    if (result.success) {
      openAlert(t("profile.saved"), t("profile.profileUpdated"), <CheckCircle2 />);
      setUser(prev => ({ ...prev, location: form.location, bio: bio }));
    } else {
      throw new Error(result.error || "Update failed");
    }
  } catch (e) {
    console.error("Personal info update error:", e);
    openAlert(t("profile.updateFailed"), e.message || t("profile.failedUpdateProfile"), <AlertTriangle />);
  }
};

// ===== Save: Preferences =====
const savePrefs = async () => {
  try {
    const preferencesPayload = {
      dietary: prefs.dietary,
      allergies: prefs.allergies,
      emailNotifications: prefs.emailNotifications,
      pushNotifications: prefs.pushNotifications,
      profileVisibility: prefs.profileVisibility,
      language: prefs.language,
      location: user?.location || "",
      bio: user?.bio || ""
    };
    
    console.log("📤 Saving preferences:", preferencesPayload);

    const res = await fetch(`${API_BASE_URL}/api/userProfile/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
       },
      credentials: "include",
      body: JSON.stringify(preferencesPayload),
    });
    
    console.log("📥 Preferences response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Preferences update error:", errorText);
      throw new Error(`Failed to update preferences (${res.status}): ${errorText}`);
    }
    
    const result = await res.json();
    console.log("✅ Preferences update result:", result);
    
    if (result.success) {
      openAlert(t("profile.saved"), t("profile.prefsUpdated"), <CheckCircle2 />);
    } else {
      throw new Error(result.error || "Update failed");
    }
  } catch (e) {
    console.error("Preferences update error:", e);
    openAlert(t("profile.updateFailed"), e.message || t("profile.failedUpdatePrefs"), <AlertTriangle />);
  }
};

const handleExportData = async () => {
  try {
    setExportModal(m => ({ ...m, loading: true }));

    const { includeProfile, selectedFoods, selectedRecipes, selectedPosts, selectedLikedPosts } = exportModal;

    // Derive dataTypes from selections
    const dataTypes = [];
    if (includeProfile) dataTypes.push('profile');
    if (selectedFoods.length > 0) dataTypes.push('savedFoods');
    if (selectedRecipes.length > 0) dataTypes.push('recipes');
    if (selectedPosts.length > 0) dataTypes.push('posts');
    if (selectedLikedPosts.length > 0) dataTypes.push('likedPosts');

    if (dataTypes.length === 0) {
      openAlert(t("profile.noSelection"), t("profile.noSelectionMsg"), <AlertTriangle />);
      setExportModal(m => ({ ...m, loading: false }));
      return;
    }

    let exportPayload = {
      dataTypes,
      saveIds: selectedFoods,
      recipeIds: selectedRecipes,
      postIds: selectedPosts,
      likedPostIds: selectedLikedPosts,
    };
    
    console.log("📤 Exporting saved foods:", exportPayload);
    console.log('📤 JSON stringified:', JSON.stringify(exportPayload));
    
    const res = await fetch(`${API_BASE_URL}/api/export/export/saved-foods`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      credentials: "include",
      body: JSON.stringify(exportPayload),
    });

    console.log('📥 Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Export failed (${res.status}): ${errorText}`);
    }
    
    // Create download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `my-data-export-${timestamp}.pdf`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    openAlert(t("profile.exportComplete"), t("profile.exportCompleteMsg"), <CheckCircle2 />);
    closeExportModal();
    
  } catch (error) {
    console.error("Export error:", error);
    openAlert(t("profile.exportFailed"), error.message || t("profile.exportFailedMsg"), <AlertTriangle />);
    setExportModal(m => ({ ...m, loading: false }));
  }
};

const ContributionRow = ({ c }) => {
  const navigate = useNavigate();

    // 1. Logic to determine if item is Recipe or Community Post
    const isRecipeItem = c?.foodName !== undefined;
    const isCommunityItem = ["community", "post", "story", "community_post"].includes((c?.type || "").toLowerCase());

    const handleRevise = () => {
      if (isRecipeItem) {
        navigate(`/revise/${c.recipeID}`, {
          state: {
            owner: `${user.firstName} ${user.lastName}`,
            id: c.id,
            recipeID: c.recipeID,
            snapshot: JSON.parse(JSON.stringify(c)),
            contribution: c,
            description: c.description || "",
            adminFeedback: c.adminFeedback || c.feedback,
            fieldsWithIssues: c.fieldsWithIssues || [],
          },
        });
      } else if (isCommunityItem) {
        navigate(`/revisecommunitypostpage/${c.id}`, {
          state: {
            owner: `${user.firstName} ${user.lastName}`,
            id: c.id,
            snapshot: JSON.parse(JSON.stringify(c)),
            contribution: c,
            adminFeedback: c.adminFeedback || c.feedback,
            fieldsWithIssues: c.fieldsWithIssues || [],
          },
        });
      }
    };

    // 2. Get Feedback Text Safely
    const feedbackText = c.adminFeedback || c.feedback;

    // 3. Helper to pick color based on status
    const getFeedbackStyle = (status) => {
      const s = (status || "").toLowerCase();
      if (s === "approved") {
        return { bg: "#F0FFF4", border: "#48BB78", text: "#2F855A" }; // Green
      } else if (s === "rejected") {
        return { bg: "#FFF5F5", border: "#E53E3E", text: "#C53030" }; // Red
      } else {
        return { bg: "#EBF8FF", border: "#4299E1", text: "#2B6CB0" }; // Blue (Pending/Default)
      }
    };

    const styles = getFeedbackStyle(c.status);

    return (
      <div className="upp-row-card" key={`${c.type}-${c.id}`}>
        <div className="upp-row-thumb">
          {c.images && c.images.length > 0 ? (
            <img src={c.images[0]} alt={c.foodName || c.title} />
          ) : c.image ? (
            <img src={c.image} alt={c.foodName || c.title} />
          ) : (
            <div className="upp-noimg" />
          )}
        </div>
        <div className="upp-row-body">
          <div className="upp-row-top">
            <h4 className="upp-food-title upp-row-title">{c.foodName || c.title}</h4>
            <span className={`upp-chip ${getStatusClass(c.status)}`}>
              {fmtStatus(c.status)}
            </span>
          </div>

          {/* 👇 MODIFIED: Show Feedback for ALL statuses if text exists 👇 */}
          {feedbackText && (
            <div style={{
              marginTop: "10px",
              padding: "10px",
              backgroundColor: styles.bg,
              borderLeft: `4px solid ${styles.border}`,
              borderRadius: "4px",
              fontSize: "0.9rem",
              color: styles.text,
              marginBottom: "5px",
              // THESE 3 LINES FIX THE OVERFLOW:
              whiteSpace: "pre-wrap",    
              wordBreak: "break-word",   
              overflowWrap: "break-word" 
            }}>
              <strong>{t("profile.adminFeedback")}:</strong> {feedbackText}
            </div>
          )}
          {/* 👆 END MODIFIED BLOCK 👆 */}

          <div className="upp-row-meta">
            <div className="upp-muted">
              {c.culturalOrigin} • {t("profile.submittedOn")}{" "}
              {c.createdAt ? formatContributionDate(c.createdAt) :
                c.submittedDate ? formatContributionDate(c.submittedDate) :
                  'Date not available'}
            </div>

            {/* Revise Button - Keep only for Rejected/Needs Revision AND if viewing own profile */}
            {(!userProfileID && (c.status === "needs_revision" || c.status === "rejected" || c.status === "Rejected")) && (
              <button
                className="lrp-btn lrp-btn-outline upp-revise-btn"
                onClick={handleRevise}
                type="button"
              >
                {t("profile.revise")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Fetch Profile Data
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

  useEffect(() => {
    const fetchRecipeContributions = async () => {
      if (tab === 'status' && user) {
        try {
          setIsLoadingRecipes(true);
          console.log("🔄 Fetching recipe contributions for user:", user.userID);
          
          const res = await fetch(`${API_BASE_URL}/api/recipe/user/${user.userID}`, {
            credentials: "include"
          });

          console.log("📥 Recipe contributions response status:", res.status);
          
          if (res.ok) {
            const data = await res.json();
            console.log("✅ Recipe contributions data received:", data);
            setRecipeContributions(data.data || []);
          } else {
            console.error("❌ Failed to fetch recipe contributions");
            const errorText = await res.text();
            console.error("❌ Error response:", errorText);
          }
        } catch (error) {
          console.error('❌ Error fetching recipe contributions:', error);
        } finally {
          setIsLoadingRecipes(false);
        }
      }
    };

    fetchRecipeContributions();
  }, [tab, user]);

  // Fetch Community Posts separately
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      if (tab === 'status' && user) {
        try {
          setIsLoadingCommunity(true);
          console.log("🔄 Fetching community posts for user:", user.userID);
          const res = await fetch(`${API_BASE_URL}/api/communityPost/user/${user.userID}`, {
            credentials: "include"
          });

        console.log("📥 Community posts response status:", res.status);
        console.log("📥 Community posts response ok:", res.ok);
        console.log("📥 Community posts response headers:", res.headers);
          
          if (res.ok) {
            const data = await res.json();
            console.log("✅ Community posts data received:", data);
            setCommunityPosts(data);
          }else {
          console.error("❌ Failed to fetch community posts - response not ok");
          const errorText = await res.text();
          console.error("❌ Error response:", errorText);
          }
        } catch (error) {
          console.error('Failed to fetch community posts:', error);
          console.error('❌ Error fetching community posts:', error);
        } finally {
          setIsLoadingCommunity(false);
        }
      }
    };

    fetchCommunityPosts();
  }, [tab, user]);

  // Delete account handler - Backend password verification
  const handleDeleteAccount = async () => {
    openConfirm({
      title: t("profile.deleteAccount"),
      message: t("profile.deleteAccountConfirm"),
      confirmText: t("profile.delete"),
      cancelText: t("profile.cancel"),
      onConfirm: () => {
        // Step 2: ask for password in controlled modal
        openPasswordModal(async (password) => {
          // State to track error inside the password modal
          setPwModal(m => ({ ...m, loading: true, error: null }));

          try {
            // Verify password with backend
            const verifyRes = await fetch(`${API_BASE_URL}/api/auth/verifyAccountDeletion`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
              body: JSON.stringify({ password })
            });

            if (!verifyRes.ok) {
                  const verifyData = await verifyRes.json().catch(() => ({}));
                
                  closePasswordModal(); 

                  openAlert(
                      t("profile.verificationFailed"),
                      verifyData.error || t("profile.incorrectPassword"),
                      <AlertTriangle />
                  );
                    return;
                }

            console.log("Password verified");

            // Delete account (backend handles both MySQL and Firebase)
            const res = await fetch(`${API_BASE_URL}/api/userProfile/delete`, {
              method: 'DELETE',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json',
              "X-CSRF-Token": csrfToken
               }
            });
            
            const data = await res.json().catch(() => ({}));
            
            if (res.ok && data.success) {
                openAlert(t("profile.accountDeleted"), t("profile.accountDeletedMsg"), <CheckCircle2 />, () => {
                  closeDlg();
                  window.location.href = '/';
                });
            } else {
              openAlert(t("profile.deleteFailed"), data.error || t("profile.deleteFailedMsg"), <AlertTriangle />);
            }
            
          } catch (error) {
            console.error('Error deleting account:', error);
            openAlert(t("profile.deleteFailed"), t("profile.deleteFailedMsg"), <AlertTriangle />);
          }finally {
            closePasswordModal();
          }
        });
      },
    });
  };

  // Auto-switch ALL visitors away from the private "Personal Information" tab if they're viewing someone else's profile
  useEffect(() => {
    if (userProfileID && tab === "info") {
      setTab("status"); // Instantly redirect them over to the Contributions tab
    }
  }, [userProfileID, tab]);

  // Pagination for saved foods
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

  // Avatar Upload Functions 
  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarFileSelect = (e) => {
    const input = e.target;
    const file = input.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    const resetPicker = () => {
      input.value = '';
      setAvatarFile(null);
      setAvatarPreview(null);
    };

    if (!validTypes.includes(file.type)) {
      openAlert(t("profile.invalidFile"), t("profile.invalidFileMsg"), <AlertTriangle />, resetPicker);
      resetPicker();
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      openAlert(t("profile.fileTooLarge"), t("profile.fileTooLargeMsg"), <AlertTriangle />, resetPicker);
      resetPicker();
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      openAlert(t("profile.noImage"), t("profile.noImageMsg"), <AlertTriangle />);
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch(`${API_BASE_URL}/api/userProfile/avatar`, {
        method: 'POST',
        credentials: 'include',
        headers: {
        'X-CSRF-Token': csrfToken 
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to upload avatar (${res.status})`);
      }

      const result = await res.json();
      
      if (result.success) {
        // Update user state with new avatar
        setUser(prev => ({ ...prev, avatar: result.avatarUrl }));
        openAlert(t("profile.avatarUpdated"), t("profile.avatarUpdatedMsg"), <CheckCircle2 />)
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
      openAlert(t("profile.uploadFailed"), error.message || t("profile.uploadFailedMsg"), <AlertTriangle />);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    openConfirm({
      title: t("profile.removeAvatar"),
      message: t("profile.removeAvatarConfirm"),
      confirmText: t("profile.remove"),
      cancelText: t("profile.cancel"),
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/userProfile/avatar`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken
            },
          });

          if (!res.ok) {
            throw new Error(`Failed to remove avatar (${res.status})`);
          }

          const result = await res.json();
          
          if (result.success) {
            // Update user state to remove avatar
            setUser(prev => ({ ...prev, avatar: null }));
            openAlert(t("profile.avatarRemoved"), t("profile.avatarRemovedMsg"), <CheckCircle2 />);
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
          openAlert(t("profile.removeFailed"), error.message || t("profile.removeFailedMsg"), <AlertTriangle />);
        }
      }
    });
  }

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
    setAvatarPreview(null);
    setAvatarFile(null);
    // Clear file input
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="user-profile-page">
        <Header />
        <div className="upp-page"><div className="upp-loading">{t("profile.loading")}</div></div>
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
          <h2 className="upp-404-h2">{t("profile.errorTitle")}</h2>
          <p className="upp-error-message">{error}</p>
          <button className="lrp-btn lrp-btn-primary" onClick={() => window.location.reload()}>
            {t("profile.retry")}
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

      {/* If guest, show pop-up modal instead of redirect */}
      {showLoginPrompt && (
        <LoginPromptModal
          message={t("profile.loginToView")}
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate("/loginregister")}
        />
      )}

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <div className="upp-modal-overlay">
          <div className="upp-modal">
            <div className="upp-modal-header">
              <h3>{t("profile.changeAvatar")}</h3>
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
                  <span><Camera size={16} />{t("profile.chooseImage")}</span>
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
                    {t("profile.removeCurrent")}
                  </button>
                )}
              </div>
              
              <div className="upp-avatar-help">
                <p>{t("profile.supportedFormats")}</p>
                <p>{t("profile.maxSize")}</p>
              </div>
            </div>
            
            <div className="upp-modal-footer">
              <button 
                className="lrp-btn lrp-btn-outline" 
                onClick={closeAvatarModal}
                disabled={isUploadingAvatar}
              >
                {t("profile.cancel")}
              </button>
              <button 
                className="lrp-btn lrp-btn-primary" 
                onClick={uploadAvatar}
                disabled={!avatarFile || isUploadingAvatar}
              >
                {isUploadingAvatar ? t("profile.uploading") : t("profile.saveAvatar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Only render profile if user exists & not guest */}
      {!showLoginPrompt && user && (
        <div className="upp-page">
          {/* ===== USER HEADER ===== */}
          <div className="upp-header">
            <div 
              className={`upp-avatar ${!userProfileID ? "upp-avatar-editable" : ""}`} 
              onClick={!userProfileID ? handleAvatarClick : undefined}
              role={!userProfileID ? "button" : "img"}
              tabIndex={!userProfileID ? 0 : undefined}
              onKeyDown={!userProfileID ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAvatarClick();
                }
              } : undefined}
              aria-label={!userProfileID ? "Change avatar" : "Profile avatar"}
            >
              {user?.avatar && (
                /\.(jpg|jpeg|png|gif|webp)$/i.test(user.avatar) || 
                user.avatar.includes('googleusercontent.com')
              ) ? (
                <>
                  <img src={user.avatar} alt="Profile Avatar" />
                  {/* Hide camera overlay for visitors */}
                  {!userProfileID && (
                    <div className="upp-avatar-overlay">
                      <Camera size={20} />
                    </div>
                  )}
                </>
              ) : (
                <div className="upp-avatar-initials">
                  {(user?.firstName?.[0] || "").toUpperCase()}
                  {(user?.lastName?.[0] || "").toUpperCase()}
                  {/* Hide camera overlay for visitors */}
                  {!userProfileID && (
                    <div className="upp-avatar-overlay">
                      <Camera size={16} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <h1 className="upp-title">{!userProfileID ? t("profile.myProfile") : t("profile.othersProfile", { name: user?.firstName })}</h1>
            {user?.bio && (
              <p className="upp-sub">
                {user.bio}
              </p>
            )}

          <UserXpBar 
            totalXp={user?.total_xp || 0} 
            highestLevel={Math.max(1, Math.floor(1 + Math.pow((user?.total_xp || 0) / 100, 2/3)))} 
          />
          </div>

          {user?.isPrivateView ? (
          <div className="upp-center upp-private-view">
            <Lock size={80} color="#d8c6b4" className="upp-private-icon" />
            <h2 className="upp-private-title">{t("profile.privateProfile")}</h2>
            <p className="upp-muted upp-private-text">
              {t("profile.accountIsPrivate")}
            </p>
          </div>
        ) : (
          <>
          {/* ===== TABS ===== */}
          <div className="upp-tabs">
            {[
              ["info", t("profile.tabInfo")],
              ["saved", t("profile.tabSaved")],
              ["status", t("profile.tabStatus")],
              ["prefs", t("profile.tabPrefs")],
              ["settings", t("profile.tabSettings")],
            ]
            .filter(([val]) => {
              if (!userProfileID) return true; // Owner sees everything
              return val === "status";         // All visitors ONLY see Contributions
            })
            .map(([val, label]) => (
              <button
                key={val}
                className={`upp-tab ${tab === val ? "is-active" : ""}`}
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
                    <h3 className="upp-card-title">{t("profile.tabInfo")}</h3>
                        {/* --- First Name & Last Name --- */}
                        <div className="upp-form-grid">
                          <label>
                            <span>{t("profile.firstName")}</span>
                            {isEditing ? (
                              <input 
                                value={form.firstName} 
                                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} 
                                className="upp-input-edit"
                              />
                            ) : (
                              <div className="upp-read-only">{form.firstName}</div>
                            )}
                          </label>
                          <label>
                            <span>{t("profile.lastName")}</span>
                            {isEditing ? (
                              <input 
                                value={form.lastName} 
                                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} 
                                className="upp-input-edit"
                              />
                            ) : (
                              <div className="upp-read-only">{form.lastName}</div>
                            )}
                          </label>
                        </div>

                        {/* --- Email & Location --- */}
                        <div className="upp-form-grid">
                          <label>
                            <span>{t("profile.email")}</span>
                            {/* Email usually stays disabled for security */}
                            <input 
                              type="email" 
                              className= "upp-email-input"
                              value={form.email} 
                              disabled 
                            />
                          </label>
                          <label>
                            <span>{t("profile.location")}</span>
                            {isEditing ? (
                              <input 
                                value={form.location} 
                                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} 
                                className="upp-input-edit"
                              />
                            ) : (
                              <div className="upp-read-only">{form.location || t("profile.notSpecified")}</div>
                            )}
                          </label>
                        </div>

                        {/* --- Bio --- */}
                        <label className="upp-block">
                          <span>{t("profile.bio")}</span>
                          {isEditing ? (
                            <>
                              <textarea 
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                rows={3} 
                                maxLength={200} 
                                className="upp-textarea" 
                              />
                              <div className="upp-help">{bio.length}/200</div>
                            </>
                          ) : (
                            <div className="upp-read-only" style={{ minHeight: "60px", whiteSpace: "pre-wrap" }}>
                              {bio || t("profile.noBio")}
                            </div>
                          )}
                        </label>

                        {/* --- ACTION BUTTONS (Instagram Style) --- */}
                        <div className = "upp-actions">
                          {!isEditing ? (
                            // VIEW MODE: Big Edit Button
                            <button 
                              className="lrp-btn lrp-btn-outline upp-edit-btn" 
                              onClick={() => setIsEditing(true)}
                            >
                              {t("profile.editProfile")}
                            </button>
                          ) : (
                            // EDIT MODE: Cancel + Save
                            <div className = "upp-edit-mode">
                              <button 
                                className="lrp-btn lrp-btn-outline upp-edit-btn1" 
                                onClick={() => setIsEditing(false)}
                              >
                                {t("profile.cancel")}
                              </button>
                              <button 
                                className="lrp-btn lrp-btn-primary upp-edit-btn1" 
                                onClick={async () => {
                                  await savePersonal();
                                  setIsEditing(false);
                                }}
                              >
                                {t("profile.saveChanges")}
                              </button>
                            </div>
                          )}
                        </div>
                  </div>
                </div>

                {/* Sidebar Stats (Unchanged) */}
                <aside className="upp-sticky">
                  <div className="upp-card">
                    <h3 className="upp-card-title">{t("profile.myContributions")}</h3>
                    <div className="upp-stat">
                      <div className="upp-stat-val">{user?.stats?.recipes || 0}</div>
                      <div className="upp-muted">{t("profile.recipesShared")}</div>
                    </div>
                    <div className="upp-stat">
                      <div className="upp-stat-val">{user?.stats?.posts || 0}</div>
                      <div className="upp-muted">{t("profile.storiesShared")}</div>
                    </div>
                    <div className="upp-stat">
                      <div className="upp-stat-val">{user?.stats?.likes || 0}</div>
                      <div className="upp-muted">{t("profile.likesReceived")}</div>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* ===== Saved Foods ===== */}
            {tab === "saved" && !userProfileID && (
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
                    <p className="upp-muted">{t("profile.noSavedFoods")}</p>
                    <p className="upp-muted">{t("profile.exploreFoods")}</p>
                  </div>
                )}
              </>
            )}

            {/*// ===== Contributions (Status) =====*/}
            {tab === "status" && (
              <>
                {(() => {
                  const ITEMS_PER_PAGE = 5;

                  const recipeData = Array.isArray(recipeContributions) 
                    ? recipeContributions.filter(item => {
                        const result = isRecipe(item);
                        if (!result) return false;
                        if (userProfileID && item.status?.toLowerCase() !== "approved") return false;
                        return true;
                      }).sort(byDateDesc)
                    : [];
                  
                  const totalRecipePages = Math.ceil(recipeData.length / ITEMS_PER_PAGE);
                  const currentRecipeData = recipeData.slice((recipePage - 1) * ITEMS_PER_PAGE, recipePage * ITEMS_PER_PAGE);

                  const communityData = Array.isArray(communityPosts)
                    ? communityPosts.filter(item => {
                        if (!isCommunity(item)) return false;
                        if (userProfileID && item.status !== "Approved") return false;
                        return true;
                      }).sort(byDateDesc)
                    : [];

                  const totalPostPages = Math.ceil(communityData.length / ITEMS_PER_PAGE);
                  const currentPostData = communityData.slice((postPage - 1) * ITEMS_PER_PAGE, postPage * ITEMS_PER_PAGE);

                  return (
                    <div className="upp-stack">
                      <div className="upp-card">
                        <h3 className="upp-card-title">{t("profile.recipes")} ({recipeData.length})</h3>
                        {isLoadingRecipes ? (
                          <div className="upp-muted">{t("profile.loadingRecipes")}</div>
                        ) : recipeData.length ? (
                          <>
                            <div className="upp-stack upp-pagination-container">
                              {currentRecipeData.map((c) => <ContributionRow key={`recipe-${c.id}`} c={c} />)}
                            </div>
                            
                            {totalRecipePages > 1 && (
                              <div className="efp-pagination upp-pagination">
                                <button
                                  className="efp-btn nav-btn" 
                                  disabled={recipePage === 1}
                                  onClick={() => setRecipePage((p) => Math.max(1, p - 1))}
                                >
                                  ‹ Prev
                                </button>
                                <div className="efp-page-numbers">
                                  {Array.from({ length: totalRecipePages }, (_, i) => (
                                    <button
                                      key={i}
                                      className={`efp-btn ${recipePage === i + 1 ? "is-active" : ""}`}
                                      onClick={() => setRecipePage(i + 1)}
                                    >
                                      {i + 1}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  className="efp-btn nav-btn" 
                                  disabled={recipePage === totalRecipePages}
                                  onClick={() => setRecipePage((p) => Math.min(totalRecipePages, p + 1))}
                                >
                                  Next ›
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="upp-muted">
                            {recipeContributions?.length > 0 ? `${recipeContributions.length} recipes found but not displaying` : t("profile.noRecipes")}
                          </div>
                        )}
                      </div>

                      <div className="upp-card">
                        <h3 className="upp-card-title">{t("profile.communityPosts")} ({communityData.length})</h3>
                        {isLoadingCommunity ? (
                          <div className="upp-muted">{t("profile.loadingPosts")}</div>
                        ) : communityData.length ? (
                          <>
                            <div className="upp-stack upp-pagination-container">
                              {currentPostData.map((c) => <ContributionRow key={`community-${c.id}`} c={c} />)}
                            </div>
                            
                            {totalPostPages > 1 && (
                              <div className="efp-pagination upp-pagination">
                                <button
                                  className="efp-btn nav-btn"
                                  disabled={postPage === 1}
                                  onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                                >
                                  ‹ Prev
                                </button>
                                <div className="efp-page-numbers">
                                  {Array.from({ length: totalPostPages }, (_, i) => (
                                    <button
                                      key={i}
                                      className={`efp-btn ${postPage === i + 1 ? "is-active" : ""}`}
                                      onClick={() => setPostPage(i + 1)}
                                    >
                                      {i + 1}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  className="efp-btn nav-btn" 
                                  disabled={postPage === totalPostPages}
                                  onClick={() => setPostPage((p) => Math.min(totalPostPages, p + 1))}
                                >
                                  Next ›
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="upp-muted">
                            {communityPosts?.length > 0 ? `${communityPosts.length} community posts found but not displaying` : t("profile.noCommunityPosts")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* ===== Preferences ===== */}
            {tab === "prefs" && !userProfileID && (
              <div className="upp-stack">
                {/* Dietary Card */}
                <div className="upp-card">
                  <h3 className="upp-card-title">{t("profile.dietaryPrefs")}</h3>
                  <div className="upp-choice-grid">
                    {DIETARY_OPTIONS.map((id) => (
                      <label key={id} className={`upp-choice ${prefs.dietary.includes(id) ? "is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={prefs.dietary.includes(id)}
                          onChange={() => setPrefs((p) => ({ ...p, dietary: toggleInArray(p.dietary, id) }))}
                          disabled={!isEditing} 
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                    ))}
                    {prefs.dietary.length === 0 && <div className="upp-muted upp-no-diet">{t("profile.noDietaryPrefs")}</div>}
                  </div>
                </div>

                {/* Allergies Card */}
                <div className="upp-card">
                  <h3 className="upp-card-title">{t("profile.allergies")}</h3>
                  <div className="upp-choice-grid">
                    {ALLERGY_OPTIONS.map((id) => (
                      <label key={id} className={`upp-choice ${prefs.allergies.includes(id) ? "is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={prefs.allergies.includes(id)}
                          onChange={() => setPrefs((p) => ({ ...p, allergies: toggleInArray(p.allergies, id) }))}
                          disabled={!isEditing}
                        />
                        {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                    ))}
                    {prefs.allergies.length === 0 && <div className="upp-muted" style={{ marginTop: 8 }}>{t("profile.noAllergies")}</div>}
                  </div>
                </div>

                {/* ACTION BUTTONS  */}
                <div className = "upp-actions">
                  {!isEditing ? (
                    // VIEW MODE
                    <button 
                      className="lrp-btn lrp-btn-outline upp-edit-btn" 
                      onClick={() => setIsEditing(true)}
                    >
                      {t("profile.editPreferences")}
                    </button>
                  ) : (
                    // EDIT MODE: Show Cancel + Save
                    <div className="upp-edit-actions upp-edit-mode">
                      <button 
                        className="lrp-btn lrp-btn-outline upp-edit-btn1" 
                        onClick={() => setIsEditing(false)}
                      >
                        {t("profile.cancel")}
                      </button>
                      <button 
                        className="lrp-btn lrp-btn-primary upp-edit-btn1" 
                        onClick={async () => {
                          await savePrefs();
                          setIsEditing(false); 
                        }}
                      >
                        {t("profile.savePreferences")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== Settings ===== */}
            {tab === "settings" && !userProfileID && (
              <div className="upp-stack">
                <div className="upp-card">
                  <h3 className="upp-card-title"><Bell className="rdp-sec-icon" color={"#6a4a2f"} /> Notifications</h3>
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">{t("profile.emailNotifications")}</div>
                      <div className="upp-muted2">{t("profile.receiveUpdates")}</div>
                    </div>
                    <label className="upp-switch">
                      <input
                        type="checkbox"
                        checked={prefs.emailNotifications}
                        onChange={(e) => toggleSetting('emailNotifications', e.target.checked)}
                      />
                      <span />
                    </label>
                  </div>
                  {/* Push Notifications toggle (commented out for now)
                  <hr className="upp-sep" />
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">{t("profile.pushNotifications")}</div>
                      <div className="upp-muted2">{t("profile.communityActivities")}</div>
                    </div>
                    <label className="upp-switch">
                      <input
                        type="checkbox"
                        checked={prefs.pushNotifications}
                        onChange={(e) => toggleSetting('pushNotifications', e.target.checked)}
                      />
                      <span />
                    </label>
                  </div>
                  */}
                </div>

                <div className="upp-card">
                  <h3 className="upp-card-title"><Eye className="rdp-sec-icon" color={"#6a4a2f"}/> Privacy</h3>
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">{t("profile.profileVisibility")}</div>
                      <div className="upp-muted2">{t("profile.allowOthers")}</div>
                    </div>
                    <label className="upp-switch">
                      <input
                        type="checkbox"
                        checked={prefs.profileVisibility}
                        onChange={(e) => toggleSetting('profileVisibility', e.target.checked)}
                      />
                      <span />
                    </label>
                  </div>
                  <hr className="upp-sep" />
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">{t("profile.dataExport")}</div>
                      <div className="upp-muted2">{t("profile.downloadData")}</div>
                    </div>
                    <button 
                      className="lrp-btn lrp-btn-outline upp-btn" 
                      onClick={openExportModal}
                      disabled={!user?.savedFoods || user.savedFoods.length === 0}
                    >
                      {t("profile.exportDataBtn")}
                    </button>
                  </div>
                </div>

                {user?.role === "admin" && (
                  <div className="upp-card">
                    <h3 className="upp-card-title"><Shield className="rdp-sec-icon" color={"#6a4a2f"} /> Admin Access</h3>
                    <div className="upp-row between">
                      <div>
                        <div className="upp-strong">{t("profile.adminPanel")}</div>
                        <div className="upp-muted2">{t("profile.adminDesc")}</div>
                      </div>
                      <button className="lrp-btn lrp-btn-outline upp-btn" onClick={() => navigate("/admin")}>
                        <ExternalLink className="rdp-sec-icon" /> {t("profile.openAdminDashboard")}
                      </button>
                    </div>
                  </div>
                )}

                <div className="upp-card">
                  <h3 className="upp-card-title"><OctagonX className="rdp-sec-icon" color={"#6a4a2f"}/> Account Deletion</h3>
                  <div className="upp-row between">
                    <div>
                      <div className="upp-strong">{t("profile.deleteAccount")}</div>
                      <div className="upp-muted2">{t("profile.deleteAccountDesc")}</div>
                      <div className="upp-muted2">{t("profile.deleteAccountConsent")}</div>
                    </div>
                    <button
                      type="button"
                      className="lrp-btn lrp-btn-outline upp-btn upp-btn--danger"
                      onClick={handleDeleteAccount}
                    >
                      {t("profile.deleteAccount")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* Export Modal */}
      {exportModal.open && (
        <div className="upp-modal-overlay">
          <div className="upp-modal">
            <div className="upp-modal-header">
              <h3>{exportModal.title}</h3>
              <button className="upp-modal-close" onClick={closeExportModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="upp-modal-body">
              <p className="upp-muted">
                Select the data you would like to include in your export.
              </p>
              {[
                { key: "profile", label: "Profile Information" },
                { key: "savedFoods", label: `Saved Foods (${user?.savedFoods?.length || 0})` },
                { key: "recipes", label: `My Recipes (${exportModal.exportRecipes.length})` },
                { key: "posts", label: `My Community Posts (${exportModal.exportPosts.length})` },
                { key: "likedPosts", label: `Liked Posts (${exportModal.exportLikedPosts.length})` },
              ].map(({ key, label }) => {
                const isExpanded = exportModal.expandedType === key;
                const isActive = key === "profile"
                  ? exportModal.includeProfile
                  : key === "savedFoods"
                  ? exportModal.selectedFoods.length > 0
                  : key === "recipes"
                  ? exportModal.selectedRecipes.length > 0
                  : key === "posts"
                  ? exportModal.selectedPosts.length > 0
                  : exportModal.selectedLikedPosts.length > 0;

                return (
                <div key={key} className={`upp-export-accordion ${isExpanded ? "is-expanded" : ""}`}>
                  <div
                    className={`upp-export-option has-dropdown ${isActive ? "is-selected" : ""}`}
                    onClick={() => setExportModal(m => ({ ...m, expandedType: m.expandedType === key ? null : key }))}
                  >
                    <span>{label}</span>
                    {isActive && <span className="upp-export-active-badge">✓ Included</span>}
                    <span className="upp-export-accordion-toggle">{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Dropdown for Profile Information */}
                  {key === "profile" && (
                    <div className="upp-export-dropdown">
                      <div className="upp-export-profile-toggle">
                        <label>
                          <input
                            type="checkbox"
                            checked={exportModal.includeProfile}
                            onChange={() => setExportModal(m => ({ ...m, includeProfile: !m.includeProfile }))}
                          />
                          <span>Include Profile Information</span>
                        </label>
                      </div>
                      <ul className="upp-export-profile-points">
                        <li>Name</li>
                        <li>Email</li>
                        <li>Bio</li>
                        <li>Location</li>
                        <li>Dietary Preference</li>
                        <li>Allergies</li>
                        <li>Account Status</li>
                        <li>Last Login</li>
                        <li>Consent Date</li>
                      </ul>
                    </div>
                  )}

                  {/* Dropdown for Saved Foods */}
                  {key === "savedFoods" && (
                    <div className="upp-export-dropdown">
                      <div className="upp-export-select-all">
                        <label>
                          <input
                            type="checkbox"
                            checked={exportModal.selectedFoods.length === (user?.savedFoods?.length || 0) && exportModal.selectedFoods.length > 0}
                            onChange={toggleSelectAll}
                          />
                          <span>{t("profile.selectAll")}</span>
                        </label>
                      </div>
                      <div className="upp-export-list">
                        {user?.savedFoods?.length > 0 ? user.savedFoods.map((food, index) => (
                          <div key={food.id || food.saveId || index} className="upp-export-item">
                            <input
                              type="checkbox"
                              checked={exportModal.selectedFoods.includes(food.saveId)}
                              onChange={() => toggleFoodSelection(food.saveId)}
                            />
                            <div className="upp-export-item-info">
                              <div className="upp-export-item-name">{food.name || t("profile.unnamedFood")}</div>
                              <div className="upp-export-item-meta">
                                {food.origin || t("profile.unknownOrigin")} • {t("profile.savedLabel")} {food.savedDate || t("profile.unknownDate")}
                              </div>
                            </div>
                            {food.image && <img src={food.image} alt={food.name} className="upp-export-item-thumb" />}
                          </div>
                        )) : (
                          <div className="upp-center upp-muted">{t("profile.noSavedFoodsExport")}</div>
                        )}
                      </div>
                      <div className="upp-export-count">
                        Selected: {exportModal.selectedFoods.length} of {user?.savedFoods?.length || 0} foods
                      </div>
                    </div>
                  )}

                  {/* Dropdown for Recipes */}
                  {key === "recipes" && (
                    <div className="upp-export-dropdown">
                      {exportModal.exportLoading ? (
                        <div className="upp-center upp-muted">Loading...</div>
                      ) : exportModal.exportRecipes.length > 0 ? (
                        <>
                          <div className="upp-export-select-all">
                            <label>
                              <input
                                type="checkbox"
                                checked={exportModal.selectedRecipes.length === exportModal.exportRecipes.length && exportModal.exportRecipes.length > 0}
                                  onChange={() => {
                                    setExportModal(m => ({
                                      ...m,
                                      selectedRecipes: m.selectedRecipes.length === m.exportRecipes.length ? [] : m.exportRecipes.map(r => r.id)
                                    }));
                                  }}
                              />
                              <span>{t("profile.selectAll")}</span>
                            </label>
                          </div>
                          <div className="upp-export-list">
                            {exportModal.exportRecipes.map(recipe => (
                              <div key={recipe.id} className="upp-export-item">
                                <input
                                  type="checkbox"
                                  checked={exportModal.selectedRecipes.includes(recipe.id)}
                                    onChange={() => setExportModal(m => ({
                                      ...m,
                                      selectedRecipes: m.selectedRecipes.includes(recipe.id)
                                        ? m.selectedRecipes.filter(id => id !== recipe.id)
                                        : [...m.selectedRecipes, recipe.id]
                                    }))}
                                />
                                <div className="upp-export-item-info">
                                  <div className="upp-export-item-name">{recipe.foodName}</div>
                                  <div className="upp-export-item-meta">
                                    {recipe.origin} <span className={`upp-chip ${getStatusClass(recipe.status)}`}>{recipe.status}</span> • {formatContributionDate(recipe.createdAt)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="upp-export-count">
                            Selected: {exportModal.selectedRecipes.length} of {exportModal.exportRecipes.length} recipes
                          </div>
                        </>
                      ) : (
                        <div className="upp-center upp-muted">No recipes found.</div>
                      )}
                    </div>
                  )}

                  {/* Dropdown for Posts */}
                  {key === "posts" && (
                    <div className="upp-export-dropdown">
                      {exportModal.exportLoading ? (
                        <div className="upp-center upp-muted">Loading...</div>
                      ) : exportModal.exportPosts.length > 0 ? (
                        <>
                          <div className="upp-export-select-all">
                            <label>
                              <input
                                type="checkbox"
                                checked={exportModal.selectedPosts.length === exportModal.exportPosts.length && exportModal.exportPosts.length > 0}
                                onChange={() => {
                                  setExportModal(m => ({
                                    ...m,
                                    selectedPosts: m.selectedPosts.length === m.exportPosts.length ? [] : m.exportPosts.map(p => p.id)
                                  }));
                                }}
                              />
                              <span>{t("profile.selectAll")}</span>
                            </label>
                          </div>
                          <div className="upp-export-list">
                            {exportModal.exportPosts.map(post => (
                              <div key={post.id} className="upp-export-item">
                                <input
                                  type="checkbox"
                                  checked={exportModal.selectedPosts.includes(post.id)}
                                    onChange={() => setExportModal(m => ({
                                      ...m,
                                      selectedPosts: m.selectedPosts.includes(post.id)
                                        ? m.selectedPosts.filter(id => id !== post.id)
                                        : [...m.selectedPosts, post.id]
                                    }))}
                                />
                                <div className="upp-export-item-info">
                                  <div className="upp-export-item-name">{post.title}</div>
                                  <div className="upp-export-item-meta">
                                    <span className={`upp-chip ${getStatusClass(post.status)}`}>{post.status}</span> • {formatContributionDate(post.createdAt)}
                                </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="upp-export-count">
                            Selected: {exportModal.selectedPosts.length} of {exportModal.exportPosts.length} posts
                          </div>
                        </>
                      ) : (
                        <div className="upp-center upp-muted">No posts found.</div>
                      )}
                    </div>
                  )}

                  {/* Dropdown for Liked Posts */}
                  {key === "likedPosts" && (
                    <div className="upp-export-dropdown">
                      {exportModal.exportLoading ? (
                        <div className="upp-center upp-muted">Loading...</div>
                      ) : exportModal.exportLikedPosts.length > 0 ? (
                        <>
                          <div className="upp-export-select-all">
                            <label>
                              <input
                                type="checkbox"
                                checked={exportModal.selectedLikedPosts.length === exportModal.exportLikedPosts.length && exportModal.exportLikedPosts.length > 0}
                                onChange={() => {
                                  setExportModal(m => ({
                                    ...m,
                                    selectedLikedPosts: m.selectedLikedPosts.length === m.exportLikedPosts.length ? [] : m.exportLikedPosts.map(p => p.id)
                                  }));
                                }}
                              />
                              <span>{t("profile.selectAll")}</span>
                            </label>
                          </div>
                          <div className="upp-export-list">
                            {exportModal.exportLikedPosts.map(post => (
                              <div key={post.id} className="upp-export-item">
                                <input
                                  type="checkbox"
                                  checked={exportModal.selectedLikedPosts.includes(post.id)}
                                    onChange={() => setExportModal(m => ({
                                      ...m,
                                      selectedLikedPosts: m.selectedLikedPosts.includes(post.id)
                                        ? m.selectedLikedPosts.filter(id => id !== post.id)
                                        : [...m.selectedLikedPosts, post.id]
                                    }))}
                                />
                                <div className="upp-export-item-info">
                                  <div className="upp-export-item-name">{post.title}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="upp-export-count">
                            Selected: {exportModal.selectedLikedPosts.length} of {exportModal.exportLikedPosts.length} liked posts
                          </div>
                        </>
                      ) : (
                        <div className="upp-center upp-muted">No liked posts found.</div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>

            <div className="upp-modal-footer">
              <button
                className="lrp-btn lrp-btn-outline"
                onClick={closeExportModal}
                disabled={exportModal.loading}
              >
                {t("profile.cancel")}
              </button>
              <button
                className="lrp-btn lrp-btn-primary"
                onClick={handleExportData}
                disabled={
                  exportModal.loading ||
                  (
                    !exportModal.includeProfile &&
                    exportModal.selectedFoods.length === 0 &&
                    exportModal.selectedRecipes.length === 0 &&
                    exportModal.selectedPosts.length === 0 &&
                    exportModal.selectedLikedPosts.length === 0
                  )
                }
              >
                {exportModal.loading ? t("profile.exporting") : t("profile.exportBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <Modal
        open={dlg.open}
        title={dlg.title}
        icon={dlg.icon}
        primaryText={dlg.primaryText || "OK"}
        onPrimary={dlg.onPrimary || closeDlg}
        onClose={closeDlg}
      >
        {dlg.message}
      </Modal>

      <Modal
        open={confirm.open}
        title={confirm.title}
        icon={confirm.icon}
        primaryText={confirm.confirmText || t("profile.confirm")}
        secondaryText={confirm.cancelText || t("profile.cancel")}
        onPrimary={confirm.onConfirm}
        onSecondary={closeConfirm}
        onClose={closeConfirm}
      >
        {confirm.message}
      </Modal>
      {pwModal.open && (
        <div className="upp-modal-overlay">
          <div className="upp-modal">
            <div className="upp-modal-header">
              <h3>{pwModal.title}</h3>
              <button className="upp-modal-close" onClick={closePasswordModal}>
                <X size={20} />
              </button>
            </div>
            <div className="upp-modal-body">
              <p className="upp-muted" style={{ marginBottom: 12 }}>{pwModal.message}</p>
              <label className="upp-block">
                <span>{t("profile.password")}</span>
                <input
                  type="password"
                  value={pwModal.password}
                  onChange={(e) => setPwModal(m => ({ ...m, password: e.target.value }))}
                  placeholder={t("profile.enterPassword")}
                />
              </label>

              {pwModal.error && (
                <p className="upp-error-inline">
                  {pwModal.error} 
                </p>
              )}
            </div>
            <div className="upp-modal-footer">
              <button className="lrp-btn lrp-btn-outline" onClick={closePasswordModal}>
                {t("profile.cancel")}
              </button>
              <button
                className="lrp-btn lrp-btn-primary"
                onClick={() => pwModal.onSubmit?.(pwModal.password)}
                disabled={!pwModal.password}
              >
                {t("profile.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

