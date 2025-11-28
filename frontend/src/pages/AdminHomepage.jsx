import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ Added useLocation
import "../css/AdminDashboard.css";

// === Components ===
import Header from "../components/Header";
import Footer from "../components/Footer";
import FoodDatabaseSection from "./AdminFoodDatabase.jsx";
import RecipeDatabaseSection from "./AdminRecipeDatabase.jsx";
import ContentModerationSection from "./AdminContentModeration.jsx";
import UserManagement from "./AdminUserManagementTab";
import Analytics from "./Analytics";
import AdminSystemSettings from "./AdminSystemSettings.jsx";
import CommunityPostDatabaseSection from "./AdminCommunityPostDatabase.jsx";

// === Icons ===
import { FiDatabase } from "react-icons/fi";
import { GoPeople } from "react-icons/go";
import { LuFileCheck } from "react-icons/lu";
import { FaRegFlag } from "react-icons/fa6";
import { FaRegChartBar } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Get URL location

  // ✅ Initialize tab based on URL, or default to 'food'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return ["food", "users", "moderation", "analytics", "settings"].includes(tab) 
      ? tab 
      : "food";
  });

  const categories = [
    "All Categories", "Poultry", "Seafood", "Vegetables", "Fermented",
    "Desserts", "Rice Dish", "Noodles", "Soup", "Meat",
  ];

  // ✅ State definitions
  const [summary, setSummary] = useState({
    totalFoods: 0,
    totalUsers: 0,
    pendingApproval: 0,
    flaggedContent: 0,
  });

  const [foodData, setFoodData] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  const [pendingCommunityPosts, setPendingCommunityPosts] = useState([]);
  const [approvedCommunityPosts, setApprovedCommunityPosts] = useState([]);

  // ✅ LISTENER: If the URL changes (e.g. back button), update the tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["food", "users", "moderation", "analytics", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Function to change tab and update URL
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // Optional: Update URL without reloading so sharing links works
    navigate(`/admin?tab=${tabName}`, { replace: true });
  };

  // ========================================================
  // ✅ Fetch total food count
  // ========================================================
  useEffect(() => {
    const fetchTotalFoods = async () => {
      try {
        const response = await fetch(`${API_URL}/api/foods/count`);
        const data = await response.json();
        if (data.success) {
          setSummary((prev) => ({ ...prev, totalFoods: data.total }));
        }
      } catch (err) {
        console.error("❌ Error fetching total foods:", err.message);
      }
    };
    fetchTotalFoods();
  }, []);

  // ========================================================
  // ✅ Fetch all food data
  // ========================================================
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch(`${API_URL}/api/foods`);
        const data = await res.json();
        if (Array.isArray(data)) setFoodData(data);
      } catch (error) {
        console.error("❌ Error fetching food data:", error);
      }
    };
    fetchFoods();
  }, []);

  // ========================================================
  // ✅ Fetch recipe data
  // ========================================================
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipeRes = await fetch(
          `${API_URL}/api/recipe/all/recipes?includeAll=true`
        );
        const data = await recipeRes.json();
        if (Array.isArray(data)) setRecipes(data);
      } catch (error) {
        console.error("❌ Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // ========================================================
  // ✅ Fetch user data
  // ========================================================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch(`${API_URL}/api/admin/users`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.users)) {
          setUserList(data.users);
          setErrorUsers(null);
        } else throw new Error("Invalid response format");
      } catch (err) {
        console.error("❌ Error fetching users:", err);
        setErrorUsers(err.message);
        setUserList([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // ========================================================
  // ✅ Fetch pending community posts
  // ========================================================
  useEffect(() => {
    const fetchPendingCommunityPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/communityPost/admin/pending`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPendingCommunityPosts(data.data);
        } else {
          console.warn("⚠️ Unexpected response for pending posts:", data);
        }
      } catch (error) {
        console.error("❌ Error fetching pending community posts:", error);
      }
    };
    fetchPendingCommunityPosts();
  }, []);

  // ========================================================
  // ✅ Fetch approved community posts
  // ========================================================
  useEffect(() => {
      const fetchApprovedCommunityPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/communityPost/counts`, {
        credentials: "include",
      });
      const result = await response.json();

      if (result.success) {
        setApprovedCommunityPosts(result.data);
      } else {
        console.error("❌ Failed to load approved posts:", result.message);
      }
    } catch (error) {
      console.error("⚠️ Error fetching approved community posts:", error);
    }
  };
  fetchApprovedCommunityPosts();
}, []);

  // ========================================================
  // ✅ Summary calculation
  // ========================================================
  useEffect(() => {
    // 1. Count Pending
    const pendingRecipeCount = recipes.filter(
      (r) => (r.status || "").toLowerCase() === "pending"
    ).length;

    const pendingPostCount = pendingCommunityPosts.filter(
      (p) => (p.status || "").toLowerCase() === "pending"
    ).length;

    // 2. Count Flagged (Rejected)
    const rejectedRecipeCount = recipes.filter(
      (r) => (r.status || "").toLowerCase() === "rejected"
    ).length;

    const rejectedPostCount = pendingCommunityPosts.filter(
      (p) => (p.status || "").toLowerCase() === "rejected"
    ).length;

    setSummary((prev) => ({
      ...prev,
      pendingApproval: pendingRecipeCount + pendingPostCount,
      totalUsers: userList.length,
      flaggedContent: rejectedRecipeCount + rejectedPostCount,
    }));

  }, [recipes, userList, pendingCommunityPosts]);

  // ========================================================
  // ✅ Derived datasets
  // ========================================================
  const approvedRecipes = recipes.filter((r) => r.status === "Approved");
  const pendingRecipes = recipes.filter(
    (r) => r.status === "Pending" || r.status === "Rejected"
  );

  // ========================================================
  // ✅ Render content
  // ========================================================
  const renderContent = () => {
    switch (activeTab) {
      case "food":
        return (
          <>
            <FoodDatabaseSection foodData={foodData} categories={categories} />
            <RecipeDatabaseSection recipes={approvedRecipes} categories={categories} sectionType="approved" />
            <CommunityPostDatabaseSection categories={categories} posts={approvedCommunityPosts} sectionType="approved" />
          </>
        );

      case "users":
        return (
          <UserManagement users={userList} loading={loadingUsers} error={errorUsers} setUsers={setUserList} />
        );

      case "moderation":
        return (
          <>
            <CommunityPostDatabaseSection categories={categories} posts={pendingCommunityPosts} sectionType="pending" />
            <RecipeDatabaseSection recipes={pendingRecipes} categories={categories} sectionType="pending" />
          </>
        );

      case "analytics":
        return <Analytics />;

      case "settings":
        return <AdminSystemSettings onPageChange={handleTabChange} />;

      default:
        return <div className="food-database-section"></div>;
    }
  };

  // ========================================================
  // ✅ Render Main UI
  // ========================================================
  return (
    <div>
      <Header />
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Sarawakian Food Heritage Management System</p>
        </div>

        {/* === Summary Cards === */}
        <div className="summary-cards">
          <div className="summary-card">
            <div>
              <h3>Total Food Database</h3>
              <p>{summary.totalFoods}</p>
            </div>
            <div className="summary-icon"><FiDatabase /></div>
          </div>

          <div className="summary-card">
            <div>
              <h3>Total User Management</h3>
              <p>{summary.totalUsers}</p>
            </div>
            <div className="summary-icon"><GoPeople /></div>
          </div>

          {/* Click to go to Moderation */}
          <div 
            className="summary-card" 
            onClick={() => handleTabChange("moderation")}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h3>Pending Approval</h3>
              <p>{summary.pendingApproval}</p>
            </div>
            <div className="summary-icon"><LuFileCheck /></div>
          </div>

          {/* Click to go to Moderation */}
          <div 
            className="summary-card"
            onClick={() => handleTabChange("moderation")}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h3>Rejected Content</h3>
              <p>{summary.flaggedContent}</p> 
            </div>
            <div className="summary-icon"><FaRegFlag /></div>
          </div>
        </div>

        {/* === Tab Navigation === */}
        <div className="dashboard-tabs">
          <button
            className={activeTab === "food" ? "active" : ""}
            onClick={() => handleTabChange("food")}
          >
            <FiDatabase /> Database
          </button>
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => handleTabChange("users")}
          >
            <GoPeople /> User Management
          </button>
          <button
            className={activeTab === "moderation" ? "active" : ""}
            onClick={() => handleTabChange("moderation")}
          >
            <LuFileCheck /> Content Moderation
          </button>
          <button
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => handleTabChange("analytics")}
          >
            <FaRegChartBar /> Analytics
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => handleTabChange("settings")}
          >
            <CiSettings /> System Settings
          </button>
        </div>

        {/* === Dashboard Content === */}
        <div className="dashboard-content">
          {loading ? <p>Loading data...</p> : renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;