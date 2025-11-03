import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminDashboard.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

// === Icons ===
import { FiDatabase } from "react-icons/fi";
import { GoPeople } from "react-icons/go";
import { LuFileCheck } from "react-icons/lu";
import { FaRegFlag } from "react-icons/fa6";
import { FaRegChartBar } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";

// === Sections ===
import FoodDatabaseSection from "./AdminFoodDatabase.jsx";
import RecipeDatabaseSection from "./AdminRecipeDatabase.jsx";
import ContentModerationSection from "./AdminContentModeration.jsx";
import UserManagement from "./AdminUserManagementTab";
import Analytics from "./Analytics";
import AdminSystemSettings from "./AdminSystemSettings.jsx";

// ✅ API endpoint
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("food");
  const navigate = useNavigate();

  const categories = [
    "All Categories",
    "Poultry",
    "Seafood",
    "Vegetables",
    "Fermented",
    "Desserts",
    "Rice Dish",
    "Noodles",
    "Soup",
    "Meat",
  ];

  // ✅ Live summary & data states
  const [summary, setSummary] = useState({
    totalFoods: 0,
    totalUsers: 0,
    pendingApproval: 0,
    flaggedContent: 0,
  });
  const [foodData, setFoodData] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch food data
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

  // ✅ Fetch recipe data
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipe/all/recipes`);
        const data = await res.json();
        if (Array.isArray(data)) setRecipes(data);
      } catch (error) {
        console.error("❌ Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // ✅ Update summary dynamically
  useEffect(() => {
    setSummary((prev) => ({
      ...prev,
      totalFoods: foodData.length,
      pendingApproval: recipes.filter(r => r.status === "Pending").length,
    }));
  }, [recipes, foodData]);

  // ✅ Derived datasets
  const approvedRecipes = recipes.filter(r => r.status === "Approved");
  const pendingRecipes = recipes.filter(
    r => r.status === "Pending" || r.status === "Rejected"
  );

  // ✅ Unified content moderation data (always updates with recipes)
  const [approvedContent, setApprovedContent] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);

  useEffect(() => {
    setApprovedContent(approvedRecipes);
    setPendingContent(pendingRecipes);
  }, [recipes]);

  // ========================================================
  // 💾 OLD HARDCODED DATA (COMMENTED OUT for reference only)
  // ========================================================

  /*
  const summary = {
    totalFoods: 347,
    totalUsers: 1247,
    pendingApproval: 23,
    flaggedContent: 8,
  };

  const foodData = [
    { name: "Manok Pansoh", category: "Poultry", origin: "Iban", updated: "2024-01-15" },
    { name: "Umai", category: "Seafood", origin: "Melanau", updated: "2024-01-14" },
    { name: "Midin Belacan", category: "Vegetables", origin: "Indigenous", updated: "2024-01-13" },
    { name: "Kasam Babi", category: "Dyvak", origin: "Bidayuh", updated: "2024-01-12" },
    { name: "Kolo Mee", category: "Noodles", origin: "Chinese", updated: "2024-01-10" },
    { name: "Laksa Sarawak", category: "Soup", origin: "Sarawak", updated: "2024-01-09" },
  ];

  const [recipes, setRecipes] = useState([
    { name: "Traditional Manok Pansoh", servings: "4 servings", food: "Manok Pansoh", author: "Chef Ahmad", updated: "2024-01-15", status: "Approved" },
    { name: "Melanau Umai Recipe", servings: "2 servings", food: "Umai", author: "Sarah Lim", updated: "2024-01-14", status: "Pending" },
    { name: "Jungle Midin Stir-fry", servings: "3 servings", food: "Midin Belacan", author: "Local Chef", updated: "2024-01-13", status: "Approved" },
    { name: "Bidayuh Linut Dessert", servings: "6 servings", food: "Linut", author: "Heritage Keeper", updated: "2024-01-12", status: "Rejected" },
  ]);

  const [contentPosts] = useState([
    { id: 1, name: "Manok Pansoh", submitter: "Joanna Lee", date: "2025-10-20", status: "Pending" },
    { id: 2, name: "Laksa Sarawak", submitter: "Brian Tan", date: "2025-10-22", status: "Pending" },
    { id: 5, name: "Kek Lapis Modern", submitter: "Amira Binti Salleh", date: "2025-10-26", status: "Approved" },
  ]);
  */

  // ========================================================
  // ✅ RENDER HANDLER
  // ========================================================
  const renderContent = () => {
    switch (activeTab) {
      case "food":
        return (
          <>
            {/* === Food Database === */}
            <FoodDatabaseSection foodData={foodData} categories={categories} />

            {/* === Approved Recipes === */}
            <RecipeDatabaseSection
              recipes={approvedRecipes}
              categories={categories}
              sectionType="approved"
            />

            {/* === Approved Content (Unified with recipes) === */}
            <ContentModerationSection
              pendingContent={approvedContent}
              onlyApproved={true}
            />
          </>
        );

      case "users":
        return <UserManagement />;

      case "moderation":
        return (
          <>
            {/* === Pending or Rejected Recipes === */}
            <RecipeDatabaseSection
              recipes={pendingRecipes}
              categories={categories}
              sectionType="pending"
            />

            {/* === Pending or Rejected Content === */}
            <ContentModerationSection
              pendingContent={pendingContent}
              onlyApproved={false}
            />
          </>
        );

      case "analytics":
        return <Analytics />;

      case "settings":
        return <AdminSystemSettings onPageChange={setActiveTab} />;

      default:
        return <div className="food-database-section"></div>;
    }
  };

  // ========================================================
  // ✅ MAIN RENDER
  // ========================================================
  return (
    <div>
      <div className="admin-dashboard">
        <Header />
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

          <div className="summary-card">
            <div>
              <h3>Pending Approval</h3>
              <p>{summary.pendingApproval}</p>
            </div>
            <div className="summary-icon"><LuFileCheck /></div>
          </div>

          <div className="summary-card">
            <div>
              <h3>Flagged Content</h3>
              <p>{summary.flaggedContent}</p>
            </div>
            <div className="summary-icon"><FaRegFlag /></div>
          </div>
        </div>

        {/* === Tab Navigation === */}
        <div className="dashboard-tabs">
          <button className={activeTab === "food" ? "active" : ""} onClick={() => setActiveTab("food")}>
            <FiDatabase /> Database
          </button>
          <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
            <GoPeople /> User Management
          </button>
          <button className={activeTab === "moderation" ? "active" : ""} onClick={() => setActiveTab("moderation")}>
            <LuFileCheck /> Content Moderation
          </button>
          <button className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}>
            <FaRegChartBar /> Analytics
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
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
