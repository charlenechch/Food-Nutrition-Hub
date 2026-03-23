import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { useTranslation } from "react-i18next";
import "../css/AdminDashboard.css";

// === Components ===
import Header from "../components/Header";
import Footer from "../components/Footer";
import FoodDatabaseSection from "./AdminFoodDatabase.jsx";
import RecipeDatabaseSection from "./AdminRecipeDatabase.jsx";
import UserManagement from "./AdminUserManagementTab";
import Analytics from "./Analytics";
import AdminSystemSettings from "./AdminSystemSettings.jsx";
import CommunityPostDatabaseSection from "./AdminCommunityPostDatabase.jsx";

// === Icons ===
import { FiDatabase, FiTrendingUp } from "react-icons/fi";
import { GoPeople } from "react-icons/go";
import { LuFileCheck } from "react-icons/lu";
import { FaRegFlag } from "react-icons/fa6";
import { FaRegChartBar } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // ✅ DYNAMIC STATE INITIALIZATION: Read Tab & Status from URL on load
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return ["food", "users", "moderation", "analytics", "settings"].includes(tab) 
      ? tab 
      : "food";
  });

  const [initialFilter, setInitialFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("status") || "All";
  });

  const categories = [
    "All Categories", "Poultry", "Seafood", "Vegetables", "Fermented",
    "Desserts", "Rice Dish", "Noodles", "Soup", "Meat",
  ];

  // --- State definitions ---
  const [summary, setSummary] = useState({
    totalFoods: 0,
    totalUsers: 0,
    pendingApproval: 0,
    pendingRecipes: 0, // Added breakdown state
    pendingPosts: 0,   // Added breakdown state
    flaggedContent: 0,
    rejectedRecipes: 0, // Added breakdown state
    rejectedPosts: 0,   // Added breakdown state
  });

  const [foodData, setFoodData] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  const [pendingCommunityPosts, setPendingCommunityPosts] = useState([]);
  const [rejectedCommunityPosts, setRejectedCommunityPosts] = useState([]);
  const [approvedCommunityPosts, setApprovedCommunityPosts] = useState([]);

  // ✅ LISTENER: Sync State with URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const status = params.get("status");
    
    if (tab && ["food", "users", "moderation", "analytics", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
    if (status) {
      setInitialFilter(status);
    }
  }, [location.search]);

  // FUNCTION: Handle Tab & Filter Switching
  const handleTabChange = (tabName, filterStatus = "All") => {
    setActiveTab(tabName);
    setInitialFilter(filterStatus);
    navigate(`/admin?tab=${tabName}&status=${filterStatus}`, { replace: true });
  };

  // ========================================================
  // Fetching Data (Consolidated into one effect for performance)
  // ========================================================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Run all fetches in parallel
        const [foodCount, foods, allRecipes, users, pending, rejected, approved] = await Promise.all([
          fetch(`${API_URL}/api/foods/count`).then(res => res.json()),
          fetch(`${API_URL}/api/foods`).then(res => res.json()),
          fetch(`${API_URL}/api/recipe/all/recipes?includeAll=true`).then(res => res.json()),
          fetch(`${API_URL}/api/admin/users`, { credentials: "include" }).then(res => res.json()),
          fetch(`${API_URL}/api/communityPost/admin/pending`, { credentials: "include" }).then(res => res.json()),
          fetch(`${API_URL}/api/communityPost/admin/rejected`, { credentials: "include" }).then(res => res.json()),
          fetch(`${API_URL}/api/communityPost/counts`, { credentials: "include" }).then(res => res.json())
        ]);

        if (foodCount.success) setSummary(prev => ({ ...prev, totalFoods: foodCount.total }));
        if (Array.isArray(foods)) setFoodData(foods);
        if (Array.isArray(allRecipes)) setRecipes(allRecipes);
        if (users.success) setUserList(users.users);
        if (pending.success) setPendingCommunityPosts(pending.data || []);
        if (rejected.success) setRejectedCommunityPosts(rejected.data || []);
        if (approved.success) setApprovedCommunityPosts(approved.data || []);

      } catch (err) {
        console.error("❌ Dashboard Data Load Error:", err);
      } finally {
        setLoading(false);
        setLoadingUsers(false);
      }
    };
    loadData();
  }, []);

  // ========================================================
  // Summary calculation (UPDATED WITH BREAKDOWNS)
  // ========================================================
  useEffect(() => {
    const pendingRecipeCount = recipes.filter(r => (r.status || "").toLowerCase() === "pending").length;
    const pendingPostCount = pendingCommunityPosts.length; 
    const rejectedRecipeCount = recipes.filter(r => (r.status || "").toLowerCase() === "rejected").length;
    const rejectedPostCount = rejectedCommunityPosts.length; 

    setSummary((prev) => ({
      ...prev,
      pendingApproval: pendingRecipeCount + pendingPostCount,
      pendingRecipes: pendingRecipeCount,
      pendingPosts: pendingPostCount,
      totalUsers: userList.length,
      flaggedContent: rejectedRecipeCount + rejectedPostCount,
      rejectedRecipes: rejectedRecipeCount,
      rejectedPosts: rejectedPostCount,
    }));
  }, [recipes, userList, pendingCommunityPosts, rejectedCommunityPosts]);

  // ========================================================
  // Derived datasets for tables (Memoized for UX)
  // ========================================================
  const approvedRecipes = useMemo(() => recipes.filter((r) => r.status === "Approved"), [recipes]);
  const pendingRecipes = useMemo(() => recipes.filter((r) => r.status === "Pending" || r.status === "Rejected"), [recipes]);
  const combinedModerationPosts = useMemo(() => [...pendingCommunityPosts, ...rejectedCommunityPosts], [pendingCommunityPosts, rejectedCommunityPosts]);

  const renderContent = () => {
    switch (activeTab) {
      case "food":
        return (
          <div className="tab-content-wrapper">
            <FoodDatabaseSection foodData={foodData} categories={categories} />
            <RecipeDatabaseSection recipes={approvedRecipes} categories={categories} sectionType="approved" />
            <CommunityPostDatabaseSection categories={categories} posts={approvedCommunityPosts} sectionType="approved" />
          </div>
        );

      case "users":
        return <UserManagement users={userList} loading={loadingUsers} error={errorUsers} setUsers={setUserList} />;

      case "moderation":
        return (
          <div className="tab-content-wrapper">
            <CommunityPostDatabaseSection 
              categories={categories} 
              posts={combinedModerationPosts} 
              sectionType="pending" 
              initialStatus={initialFilter} 
            />
            <RecipeDatabaseSection 
              recipes={pendingRecipes} 
              categories={categories} 
              sectionType="pending" 
              initialStatus={initialFilter} 
            />
          </div>
        );

      case "analytics": return <Analytics />;
      case "settings": return <AdminSystemSettings onPageChange={handleTabChange} />;
      default: return <div className="food-database-section"></div>;
    }
  };

  return (
    <div>
      <Header />
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>{t("adminHome.title")}</h1>
          <p className="heritage-subtitle">Sarawakian Food Heritage Management System</p>
        </div>

        {/* === Summary Cards (Enhanced with Project Focus) === */}
        <div className="summary-cards">
          
          <div className="summary-card stat-primary" onClick={() => handleTabChange("food")} style={{ cursor: "pointer" }}>
            <div className="card-info">
              <h3>{t("adminHome.totalFoodDatabase")}</h3>
              <p className="stat-number">{summary.totalFoods}</p>
              <span className="trend-label"><FiTrendingUp /> Heritage Items</span>
            </div>
            <div className="summary-icon"><FiDatabase /></div>
          </div>

          <div className="summary-card stat-users" onClick={() => handleTabChange("users")} style={{ cursor: "pointer" }}>
            <div className="card-info">
              <h3>{t("adminHome.totalUserManagement")}</h3>
              <p className="stat-number">{summary.totalUsers}</p>
              <span className="trend-label">Active Community</span>
            </div>
            <div className="summary-icon"><GoPeople /></div>
          </div>

          <div className="summary-card stat-pending" onClick={() => handleTabChange("moderation", "Pending")}
            style={{ cursor: "pointer", flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>{t("adminHome.pendingApproval")}</h3>
                <p className="stat-number">{summary.pendingApproval}</p>
              </div>
              <div className="summary-icon icon-pending"><LuFileCheck /></div>
            </div>
            <div className="breakdown-tags">
              <span className="b-tag">Posts: {summary.pendingPosts}</span>
              <span className="b-tag">Recipes: {summary.pendingRecipes}</span>
            </div>
          </div>

          <div className="summary-card stat-rejected" onClick={() => handleTabChange("moderation", "Rejected")}
            style={{ cursor: "pointer", flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>{t("adminHome.rejectedContent")}</h3>
                <p className="stat-number">{summary.flaggedContent}</p> 
              </div>
              <div className="summary-icon icon-rejected"><FaRegFlag /></div>
            </div>
            <div className="breakdown-tags">
              <span className="b-tag">Posts: {summary.rejectedPosts}</span>
              <span className="b-tag">Recipes: {summary.rejectedRecipes}</span>
            </div>
          </div>

        </div>

        {/* === Tab Navigation (Made Sticky) === */}
        <div className="dashboard-tabs sticky-nav">
          <button className={activeTab === "food" ? "active" : ""} onClick={() => handleTabChange("food")}>
            <FiDatabase /> {t("adminHome.tabDatabase")}
          </button>
          <button className={activeTab === "users" ? "active" : ""} onClick={() => handleTabChange("users")}>
            <GoPeople /> {t("adminHome.tabUsers")}
          </button>
          <button className={activeTab === "moderation" ? "active" : ""} onClick={() => handleTabChange("moderation")}>
            <LuFileCheck /> {t("adminHome.tabModeration")}
          </button>
          <button className={activeTab === "analytics" ? "active" : ""} onClick={() => handleTabChange("analytics")}>
            <FaRegChartBar /> {t("adminHome.tabAnalytics")}
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => handleTabChange("settings")}>
            <CiSettings /> {t("adminHome.tabSettings")}
          </button>
        </div>

        <div className="dashboard-content">
          {loading ? <p className="umg-loading-text">{t("adminHome.loadingData")}</p> : renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;