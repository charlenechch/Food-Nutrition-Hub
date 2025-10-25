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
import { Mail, Shield, Users, Activity, CircleCheckBig, CircleX, X, Bell, Send } from 'lucide-react';


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
  const [page, setPage] = useState(1);
  const initialPageSize = typeof window !== "undefined" && window.innerWidth <= 680 ? 6 : 10;
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientsOption: "All users",   
    selectedUserIds: [],               
    customEmails: "",                  
    template: "",
    subject: "",
    message: "",
    markAnnouncement: false,
  });
  const [specificSearch, setSpecificSearch] = useState("");

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

  const platformName = "SarawakEats";
  const today = new Date();
  const formatDate = (d) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  const EMAIL_TEMPLATES = {
    "Custom message": {
      subject: "",
      message: "",
    },
    "Welcome Message": {
      subject: `Welcome to ${platformName}!`,
      message:
        `Hello,\n\nWelcome to ${platformName}! We're excited to have you join our community dedicated to preserving and sharing Sarawakian culinary heritage. Explore traditional recipes, discover nutritional insights, and connect with fellow food enthusiasts.\n\nThanks,\n${platformName} Team`,
    },
    "Content Approval": {
      subject: `Your submission has been approved!`,
      message:
        `Hello,\n\nCongratulations! Your recipe/food submission has been reviewed and approved by our team. It is now live on the ${platformName} platform for the community to discover and enjoy. Thank you for contributing to our cultural heritage preservation efforts.\n\nThanks,\n${platformName} Team`,
    },
    "Content Rejection": {
      subject: `Update on your submission`,
      message:
        `Hello,\n\nThank you for your submission to ${platformName}. After careful review, we found that some adjustments are needed before publication. Please check the feedback provided and feel free to resubmit with the suggested improvements.\n\nThanks,\n${platformName} Team`,
    },
    "System Update": {
      subject: `${platformName} Platform Update`,
      message:
        `Hello,\n\nWe've made some exciting updates to the ${platformName} platform! Check out the new features and improvements designed to enhance your experience exploring Sarawakian cuisine and culture.\n\nThanks,\n${platformName} Team`,
    },
  };
  
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
  //hardcoded user data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Ahmad Rahman",
      email: "ahmad.rahman@email.com",
      city: "Kuching, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
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
    {
      id: 6,
      name: "Kelvin Tan",
      email: "kelvin.tan@email.com",
      city: "Mukah, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 9,
      approved: 7,
      lastLogin: "12/01/2024, 08:20 pm",
    },
    {
      id: 7,
      name: "Nur Aisyah",
      email: "aisyah.nur@email.com",
      city: "Kuching, Sarawak",
      role: "User",
      status: "Inactive",
      suspendedOn: null,
      submissions: 2,
      approved: 2,
      lastLogin: "02/01/2024, 10:00 am",
    },
    {
      id: 8,
      name: "Daniel Lee",
      email: "daniel.lee@email.com",
      city: "Samarahan, Sarawak",
      role: "Admin",
      status: "Active",
      suspendedOn: null,
      submissions: 4,
      approved: 4,
      lastLogin: "17/01/2024, 03:05 pm",
    },
    {
      id: 9,
      name: "Aman Shah",
      email: "aman.shah@email.com",
      city: "Miri, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 11,
      approved: 9,
      lastLogin: "13/01/2024, 07:40 pm",
    },
    {
      id: 10,
      name: "Grace Chong",
      email: "grace.chong@email.com",
      city: "Bintulu, Sarawak",
      role: "User",
      status: "Suspended",
      suspendedOn: "2024-01-09",
      submissions: 5,
      approved: 3,
      lastLogin: "09/01/2024, 12:10 pm",
    },
    {
      id: 11,
      name: "Hendry Goh",
      email: "hendry.goh@email.com",
      city: "Sibu, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 1,
      approved: 1,
      lastLogin: "05/01/2024, 06:25 pm",
    },
    {
      id: 12,
      name: "Mei Lin",
      email: "mei.lin@email.com",
      city: "Kapit, Sarawak",
      role: "User",
      status: "Inactive",
      suspendedOn: null,
      submissions: 0,
      approved: 0,
      lastLogin: "—",
    },
    {
      id: 13,
      name: "Farah Zain",
      email: "farah.zain@email.com",
      city: "Limbang, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 6,
      approved: 4,
      lastLogin: "11/01/2024, 01:18 pm",
    },
    {
      id: 14,
      name: "Jonathan Ng",
      email: "jon.ng@email.com",
      city: "Kuching, Sarawak",
      role: "Admin",
      status: "Active",
      suspendedOn: null,
      submissions: 12,
      approved: 12,
      lastLogin: "17/01/2024, 04:10 pm",
    },
    {
      id: 15,
      name: "Melissa Tiong",
      email: "melissa.tiong@email.com",
      city: "Sarikei, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 8,
      approved: 6,
      lastLogin: "08/01/2024, 09:05 am",
    },
    {
      id: 16,
      name: "Ivan Lau",
      email: "ivan.lau@email.com",
      city: "Kuching, Sarawak",
      role: "User",
      status: "Inactive",
      suspendedOn: null,
      submissions: 3,
      approved: 2,
      lastLogin: "28/12/2023, 05:45 pm",
    },
    {
      id: 17,
      name: "Zarina Ali",
      email: "zarina.ali@email.com",
      city: "Miri, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 14,
      approved: 10,
      lastLogin: "16/01/2024, 10:42 am",
    },
    {
      id: 18,
      name: "Kelisa Yong",
      email: "kelisa.yong@email.com",
      city: "Bau, Sarawak",
      role: "User",
      status: "Suspended",
      suspendedOn: "2023-12-30",
      submissions: 2,
      approved: 0,
      lastLogin: "30/12/2023, 03:30 pm",
    },
    {
      id: 19,
      name: "Faizal Rahim",
      email: "faizal.rahim@email.com",
      city: "Sibu, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 18,
      approved: 16,
      lastLogin: "15/01/2024, 08:12 pm",
    },
    {
      id: 20,
      name: "Claudia Ting",
      email: "claudia.ting@email.com",
      city: "Kuching, Sarawak",
      role: "Admin",
      status: "Active",
      suspendedOn: null,
      submissions: 1,
      approved: 1,
      lastLogin: "17/01/2024, 01:05 pm",
    },
    {
      id: 21,
      name: "Haziq Hamdan",
      email: "haziq.hamdan@email.com",
      city: "Bintulu, Sarawak",
      role: "User",
      status: "Inactive",
      suspendedOn: null,
      submissions: 0,
      approved: 0,
      lastLogin: "—",
    },
    {
      id: 22,
      name: "Tracy Lim",
      email: "tracy.lim@email.com",
      city: "Miri, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 10,
      approved: 8,
      lastLogin: "12/01/2024, 10:50 am",
    },
    {
      id: 23,
      name: "Samuel Goh",
      email: "samuel.goh@email.com",
      city: "Samarahan, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 4,
      approved: 3,
      lastLogin: "13/01/2024, 02:25 pm",
    },
    {
      id: 24,
      name: "Nabila Hassan",
      email: "nabila.hassan@email.com",
      city: "Kapit, Sarawak",
      role: "User",
      status: "Suspended",
      suspendedOn: "2024-01-05",
      submissions: 6,
      approved: 1,
      lastLogin: "05/01/2024, 10:00 am",
    },
    {
      id: 25,
      name: "Ricky Chai",
      email: "ricky.chai@email.com",
      city: "Kuching, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 13,
      approved: 11,
      lastLogin: "17/01/2024, 05:40 pm",
    },
    {
      id: 26,
      name: "Adele Liew",
      email: "adele.liew@email.com",
      city: "Sibu, Sarawak",
      role: "User",
      status: "Inactive",
      suspendedOn: null,
      submissions: 2,
      approved: 1,
      lastLogin: "20/12/2023, 09:00 am",
    },
    {
      id: 27,
      name: "Muhd Iqbal",
      email: "m.iqbal@email.com",
      city: "Miri, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 9,
      approved: 7,
      lastLogin: "16/01/2024, 07:05 pm",
    },
    {
      id: 28,
      name: "Vivian Toh",
      email: "vivian.toh@email.com",
      city: "Bintulu, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 1,
      approved: 1,
      lastLogin: "11/01/2024, 03:12 pm",
    },
    {
      id: 29,
      name: "Rafidah Ahmad",
      email: "rafidah.ahmad@email.com",
      city: "Lundu, Sarawak",
      role: "User",
      status: "Active",
      suspendedOn: null,
      submissions: 7,
      approved: 6,
      lastLogin: "14/01/2024, 08:42 am",
    },
    {
      id: 30,
      name: "Kenji Yong",
      email: "kenji.yong@email.com",
      city: "Miri, Sarawak",
      role: "User",
      status: "Inactive",
      suspendedOn: null,
      submissions: 0,
      approved: 0,
      lastLogin: "—",
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

  useEffect(() => {
    setPage(1);
  }, [userSearch, roleFilter, statusFilter]);

  const totalUsersFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsersFiltered / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalUsersFiltered);
  const pageUsers = filteredUsers.slice(startIdx, endIdx);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
    if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [totalPages, page]);

  useEffect(() => {
    if (!showEmailModal) return;
    const onKey = (e) => e.key === "Escape" && setShowEmailModal(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showEmailModal]);

  const adminIds = users.filter(u => u.role === "Admin").map(u => u.id);

  const parseCustomEmails = (text) => {
    if (!text.trim()) return [];
    // split by comma, trim, basic email shape check, unique
    const seen = new Set();
    return text
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
      .filter(s => (seen.has(s) ? false : (seen.add(s), true)));
  };

  const totalRecipients = (() => {
    switch (emailForm.recipientsOption) {
      case "All users":
        return users.length;
      case "Administrators only":
        return adminIds.length;
      case "Specific users":
        return emailForm.selectedUserIds.length;
      case "Custom Email Addresses":
        return parseCustomEmails(emailForm.customEmails).length;
      default:
        return 0;
    }
  })();

  const filteredSpecificUsers = users.filter(u => {
    if (specificSearch.trim() === "") return true;
    const q = specificSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q)
    );
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
            <button className="umg-email-btn" onClick={() => setShowEmailModal(true)}>
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
                <Users />
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
                  <th className="umg-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="umg-empty">No users found.</td>
                  </tr>
                ) : (
                  pageUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="umg-name">{u.name}</div>
                        <div className="umg-subline">{u.email}</div>
                        <div className="umg-subline">{u.city}</div>
                        <div className="umg-status-inline">
                          {u.status === "Active" && <span className="umg-pill umg-pill-active">Active</span>}
                          {u.status === "Inactive" && <span className="umg-pill umg-pill-inactive">Inactive</span>}
                          {u.status === "Suspended" && <span className="umg-pill umg-pill-suspended">Suspended</span>}
                        </div>
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

                      <td className="umg-ellipsis-td">
                        <button className="umg-ellipsis" aria-label="More actions">⋯</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="umg-pager">
              <div className="umg-pager-left">
                <label className="umg-pager-label">Rows per page:</label>
                <select
                  value={pageSize}
                    onChange={(e) => {
                      const size = Number(e.target.value);
                      setPageSize(size); 
                      setPage(1);        
                    }}
                  onBlur={(e) => setPageSize(Number(e.target.value))}
                  className="umg-pager-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>

                <span className="umg-pager-range">
                  {totalUsersFiltered === 0 ? "0-0 of 0" : `${startIdx + 1}–${endIdx} of ${totalUsersFiltered}`}
                </span>
              </div>

              <div className="umg-pager-right">
                <button
                  className="umg-page-btn"
                  onClick={goPrev}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                <span className="umg-page-indicator">{page} / {totalPages}</span>

                <button
                  className="umg-page-btn"
                  onClick={goNext}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
          {showEmailModal && (
          <div
            className="umg-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowEmailModal(false)}
          >
            <div
              className="umg-modal"
              onClick={(e) => e.stopPropagation()} // prevent backdrop close
            >
              {/* Header */}
              <div className="umg-modal-header">
                <h3><Mail size = "18"/> Send Email Notification</h3>
                <button className="umg-modal-close" onClick={() => setShowEmailModal(false)} aria-label="Close"><X/></button>
              </div>

              {/* Body */}
              <div className="umg-modal-body">
                {/* Recipients */}
                <div className="umg-field">
                  <label className="umg-label">Recipients</label>
                  <select
                    className="umg-input"
                    value={emailForm.recipients}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientsOption: e.target.value })}
                  >
                    <option>All users</option>
                    <option>Specific users</option>
                    <option>Administrators only</option>
                    <option>Custom Email Addresses</option>
                  </select>
                  
                  {/* Specific users: show a compact checklist */}
                  {emailForm.recipientsOption === "Specific users" && (
                    <div className="umg-specific-list">
                      <input
                        className="umg-input"
                        placeholder="Search users to select…"
                        value={specificSearch}
                        onChange={(e) => setSpecificSearch(e.target.value)}
                      />
                      <div className="umg-specific-scroll">
                        {filteredSpecificUsers.length === 0 ? (
                          <div className="umg-empty" style={{ padding: 8 }}>No matches.</div>
                        ) : (
                          filteredSpecificUsers.map(u => (
                            <label key={u.id} className="umg-specific-row">
                              <input
                                type="checkbox"
                                className="umg-row-checkbox"
                                checked={emailForm.selectedUserIds.includes(u.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setEmailForm(prev => ({
                                    ...prev,
                                    selectedUserIds: checked
                                      ? [...prev.selectedUserIds, u.id]
                                      : prev.selectedUserIds.filter(id => id !== u.id),
                                  }));
                                }}
                              />
                              <div>
                                <div className="umg-name">{u.name}</div>
                                <div className="umg-subline">{u.email}</div>
                                <div className="umg-subline">{u.city}</div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom emails: show input */}
                  {emailForm.recipientsOption === "Custom Email Addresses" && (
                    <div className="umg-field">
                      <label className="umg-label">Enter email addresses</label>
                      <textarea
                        className="umg-input umg-textarea"
                        placeholder="Enter comma-separated emails, e.g. alice@mail.com, bob@mail.com"
                        value={emailForm.customEmails}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, customEmails: e.target.value })
                        }
                      />
                    </div>
                  )}

                  <div className="umg-hint">Total Recipients: {totalRecipients}</div>
                </div>

                {/* Template */}
                <div className="umg-field">
                  <label className="umg-label">Email Template</label>
                  <select
                    className="umg-input"
                    value={emailForm.template}
                    onChange={(e) => {
                      const value = e.target.value;
                      const tpl = EMAIL_TEMPLATES[value] || { subject: "", message: "" };
                      setEmailForm(prev => ({
                        ...prev,
                        template: value,
                        subject: tpl.subject,   // always update
                        message: tpl.message,   // always update
                      }));
                    }}
                  >
                    <option value="Custom message">Custom message</option>
                    <option value="Welcome Message">Welcome Message</option>
                    <option value="Content Approval">Content Approval</option>
                    <option value="Content Rejection">Content Rejection</option>
                    <option value="System Update">System Update</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="umg-field">
                  <label className="umg-label">Subject</label>
                  <input
                    className="umg-input"
                    placeholder="Enter email subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                {/* Message */}
                <div className="umg-field">
                  <label className="umg-label">Message</label>
                  <textarea
                    className="umg-input umg-textarea"
                    placeholder="Enter your message"
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                {/* Announcement checkbox */}
                <label className="umg-check">
                  <input
                    type="checkbox"
                    checked={emailForm.markAnnouncement}
                    onChange={(e) => setEmailForm({ ...emailForm, markAnnouncement: e.target.checked })}
                  />
                  <div>
                    <div><Bell size = "16" /> Mark as Announcement</div>
                    <div className="umg-check-hint">Announcements appear in user notifications</div>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="umg-modal-footer">
                <button className="umg-btn-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
                <button
                  className="umg-btn-primary"
                  onClick={() => {
                    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
                      alert("Please provide a subject and message.");
                      return;
                    }

                    let recipients = [];
                    if (emailForm.recipientsOption === "All users") {
                      recipients = users.map(u => u.email);
                    } else if (emailForm.recipientsOption === "Administrators only") {
                      recipients = users.filter(u => u.role === "Admin").map(u => u.email);
                    } else if (emailForm.recipientsOption === "Specific users") {
                      const chosen = new Set(emailForm.selectedUserIds);
                      recipients = users.filter(u => chosen.has(u.id)).map(u => u.email);
                    } else if (emailForm.recipientsOption === "Custom Email Addresses") {
                      recipients = parseCustomEmails(emailForm.customEmails);
                    }

                    console.log("SEND EMAIL ▶", {
                      ...emailForm,
                      recipients,
                      total: recipients.length,
                    });

                    setShowEmailModal(false);
                  }}
                >
                  <Send size = "18"/> Send Email
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

    </div>
    <Footer />
    </div>
  );
};

export default AdminDashboard;
