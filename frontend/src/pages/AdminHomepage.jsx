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
import { Mail, Shield, Users, Activity, CircleCheckBig, CircleX } from 'lucide-react';


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("food");
  const [category, setCategory] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [calorieMin, setCalorieMin] = useState(0);
  const [calorieMax, setCalorieMax] = useState(2000);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

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
  

  // Hardcoded sample data (replace with API integration later)
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

  // User Management
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Ahmad Rahman",
      email: "ahmad.rahman@email.com",
      city: "Kuching, Sarawak",
      role: "User",
      status: "Active",            // Active | Inactive | Suspended
      suspendedOn: null,           // e.g. "2024-01-11" if Suspended
      submissions: 15,
      approved: 12,
      lastLogin: "16/01/2024, 02:30 pm",
    },
    {
      id: 2,
      name: "Sarah Lim",
      email: "sarah.lim@email.com",
      city: "Sibu, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 23,
      approved: 21,
      lastLogin: "14/01/2024, 09:15 am",
    },
    {
      id: 3,
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      city: "Miri, Sarawak",
      role: "User",
      status: "Suspended",
      suspendedOn: "2024-01-11",
      submissions: 3,
      approved: 1,
      lastLogin: "10/01/2024, 04:45 pm",
    },
    {
      id: 4,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      city: "Kuching, Sarawak",
      role: "Admin",
      status: "Active",
      suspendedOn: null,
      submissions: 0,
      approved: 0,
      lastLogin: "16/01/2024, 11:22 am",
    },
    {
      id: 5,
      name: "Jennifer Wong",
      email: "jennifer.wong@email.com",
      city: "Bintulu, Sarawak",
      role: "User",
      status: "Inactive",
      suspendedOn: null,
      submissions: 7,
      approved: 5,
      lastLogin: "15/12/2023, 01:55 pm",
    },
  ]);

  // Summary metrics (derived so they always stay fresh)
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === "Admin").length;
  const contributors = users.filter(u => u.submissions > 0).length;
  const activeCount = users.filter(u => u.status === "Active").length;
  const issuesCount = users.filter(u => u.status === "Suspended").length;

  // Filtering
  const filteredUsers = users.filter(u => {
    const q = userSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q);

    const matchesRole =
      roleFilter === "All Roles" || u.role === roleFilter;

    const matchesStatus =
      statusFilter === "All Statuses" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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

      {/* === Food Database Section === */}
      {activeTab === "food" && (
        <div className="food-database-section">
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

              <div
                className={`beige-dropdown ${dropdownOpen ? "open" : ""}`}
                ref={dropdownRef}
              >
                <button
                  className="beige-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {category}
                </button>
                {dropdownOpen && (
                  <ul className="beige-list">
                    {categories.map((opt) => (
                      <li
                        key={opt}
                        className={opt === category ? "selected" : ""}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event bubbling
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

        {/* === Advanced Filters (toggle section) === */}
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
                    setCalorieMin(
                      Math.min(Number(e.target.value), calorieMax - 50) // keep handles apart
                    )
                  }
                />
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={calorieMax}
                  onChange={(e) =>
                    setCalorieMax(
                      Math.max(Number(e.target.value), calorieMin + 50)
                    )
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
                    <button className="btn-edit" onClick={() => navigate(`/admin/edit/${index}`)}><HiOutlinePencilAlt /></button>
                    <button className="btn-delete"><RiDeleteBin5Line /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* === User Management (Enhanced) === */}
      {activeTab === "users" && (
        <div className="user-mgmt">
          <div className="umg-header-row">
            <div>
              <h2 className="umg-title">Enhanced User Management</h2>
              <p className="umg-subtitle">Comprehensive user account administration</p>
            </div>
            <button className="umg-email-btn">
              <Mail />
              Send Email Notification
            </button>
          </div>

          {/* Summary cards */}
          <div className="umg-cards">
            <div className="umg-card">
              <div className="umg-card-title">Total Users</div>
              <div className="umg-card-value">{totalUsers}</div>
              <div className="umg-card-icon"><Users size="40" color="#592700ff"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Admin</div>
              <div className="umg-card-value umg-admin-value">{adminCount}</div>
              <div className="umg-card-icon"><Shield size="40" color="#7200ddff"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Contributors</div>
              <div className="umg-card-value umg-contributor-value">{contributors}</div>
              <div className="umg-card-icon"><Activity size="40" color="#0000FF"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Active</div>
              <div className="umg-card-value umg-active-value">{activeCount}</div>
              <div className="umg-card-icon"><CircleCheckBig size="40" color="green"/></div>
            </div>
            <div className="umg-card">
              <div className="umg-card-title">Issues</div>
              <div className="umg-card-value umg-issue-value">{issuesCount}</div>
              <div className="umg-card-icon"><CircleX size="40" color="red"/></div>
            </div>
          </div>

          {/* Search + filters row */}
          <div className="umg-filterbar">
            <div className="umg-search">
              <CiSearch className="umg-search-icon" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users…"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="umg-select"
            >
              <option>All Roles</option>
              <option>User</option>
              <option>Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="umg-select"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
            </select>
          </div>

          {/* List card */}
          <div className="umg-list-card">
            <div className="umg-list-head">
              <div className="umg-list-title">
                <GoPeople />
                <span>User Accounts ({filteredUsers.length})</span>
              </div>
            </div>

            <table className="umg-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Contributions</th>
                  <th>Last Login</th>
                  <th style={{textAlign:"right"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="umg-empty">No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="umg-name">{u.name}</div>
                        <div className="umg-subline">{u.email}</div>
                        <div className="umg-subline">{u.city}</div>
                      </td>

                      <td>
                        <span className="umg-pill umg-pill-role">{u.role}</span>
                      </td>

                      <td>
                        {u.status === "Active" && (
                          <span className="umg-pill umg-pill-active">Active</span>
                        )}
                        {u.status === "Inactive" && (
                          <span className="umg-pill umg-pill-inactive">Inactive</span>
                        )}
                        {u.status === "Suspended" && (
                          <div className="umg-status-stack">
                            <span className="umg-pill umg-pill-suspended">Suspended</span>
                            {u.suspendedOn && (
                              <div className="umg-status-note">Suspended: {u.suspendedOn}</div>
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="umg-submissions">
                          {u.submissions} submissions
                        </div>
                        <div className="umg-subline">{u.approved} approved</div>
                      </td>

                      <td>{u.lastLogin}</td>

                      <td style={{textAlign:"right"}}>
                        <button className="umg-ellipsis" aria-label="More actions">⋯</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
    <Footer />
    </div>
  );
};

export default AdminDashboard;
