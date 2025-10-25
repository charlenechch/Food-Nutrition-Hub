import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminDashboard.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FiDatabase } from "react-icons/fi";
import { GoPeople } from "react-icons/go";
import { LuFileCheck } from "react-icons/lu";
import { FaRegFlag, FaPlus} from "react-icons/fa6";
import { FaRegChartBar } from "react-icons/fa";
import { CiSettings, CiSearch, CiFilter} from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { HiOutlinePencilAlt } from "react-icons/hi";
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
          <div className="food-database-section">
            {/* food database content */}
            <div className="food-header">
              <h2> 
                <span className="icon"><FiDatabase /></span> Food Database
              </h2>
              <div className="food-actions">
                <button className="btn-add"><FaPlus /> Add New Food</button>
                <button className="btn-import"><MdOutlineFileUpload /> Bulk Import</button>
              </div>
            </div>

            <div className="food-filters">
              <div className="search-box">
                <CiSearch className="search-icon" />
                <input type="text" placeholder="Search foods..." />
              </div>

              <div className={`beige-dropdown ${dropdownOpen ? "open" : ""}`} ref={dropdownRef}>
                <button className="beige-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {category}
                </button>
                {dropdownOpen && (
                  <ul className="beige-list">
                    {categories.map((opt) => (
                      <li
                        key={opt}
                        className={opt === category ? "selected" : ""}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategory(opt);
                          setDropdownOpen(false);
                        }}
                      >
                        {opt}
                        {opt === category && <span className="tick">✓</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div> 

              <button className="btn-filter" onClick={() => setShowFilters(!showFilters)}>
                <CiFilter className="filter-icon" /> Filters
              </button>
            </div>

            {showFilters && (
              <div className="advanced-filters">
                <h4><CiFilter /> Advanced Filters</h4>
                <div className="filter-grid">
                  <div className="filter-item">
                    <label>Cultural Origin</label>
                    <select>
                      <option>All Origins</option>
                      <option>Iban</option>
                      <option>Melanau</option>
                      <option>Bidayuh</option>
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Food Type</label>
                    <select>
                      <option>All Categories</option>
                      {categories.slice(1).map((cat) => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Difficulty</label>
                    <select>
                      <option>All</option>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Status</label>
                    <select>
                      <option>All</option>
                      <option>Approved</option>
                      <option>Pending</option>
                      <option>Flagged</option>
                    </select>
                  </div>
                </div>

                <div className="calorie-range">
                  <label>
                    Calorie Range: {calorieMin} – {calorieMax} calories
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="10"
                      value={calorieMin}
                      onChange={(e) =>
                        setCalorieMin(Math.min(Number(e.target.value), calorieMax - 50))
                      }
                    />
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="10"
                      value={calorieMax}
                      onChange={(e) =>
                        setCalorieMax(Math.max(Number(e.target.value), calorieMin + 50))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <table className="food-table">
              <thead>
                <tr>
                  <th>Food Name</th>
                  <th>Category</th>
                  <th>Origin</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {foodData.map((food, index) => (
                  <tr key={index}>
                    <td>{food.name}</td>
                    <td>
                      <span className="category-tag">{food.category}</span>
                    </td>
                    <td>{food.origin}</td>
                    <td>{food.updated}</td>
                    <td>
                      <button className="btn-edit" onClick={() => navigate(`/admin/edit/${index}`)}>
                        <HiOutlinePencilAlt />
                      </button>
                      <button className="btn-delete">
                        <RiDeleteBin5Line />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "users":
        return (
          <div className="tab-content">
            <h2>User Management</h2>
          </div>
        );

      case "moderation":
        return (
          <div className="tab-content">
            <h2>Content Moderation</h2>
          </div>
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;