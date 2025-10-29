import React, {  useState, useRef, useEffect } from "react";
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


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("food");
  const [category, setCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [calorieMin, setCalorieMin] = useState(0);
  const [calorieMax, setCalorieMax] = useState(2000);

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
  ];

  const [recipes, setRecipes] = useState([
    {
      name: "Traditional Manok Pansoh", servings: "4 servings", food: "Manok Pansoh", author: "Chef Ahmad",
      updated: "2024-01-15", status: "Approved"
    },
    {
      name: "Melanau Umai Recipe", servings: "2 servings", food: "Umai", author: "Sarah Lim",
      updated: "2024-01-14", status: "Pending"
    },
    {
      name: "Jungle Midin Stir-fry", servings: "3 servings", food: "Midin Belacan", author: "Local Chef",
      updated: "2024-01-13", status: "Approved"
    },
    {
      name: "Bidayuh Linut Dessert", servings: "6 servings", food: "Linut", author: "Heritage Keeper",
      updated: "2024-01-12", status: "Rejected"
    },
  ]);

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // Function to render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "food":
        return (
          <>
          <FoodDatabaseSection foodData={foodData} categories={categories} />
          <RecipeDatabaseSection recipes={recipes} categories={categories} />
        </>
        );

      case "users":
        return <UserManagement />;

      case "moderation":
        return (
          <>
          <ContentModerationSection />
          </>
        );

      case "analytics":
        return <Analytics />; // render Analytics component

      case "settings":
        return (
          <div className="tab-content">
            <h2>System Settings</h2>
          </div>
        );

      default:
        return (
          <div className="food-database-section">
            {/* Default to food database */}
          </div>
        );
    }
  };

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
        <button
          className={activeTab === "food" ? "active" : ""}
          onClick={() => setActiveTab("food")}
        >
          <FiDatabase /> Food Database
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          <GoPeople /> User Management
        </button>
        <button
          className={activeTab === "moderation" ? "active" : ""}
          onClick={() => setActiveTab("moderation")}
        >
          <LuFileCheck /> Content Moderation
        </button>
        <button
          className={activeTab === "analytics" ? "active" : ""}
          onClick={() => setActiveTab("analytics")}
        >
          <FaRegChartBar /> Analytics
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          <CiSettings /> System Settings
        </button>
      </div>

      {/* === Main Content Area - THIS IS CRUCIAL === */}
      <div className="dashboard-content">
        {renderContent()}
      </div>

    </div>
    <Footer />
    </div>
  );
};

export default AdminDashboard;