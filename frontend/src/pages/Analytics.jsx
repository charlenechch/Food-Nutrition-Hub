// // src/pages/Analytics.jsx
// import React, { useState, useEffect } from "react";
// import PieChart from "./charts/piechart";
// import BarChart from "./charts/barchart";
// import "../css/Analytics.css";
// import { FaUtensils, FaBook, FaUsers, FaExclamationTriangle, FaStar, FaFlag, FaChartLine } from "react-icons/fa";
// import { BsCheckCircle } from "react-icons/bs";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// // src/pages/Analytics.jsx
// export const analyticsApi = {
//   // Get metrics data for cards
//   getMetrics: async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/analytics/metrics`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching metrics data:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   getPostsRecipesByMonth: async (year = new Date().getFullYear()) => {
//     try {
//       const response = await fetch(`${API_URL}/api/analytics/posts-recipes-by-month?year=${year}`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching posts and recipes data:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   // Get cultural origin data for pie chart
//   getCulturalOrigin: async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/analytics/cultural-origin`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching cultural origin data:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   // Get popular categories data
//   getPopularCategories: async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/analytics/popular-categories`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching popular categories data:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   // Get top contributors data - UPDATED to use separate endpoints
//   getTopContributors: async (view = 'recipes') => {
//     try {
//       console.log(`🔄 Fetching top contributors for: ${view}`);
      
//       // Use separate endpoints to avoid HPP 'view' parameter issue
//       const endpoint = view === 'recipes' ? 'top-contributors-recipes' : 'top-contributors-stories';
//       const response = await fetch(`${API_URL}/api/analytics/${endpoint}`);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching top contributors data:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   // Get available years
//   getAvailableYears: async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/analytics/available-years`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching available years:', error);
//       return { success: false, error: error.message };
//     }
//   }
// };

// const Analytics = () => {
//   const [barChartData, setBarChartData] = useState([]);
//   const [totals, setTotals] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [metrics, setMetrics] = useState({});
//   const [culturalOriginData, setCulturalOriginData] = useState([]);
//   const [popularCategories, setPopularCategories] = useState([]);
//   const [topContributors, setTopContributors] = useState([]);
//   const [error, setError] = useState(null);
//   const [viewMode, setViewMode] = useState('recipes');
//   const [selectedYear, setSelectedYear] = useState('');
//   const [availableYears, setAvailableYears] = useState([]);

//   // ADD MISSING FUNCTION: Fetch top contributors
//   const fetchTopContributors = async (view = 'recipes') => {
//     try {
//       const result = await analyticsApi.getTopContributors(view);
//       if (result.success) {
//         setTopContributors(result.data);
//       } else {
//         console.error('Error fetching top contributors:', result.error);
//         setTopContributors([]);
//       }
//     } catch (error) {
//       console.error('Error fetching top contributors:', error);
//       setTopContributors([]);
//     }
//   };

//   const fetchBarChartData = async (year) => {
//     try {
//       console.log(`🔄 Fetching bar chart data for year: ${year}`);
//       const result = await analyticsApi.getPostsRecipesByMonth(year);
//       console.log(`📊 API Response for ${year}:`, result);
      
//       if (result.success) {
//         console.log(`✅ Bar chart data loaded for ${year}:`, result.data);
//         console.log(`📈 Totals for ${year}:`, result.totals);
//         setBarChartData(result.data);
//         setTotals(result.totals || {});
//       } else {
//         console.error(`❌ Error in bar chart data for ${year}:`, result.error);
//         setBarChartData([]);
//         setTotals({});
//       }
//     } catch (error) {
//       console.error(`❌ Error fetching chart data for ${year}:`, error);
//       setBarChartData([]);
//       setTotals({});
//     }
//   };

//   useEffect(() => {
//     const fetchAvailableYears = async () => {
//       try {
//         const result = await analyticsApi.getAvailableYears();
        
//         if (result.success) {
//           setAvailableYears(result.data);
//           // Set default to latest year
//           if (result.data.length > 0) {
//             setSelectedYear(result.data[0]);
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching years:', error);
//       }
//     };

//     fetchAvailableYears();
//   }, []);

//   // Update barChartData based on selectedYear - FIXED
//   useEffect(() => {
//     if (selectedYear) {
//       fetchBarChartData(selectedYear);
//     }
//   }, [selectedYear]);

//   useEffect(() => {
//     const fetchAnalyticsData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         // Get years first to set selectedYear
//         const yearsResult = await analyticsApi.getAvailableYears();
//         if (yearsResult.success && yearsResult.data.length > 0) {
//           setAvailableYears(yearsResult.data);
//           const defaultYear = yearsResult.data[0];
//           setSelectedYear(defaultYear);
          
//           // Fetch initial bar chart data with default year
//           const barChartResult = await analyticsApi.getPostsRecipesByMonth(defaultYear);
//           if (barChartResult.success) {
//             setBarChartData(barChartResult.data);
//             setTotals(barChartResult.totals || {});
//           }
//         }

//         const [
//           metricsResponse,
//           culturalOriginResponse,
//           popularCategoriesResponse,
//           topContributorsResponse
//         ] = await Promise.all([
//           analyticsApi.getMetrics(),
//           analyticsApi.getCulturalOrigin(),
//           analyticsApi.getPopularCategories(),
//           analyticsApi.getTopContributors('recipes') // Set initial view to recipes
//         ]);

//         console.log('📊 Analytics Responses:', {
//           metrics: metricsResponse,
//           culturalOrigin: culturalOriginResponse,
//           popularCategories: popularCategoriesResponse,
//           topContributors: topContributorsResponse
//         });

//         // ✅ Safe checking with default values
//         if (metricsResponse?.success) setMetrics(metricsResponse.data || {});
//         if (culturalOriginResponse?.success) setCulturalOriginData(culturalOriginResponse.data || []);
//         if (popularCategoriesResponse?.success) setPopularCategories(popularCategoriesResponse.data || []);
//         if (topContributorsResponse?.success) setTopContributors(topContributorsResponse.data || []);
        
//         // Check if any API call failed
//         const failedRequests = [
//           metricsResponse, culturalOriginResponse, 
//           popularCategoriesResponse, topContributorsResponse
//         ].filter(response => !response?.success);
        
//         if (failedRequests.length > 0) {
//           setError(`Some data failed to load: ${failedRequests.length} endpoints failed`);
//         }
        
//       } catch (error) {
//         console.error('Error fetching analytics data:', error);
//         setError('Error loading analytics data. Please try again later.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAnalyticsData();
//   }, []);

//   // Calculate max submissions for percentage bars
//   const maxSubmissions = popularCategories.length > 0 
//     ? Math.max(...popularCategories.map(cat => cat.submissions))
//     : 1;

//   if (loading) {
//     return (
//       <div className="analytics">
//         <div className="loading">Loading analytics data...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="analytics">
//       <header className="analytics-header">
//         <h1><FaUsers className="icon-user" /> Community Analytics</h1>
//         <p>Monitor community contributions and engagement metrics</p>
//       </header>

//       {error && (
//         <div className="error-message">
//           ⚠️ {error}
//         </div>
//       )}

//       <h2><FaChartLine className="icon-chartLine" /> Community Contributions</h2>
//       <br></br>

//       <div className="analytics-dashboard">
//         <div className="metrics-grid">
//           {/* Total Recipes Card */}
//           <div className="metric-card">
//             <h3 className="metric-title">Total Recipes Shared <FaUtensils className="icon-utensils" /></h3>
//             <div className="metric-value">{metrics.totalRecipes?.toLocaleString() || '0'}</div>
//             <div className="metric-change">
//               {metrics.percentages?.recipes !== undefined ? (
//                 <span className={metrics.percentages.recipes >= 0 ? 'positive' : 'negative'}>
//                   {metrics.percentages.recipes >= 0 ? '+' : ''}{metrics.percentages.recipes}% from last month
//                 </span>
//               ) : (
//                 'Loading...'
//               )}
//             </div>
//           </div>

//           {/* Total Stories Card */}
//           <div className="metric-card">
//             <h3 className="metric-title">Total Stories Shared <FaBook className="icon-book" /></h3>     
//             <div className="metric-value">{metrics.totalStories?.toLocaleString() || '0'}</div>
//             <div className="metric-change">
//               {metrics.percentages?.stories !== undefined ? (
//                 <span className={metrics.percentages.stories >= 0 ? 'positive' : 'negative'}>
//                   {metrics.percentages.stories >= 0 ? '+' : ''}{metrics.percentages.stories}% from last month
//                 </span>
//               ) : (
//                 'Loading...'
//               )}
//             </div>
//           </div>

//           {/* Pending Recipes Card */}
//           <div className="metric-card">
//             <h3 className="metric-title">Recipe Pending Reviews<FaExclamationTriangle className="icon-alert" /></h3>
//             <div className="metric-value">{metrics.pendingRecipes?.toLocaleString() || '0'}</div>
//             <div className="metric-change">
//               {metrics.pendingRecipes > 0 ? (
//                 <span className="attention-tag">
//                   <FaExclamationTriangle className="tag-icon" />
//                   Requires attention
//                 </span>
//               ) : (
//                 <span className="all-caught-tag">
//                   <BsCheckCircle className="tag-icon" />
//                   All caught up!
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* Pending Stories Card */}
//           <div className="metric-card">
//             <h3 className="metric-title">Stories Pending Reviews <FaExclamationTriangle className="icon-alert" /></h3>
//             <div className="metric-value">{metrics.pendingStories?.toLocaleString() || '0'}</div>
//             <div className="metric-change">
//               {metrics.pendingStories > 0 ? (
//                 <span className="attention-tag">
//                   <FaExclamationTriangle className="tag-icon" />
//                   Requires attention
//                 </span>
//               ) : (
//                 <span className="all-caught-tag">
//                   <BsCheckCircle className="tag-icon" />
//                   All caught up!
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
        
//         <div className="charts-section">
//           <div className="charts-grid">
//             {/* Pie Chart Card */}
//             <div className="chart-card">
//               <div className="pie-chart-container">
//                 <h3 className="chart-title">Food Submissions by Cultural Origin</h3>
//                 <PieChart data={culturalOriginData} />
//               </div>
//             </div>

//             {/* Bar Chart Card */}
//             <div className="chart-card">
//               <div className="chart-header">
//                 <h3 className="chart-title">Monthly Community Contribution Trends</h3>
//                 <div className="year-filter">
//                   <span className="filter-label">Year:</span>
//                   <select 
//                     value={selectedYear} 
//                     onChange={(e) => setSelectedYear(e.target.value)}
//                     className="year-select"
//                   >
//                     {availableYears.map(year => (
//                       <option key={year} value={year}>{year}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//               <BarChart data={barChartData} width={550} height={350} />
//             </div>
//           </div>

//           {/* Additional Cards Section */}
//           <div className="additional-cards-grid">
//             {/* Popular Food Categories Card */}
//             <div className="additional-card">
//               <h3 className="additional-card-title"><FaFlag className="icon-flag" /> Popular Food Categories</h3>
//               <div className="categories-list">
//                 {popularCategories.map((category, index) => (
//                   <div key={index} className={`category-item ${index === 0 ? 'category-main' : ''}`}>
//                     <div className="category-info">
//                       <span className="category-name">{category.name}</span>
//                       <span className="category-submissions">{category.submissions} submissions</span>
//                     </div>
//                     <div className="category-bar-container">
//                       <div 
//                         className="category-bar"
//                         style={{ 
//                           width: `${(category.submissions / maxSubmissions) * 100}%` 
//                         }}
//                       ></div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Top Contributors Card */}
//             <div className="additional-card">
//               <div className="card-header-with-toggle">
//                 <h3 className="additional-card-title">
//                   <FaStar className="icon-star" /> Top 5 Contributors
//                 </h3>
//                 <div className="view-toggle">
//                   <button 
//                     className={`toggle-btn ${viewMode === 'recipes' ? 'active' : ''}`}
//                     onClick={() => {
//                       setViewMode('recipes');
//                       fetchTopContributors('recipes');
//                     }}
//                   >
//                     Recipes
//                   </button>
//                   <button 
//                     className={`toggle-btn ${viewMode === 'stories' ? 'active' : ''}`}
//                     onClick={() => {
//                       setViewMode('stories');
//                       fetchTopContributors('stories');
//                     }}
//                   >
//                     Stories
//                   </button>
//                 </div>
//               </div>
              
//               <div className="contributors-list">
//                 {topContributors && topContributors.length > 0 ? (
//                   topContributors.map((contributor, index) => (
//                     <div key={contributor.userProfileID || index} className="contributor-item">
//                       <div className="contributor-rank">{index + 1}</div>
//                       <div className="contributor-info">
//                         <span className="contributor-name">
//                           {`${contributor.firstname} ${contributor.lastname}`}
//                         </span>
//                       </div>
//                       <div className="contributor-posts">
//                         <span className="posts-count">
//                           {viewMode === 'recipes' ? (contributor.recipes || 0) : (contributor.stories || 0)}
//                         </span>
//                         <span className="posts-label">
//                           {viewMode === 'recipes' ? 'RECIPES' : 'STORIES'}
//                         </span>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="no-contributors">
//                     No {viewMode} contributors found
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Analytics;

// src/pages/Analytics.jsx
import React, { useState, useEffect } from "react";
import PieChart from "./charts/piechart";
import BarChart from "./charts/barchart";
import "../css/Analytics.css";
import { FaUtensils, FaBook, FaUsers, FaExclamationTriangle, FaStar, FaFlag, FaChartLine } from "react-icons/fa";
import { BsCheckCircle } from "react-icons/bs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// Analytics API functions
export const analyticsApi = {
  getMetrics: async (year = null, month = null) => {
    try {
      let url = `${API_URL}/api/analytics/metrics`;
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      return { success: false, error: error.message };
    }
  },

  getCulturalOrigin: async (year = null, month = null) => {
    try {
      let url = `${API_URL}/api/analytics/cultural-origin`;
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching cultural origin data:', error);
      return { success: false, error: error.message };
    }
  },

  getPopularCategories: async (year = null, month = null) => {
    try {
      let url = `${API_URL}/api/analytics/popular-categories`;
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular categories data:', error);
      return { success: false, error: error.message };
    }
  },

  getTopContributors: async (view = 'recipes', year = null, month = null) => {
    try {
      const endpoint = view === 'recipes' ? 'top-contributors-recipes' : 'top-contributors-stories';
      let url = `${API_URL}/api/analytics/${endpoint}`;
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching top contributors data:', error);
      return { success: false, error: error.message };
    }
  },

  getPostsRecipesByMonth: async (year = new Date().getFullYear(), month = null) => {
    try {
      let url = `${API_URL}/api/analytics/posts-recipes-by-month?year=${year}`;
      if (month) url += `&month=${month}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching posts and recipes data:', error);
      return { success: false, error: error.message };
    }
  },

  getAvailableYears: async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/available-years`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching available years:', error);
      return { success: false, error: error.message };
    }
  },

  getAvailableMonths: async (year) => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/available-months?year=${year}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching available months:', error);
      return { success: false, error: error.message };
    }
  }
};

const Analytics = () => {
  const [barChartData, setBarChartData] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [culturalOriginData, setCulturalOriginData] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('recipes');
  
  // Timeline state
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [timeframeType, setTimeframeType] = useState('yearly');

  // Fetch all analytics data
  const fetchAllAnalyticsData = async (year = null, month = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        metricsResponse,
        culturalOriginResponse,
        popularCategoriesResponse,
        topContributorsResponse,
        barChartResponse
      ] = await Promise.all([
        analyticsApi.getMetrics(year, month),
        analyticsApi.getCulturalOrigin(year, month),
        analyticsApi.getPopularCategories(year, month),
        analyticsApi.getTopContributors(viewMode, year, month),
        analyticsApi.getPostsRecipesByMonth(year, month)
      ]);

      // Update all states
      if (metricsResponse?.success) setMetrics(metricsResponse.data || {});
      if (culturalOriginResponse?.success) setCulturalOriginData(culturalOriginResponse.data || []);
      if (popularCategoriesResponse?.success) setPopularCategories(popularCategoriesResponse.data || []);
      if (topContributorsResponse?.success) setTopContributors(topContributorsResponse.data || []);
      if (barChartResponse?.success) {
        setBarChartData(barChartResponse.data);
        setTotals(barChartResponse.totals || {});
      }
      
      // Check for errors
      const failedRequests = [
        metricsResponse, culturalOriginResponse, 
        popularCategoriesResponse, topContributorsResponse,
        barChartResponse
      ].filter(response => !response?.success);
      
      if (failedRequests.length > 0) {
        setError(`Some data failed to load: ${failedRequests.length} endpoints failed`);
      }
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Error loading analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load - get available years and set default
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const yearsResult = await analyticsApi.getAvailableYears();
        if (yearsResult.success && yearsResult.data.length > 0) {
          const years = yearsResult.data;
          setAvailableYears(years);
          const defaultYear = years[0];
          setSelectedYear(defaultYear);
          
          // Get months for default year
          const monthsResult = await analyticsApi.getAvailableMonths(defaultYear);
          if (monthsResult.success) {
            setAvailableMonths(monthsResult.data);
          }
          
          // Fetch initial data
          await fetchAllAnalyticsData(defaultYear, null);
        } else {
          setError('No data available');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Error loading initial data.');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array - only run once

  // Handle year change
  useEffect(() => {
    if (selectedYear) {
      // Get months for selected year
      const fetchMonths = async () => {
        const monthsResult = await analyticsApi.getAvailableMonths(selectedYear);
        if (monthsResult.success) {
          setAvailableMonths(monthsResult.data);
          // Reset month when year changes
          if (timeframeType === 'monthly') {
            setSelectedMonth('');
          }
        }
      };
      fetchMonths();
      
      // Fetch data based on timeframe type
      if (timeframeType === 'yearly') {
        fetchAllAnalyticsData(selectedYear, null);
      } else if (timeframeType === 'monthly' && selectedMonth) {
        fetchAllAnalyticsData(selectedYear, selectedMonth);
      }
    }
  }, [selectedYear]);

  // Handle month change (for monthly view)
  useEffect(() => {
    if (timeframeType === 'monthly' && selectedYear && selectedMonth) {
      fetchAllAnalyticsData(selectedYear, selectedMonth);
    }
  }, [selectedMonth]);

  // Handle timeframe type change
  const handleTimeframeTypeChange = (type) => {
    setTimeframeType(type);
    if (type === 'yearly') {
      setSelectedMonth('');
      if (selectedYear) {
        fetchAllAnalyticsData(selectedYear, null);
      }
    }
    // For monthly, wait for month selection
  };

  // Handle view mode change for top contributors
  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    const result = await analyticsApi.getTopContributors(
      mode, 
      selectedYear, 
      timeframeType === 'monthly' ? selectedMonth : null
    );
    if (result.success) {
      setTopContributors(result.data);
    }
  };

  // Helper function to get month name
  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || '';
  };

  if (loading && !selectedYear) {
    return (
      <div className="analytics">
        <div className="loading">Loading analytics data...</div>
      </div>
    );
  }

  const maxSubmissions = popularCategories.length > 0 
    ? Math.max(...popularCategories.map(cat => cat.submissions))
    : 1;

  return (
    <div className="analytics">
      <header className="analytics-header">
        <h1><FaUsers className="icon-user" /> Community Analytics</h1>
        <p>Monitor community contributions and engagement metrics</p>
      </header>

      {/* Timeline Controls Section - ADD THIS */}
      <div className="timeline-controls">
        <h2 className="timeline-title">
          <FaChartLine className="icon-chartLine" /> Analytics Timeline
        </h2>
        
        <div className="timeline-filters">
          <div className="filter-group">
            <label className="filter-label">View Type</label>
            <div className="timeframe-tabs">
              <button 
                className={`timeframe-tab ${timeframeType === 'yearly' ? 'active' : ''}`}
                onClick={() => handleTimeframeTypeChange('yearly')}
              >
                Yearly View
              </button>
              <button 
                className={`timeframe-tab ${timeframeType === 'monthly' ? 'active' : ''}`}
                onClick={() => handleTimeframeTypeChange('monthly')}
              >
                Monthly View
              </button>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="year-select"
              disabled={loading}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {timeframeType === 'monthly' && (
            <div className="filter-group">
              <label className="filter-label">Month</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-select"
                disabled={availableMonths.length === 0 || loading}
              >
                <option value="">Select Month</option>
                {availableMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="current-timeframe">
          <div className="timeframe-text">
            Currently viewing: <strong>
              {timeframeType === 'yearly' 
                ? `${selectedYear} (Yearly Overview)`
                : selectedMonth 
                  ? `${getMonthName(selectedMonth)} ${selectedYear}`
                  : `Select a month for ${selectedYear}`
              }
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading && selectedYear && (
        <div className="loading-indicator">
          Loading data for {selectedYear}{selectedMonth ? `, ${getMonthName(selectedMonth)}` : ''}...
        </div>
      )}

      <div className="analytics-dashboard">
        <div className="metrics-grid">
          {/* Total Recipes Card */}
          <div className="metric-card">
            <h3 className="metric-title">Total Recipes Shared <FaUtensils className="icon-utensils" /></h3>
            <div className="metric-value">{metrics.totalRecipes?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.percentages?.recipes !== undefined ? (
                <span className={metrics.percentages.recipes >= 0 ? 'positive' : 'negative'}>
                  {metrics.percentages.recipes >= 0 ? '+' : ''}{metrics.percentages.recipes}% from last month
                </span>
              ) : (
                'No data'
              )}
            </div>
          </div>

          {/* Total Stories Card */}
          <div className="metric-card">
            <h3 className="metric-title">Total Stories Shared <FaBook className="icon-book" /></h3>     
            <div className="metric-value">{metrics.totalStories?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.percentages?.stories !== undefined ? (
                <span className={metrics.percentages.stories >= 0 ? 'positive' : 'negative'}>
                  {metrics.percentages.stories >= 0 ? '+' : ''}{metrics.percentages.stories}% from last month
                </span>
              ) : (
                'No data'
              )}
            </div>
          </div>

          {/* Pending Recipes Card */}
          <div className="metric-card">
            <h3 className="metric-title">Recipe Pending Reviews<FaExclamationTriangle className="icon-alert" /></h3>
            <div className="metric-value">{metrics.pendingRecipes?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.pendingRecipes > 0 ? (
                <span className="attention-tag">
                  <FaExclamationTriangle className="tag-icon" />
                  Requires attention
                </span>
              ) : (
                <span className="all-caught-tag">
                  <BsCheckCircle className="tag-icon" />
                  All caught up!
                </span>
              )}
            </div>
          </div>

          {/* Pending Stories Card */}
          <div className="metric-card">
            <h3 className="metric-title">Stories Pending Reviews <FaExclamationTriangle className="icon-alert" /></h3>
            <div className="metric-value">{metrics.pendingStories?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.pendingStories > 0 ? (
                <span className="attention-tag">
                  <FaExclamationTriangle className="tag-icon" />
                  Requires attention
                </span>
              ) : (
                <span className="all-caught-tag">
                  <BsCheckCircle className="tag-icon" />
                  All caught up!
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="charts-section">
          <div className="charts-grid">
            {/* Pie Chart Card */}
            <div className="chart-card">
              <div className="pie-chart-container">
                <h3 className="chart-title">Food Submissions by Cultural Origin</h3>
                <PieChart data={culturalOriginData} />
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Monthly Community Contribution Trends</h3>
                <div className="year-filter">
                  <span className="filter-label">Data for:</span>
                  <div className="timeframe-display">
                    {timeframeType === 'yearly' 
                      ? `${selectedYear} (Yearly)`
                      : selectedMonth 
                        ? `${getMonthName(selectedMonth)} ${selectedYear}`
                        : `${selectedYear} (Select Month)`
                    }
                  </div>
                </div>
              </div>
              <BarChart data={barChartData} width={550} height={350} />
            </div>
          </div>

          {/* Additional Cards Section */}
          <div className="additional-cards-grid">
            {/* Popular Food Categories Card */}
            <div className="additional-card">
              <h3 className="additional-card-title"><FaFlag className="icon-flag" /> Popular Food Categories</h3>
              <div className="categories-list">
                {popularCategories.length > 0 ? (
                  popularCategories.map((category, index) => (
                    <div key={index} className={`category-item ${index === 0 ? 'category-main' : ''}`}>
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <span className="category-submissions">{category.submissions} submissions</span>
                      </div>
                      <div className="category-bar-container">
                        <div 
                          className="category-bar"
                          style={{ 
                            width: `${(category.submissions / maxSubmissions) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No category data available</div>
                )}
              </div>
            </div>

            {/* Top Contributors Card */}
            <div className="additional-card">
              <div className="card-header-with-toggle">
                <h3 className="additional-card-title">
                  <FaStar className="icon-star" /> Top 5 Contributors
                </h3>
                <div className="view-toggle">
                  <button 
                    className={`toggle-btn ${viewMode === 'recipes' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('recipes')}
                  >
                    Recipes
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'stories' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('stories')}
                  >
                    Stories
                  </button>
                </div>
              </div>
              
              <div className="contributors-list">
                {topContributors.length > 0 ? (
                  topContributors.map((contributor, index) => (
                    <div key={contributor.userProfileID || index} className="contributor-item">
                      <div className="contributor-rank">{index + 1}</div>
                      <div className="contributor-info">
                        <span className="contributor-name">
                          {`${contributor.firstname} ${contributor.lastname}`}
                        </span>
                      </div>
                      <div className="contributor-posts">
                        <span className="posts-count">
                          {viewMode === 'recipes' ? (contributor.recipes || 0) : (contributor.stories || 0)}
                        </span>
                        <span className="posts-label">
                          {viewMode === 'recipes' ? 'RECIPES' : 'STORIES'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-contributors">
                    No {viewMode} contributors found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;