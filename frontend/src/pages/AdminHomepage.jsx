// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom"; 
// import { useTranslation } from "react-i18next";
// import "../css/AdminDashboard.css";

// // === Components ===
// import Header from "../components/Header";
// import Footer from "../components/Footer";
// import FoodDatabaseSection from "./AdminFoodDatabase.jsx";
// import RecipeDatabaseSection from "./AdminRecipeDatabase.jsx";
// import UserManagement from "./AdminUserManagementTab";
// import Analytics from "./Analytics";
// import AdminSystemSettings from "./AdminSystemSettings.jsx";
// import CommunityPostDatabaseSection from "./AdminCommunityPostDatabase.jsx";

// // === Icons ===
// import { FiDatabase } from "react-icons/fi";
// import { GoPeople } from "react-icons/go";
// import { LuFileCheck } from "react-icons/lu";
// import { FaRegFlag } from "react-icons/fa6";
// import { FaRegChartBar } from "react-icons/fa";
// import { CiSettings } from "react-icons/ci";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// const AdminDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { t } = useTranslation();

//   // ✅ DYNAMIC STATE INITIALIZATION: Read Tab & Status from URL on load
//   const [activeTab, setActiveTab] = useState(() => {
//     const params = new URLSearchParams(window.location.search);
//     const tab = params.get("tab");
//     return ["food", "users", "moderation", "analytics", "settings"].includes(tab) 
//       ? tab 
//       : "food";
//   });

//   const [initialFilter, setInitialFilter] = useState(() => {
//     const params = new URLSearchParams(window.location.search);
//     return params.get("status") || "All";
//   });

//   const categories = [
//     "All Categories", "Poultry", "Seafood", "Vegetables", "Fermented",
//     "Desserts", "Rice Dish", "Noodles", "Soup", "Meat",
//   ];

//   // --- State definitions ---
//   const [summary, setSummary] = useState({
//     totalFoods: 0,
//     totalUsers: 0,
//     pendingApproval: 0,
//     flaggedContent: 0,
//   });

//   const [foodData, setFoodData] = useState([]);
//   const [recipes, setRecipes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [userList, setUserList] = useState([]);
//   const [loadingUsers, setLoadingUsers] = useState(true);
//   const [errorUsers, setErrorUsers] = useState(null);

//   const [pendingCommunityPosts, setPendingCommunityPosts] = useState([]);
//   const [rejectedCommunityPosts, setRejectedCommunityPosts] = useState([]);
//   const [approvedCommunityPosts, setApprovedCommunityPosts] = useState([]);

//   // ✅ LISTENER: Sync State with URL changes
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const tab = params.get("tab");
//     const status = params.get("status");
    
//     if (tab && ["food", "users", "moderation", "analytics", "settings"].includes(tab)) {
//       setActiveTab(tab);
//     }
//     if (status) {
//       setInitialFilter(status);
//     }
//   }, [location.search]);

//   // FUNCTION: Handle Tab & Filter Switching
//   const handleTabChange = (tabName, filterStatus = "All") => {
//     setActiveTab(tabName);
//     setInitialFilter(filterStatus);
//     navigate(`/admin?tab=${tabName}&status=${filterStatus}`, { replace: true });
//   };

//   // ========================================================
//   // Fetching Data
//   // ========================================================
//   useEffect(() => {
//     const fetchTotalFoods = async () => {
//       try {
//         const response = await fetch(`${API_URL}/api/foods/count`);
//         const data = await response.json();
//         if (data.success) {
//           setSummary((prev) => ({ ...prev, totalFoods: data.total }));
//           console.log(`[Dashboard] Total Foods Count: ${data.total}`);
//         }
//       } catch (err) { console.error("❌ Error fetching total foods:", err.message); }
//     };
//     fetchTotalFoods();
//   }, []);

//   useEffect(() => {
//     const fetchFoods = async () => {
//       try {
//         const res = await fetch(`${API_URL}/api/foods`);
//         const data = await res.json();
//         if (Array.isArray(data)) {
//           setFoodData(data);
//           console.log(`[Dashboard] Fetched Food Data: ${data.length} items.`);
//         }
//       } catch (error) { console.error("❌ Error fetching food data:", error); }
//     };
//     fetchFoods();
//   }, []);

//   useEffect(() => {
//     const fetchRecipes = async () => {
//       try {
//         console.log(`[Dashboard] Fetching ALL recipes from: ${API_URL}/api/recipe/all/recipes?includeAll=true`);
//         const recipeRes = await fetch(
//           `${API_URL}/api/recipe/all/recipes?includeAll=true`
//         );
//         const data = await recipeRes.json();
//         if (Array.isArray(data)) {
//           setRecipes(data);
//           console.log(`[Dashboard] Fetched Recipe Data: ${data.length} items.`);
//         }
//       } catch (error) { console.error("❌ Error fetching recipes:", error); } finally { setLoading(false); }
//     };
//     fetchRecipes();
//   }, []);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         setLoadingUsers(true);
//         console.log(`[Dashboard] Fetching all users from: ${API_URL}/api/admin/users`);
//         const response = await fetch(`${API_URL}/api/admin/users`, { credentials: "include" });
//         if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
//         const data = await response.json();
//         if (data.success && Array.isArray(data.users)) {
//           setUserList(data.users);
//           setErrorUsers(null);
//           console.log(`[Dashboard] Total Users: ${data.users.length}`);
//         } else throw new Error("Invalid response format");
//       } catch (err) {
//         console.error("❌ Error fetching users:", err);
//         setErrorUsers(err.message);
//         setUserList([]);
//       } finally {
//         setLoadingUsers(false);
//       }
//     };
//     fetchUsers();
//   }, []);

//   useEffect(() => {
//     const fetchPending = async () => {
//       try {
//         const res = await fetch(`${API_URL}/api/communityPost/admin/pending`, { credentials: "include" });
//         const data = await res.json();
//         if (data.success) setPendingCommunityPosts(data.data || []);
//       } catch (error) { console.error("❌ Error fetching pending posts:", error); }
//     };
//     fetchPending();
//   }, []);

//   useEffect(() => {
//     const fetchRejected = async () => {
//       try {
//         const res = await fetch(`${API_URL}/api/communityPost/admin/rejected`, { credentials: "include" });
//         const data = await res.json();
//         if (data.success) setRejectedCommunityPosts(data.data || []);
//       } catch (error) { console.error("❌ Error fetching rejected posts:", error); }
//     };
//     fetchRejected();
//   }, []);

//   useEffect(() => {
//     const fetchApproved = async () => {
//       try {
//         const response = await fetch(`${API_URL}/api/communityPost/counts`, { credentials: "include" });
//         const result = await response.json();
//         if (result.success) setApprovedCommunityPosts(result.data || []);
//       } catch (error) { console.error("⚠️ Error fetching approved community posts:", error); }
//     };
//     fetchApproved();
//   }, []);

//   // ========================================================
//   // Summary calculation
//   // ========================================================
//   useEffect(() => {
//     const pendingRecipeCount = recipes.filter(r => (r.status || "").toLowerCase() === "pending").length;
//     const pendingPostCount = pendingCommunityPosts.length; 
//     const rejectedRecipeCount = recipes.filter(r => (r.status || "").toLowerCase() === "rejected").length;
//     const rejectedPostCount = rejectedCommunityPosts.length; 

//     setSummary((prev) => ({
//       ...prev,
//       pendingApproval: pendingRecipeCount + pendingPostCount,
//       totalUsers: userList.length,
//       flaggedContent: rejectedRecipeCount + rejectedPostCount,
//     }));
    
//     console.log(`[Dashboard] Summary Calculated: Pending: ${pendingRecipeCount + pendingPostCount}, Rejected: ${rejectedRecipeCount + rejectedPostCount}`);

//   }, [recipes, userList, pendingCommunityPosts, rejectedCommunityPosts]);

//   // ========================================================
//   // Derived datasets for tables
//   // ========================================================
//   const approvedRecipes = recipes.filter((r) => r.status === "Approved");
//   const pendingRecipes = recipes.filter((r) => r.status === "Pending" || r.status === "Rejected");
//   const combinedModerationPosts = [...pendingCommunityPosts, ...rejectedCommunityPosts];

//   const renderContent = () => {
//     switch (activeTab) {
//       case "food":
//         return (
//           <>
//             <FoodDatabaseSection foodData={foodData} categories={categories} />
//             <RecipeDatabaseSection recipes={approvedRecipes} categories={categories} sectionType="approved" />
//             <CommunityPostDatabaseSection categories={categories} posts={approvedCommunityPosts} sectionType="approved" />
//           </>
//         );

//       case "users":
//         return <UserManagement users={userList} loading={loadingUsers} error={errorUsers} setUsers={setUserList} />;

//       case "moderation":
//         return (
//           <>
//             <CommunityPostDatabaseSection 
//               categories={categories} 
//               posts={combinedModerationPosts} 
//               sectionType="pending" 
//               initialStatus={initialFilter} 
//             />
//             <RecipeDatabaseSection 
//               recipes={pendingRecipes} 
//               categories={categories} 
//               sectionType="pending" 
//               initialStatus={initialFilter} 
//             />
//           </>
//         );

//       case "analytics": return <Analytics />;
//       case "settings": return <AdminSystemSettings onPageChange={handleTabChange} />;
//       default: return <div className="food-database-section"></div>;
//     }
//   };

//   // ========================================================
//   // Render Main UI
//   // ========================================================
//   return (
//     <div>
//       <Header />
//       <div className="admin-dashboard">
//         <div className="dashboard-header">
//           <h1>{t("adminHome.title")}</h1>
//           <p>{t("adminHome.subtitle")}</p>
//         </div>

//         {/* === Summary Cards === */}
//         <div className="summary-cards">
          
//           <div 
//             className="summary-card" 
//             onClick={() => handleTabChange("food")} 
//             style={{ cursor: "pointer" }} 
//           >
//             <div>
//               <h3>{t("adminHome.totalFoodDatabase")}</h3>
//               <p>{summary.totalFoods}</p>
//             </div>
//             <div className="summary-icon"><FiDatabase /></div>
//           </div>

//           <div 
//             className="summary-card" 
//             onClick={() => handleTabChange("users")} 
//             style={{ cursor: "pointer" }}
//           >
//             <div>
//               <h3>{t("adminHome.totalUserManagement")}</h3>
//               <p>{summary.totalUsers}</p>
//             </div>
//             <div className="summary-icon"><GoPeople /></div>
//           </div>

//           <div 
//             className="summary-card" 
//             onClick={() => handleTabChange("moderation", "Pending")}
//             style={{ cursor: "pointer" }}
//           >
//             <div>
//               <h3>{t("adminHome.pendingApproval")}</h3>
//               <p>{summary.pendingApproval}</p>
//             </div>
//             <div className="summary-icon"><LuFileCheck /></div>
//           </div>

//           <div 
//             className="summary-card"
//             onClick={() => handleTabChange("moderation", "Rejected")}
//             style={{ cursor: "pointer" }}
//           >
//             <div>
//               <h3>{t("adminHome.rejectedContent")}</h3>
//               <p>{summary.flaggedContent}</p> 
//             </div>
//             <div className="summary-icon"><FaRegFlag /></div>
//           </div>
//         </div>

//         {/* === Tab Navigation === */}
//         <div className="dashboard-tabs">
//           <button className={activeTab === "food" ? "active" : ""} onClick={() => handleTabChange("food")}>
//             <FiDatabase /> {t("adminHome.tabDatabase")}
//           </button>
//           <button className={activeTab === "users" ? "active" : ""} onClick={() => handleTabChange("users")}>
//             <GoPeople /> {t("adminHome.tabUsers")}
//           </button>
//           <button className={activeTab === "moderation" ? "active" : ""} onClick={() => handleTabChange("moderation")}>
//             <LuFileCheck /> {t("adminHome.tabModeration")}
//           </button>
//           <button className={activeTab === "analytics" ? "active" : ""} onClick={() => handleTabChange("analytics")}>
//             <FaRegChartBar /> {t("adminHome.tabAnalytics")}
//           </button>
//           <button className={activeTab === "settings" ? "active" : ""} onClick={() => handleTabChange("settings")}>
//             <CiSettings /> {t("adminHome.tabSettings")}
//           </button>
//         </div>

//         {/* === Dashboard Content === */}
//         <div className="dashboard-content">
//           {loading ? <p>{t("adminHome.loadingData")}</p> : renderContent()}
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default AdminDashboard;