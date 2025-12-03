// src/pages/Analytics.jsx
import React, { useState, useEffect } from "react";
import PieChart from "./charts/piechart";
import BarChart from "./charts/barchart";
import "../css/Analytics.css";
import { FaUtensils, FaBook, FaUsers, FaExclamationTriangle, FaStar, FaFlag, FaChartLine } from "react-icons/fa";
import { BsCheckCircle } from "react-icons/bs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// src/pages/Analytics.jsx
export const analyticsApi = {
  // Get metrics data for cards
  getMetrics: async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/metrics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      return { success: false, error: error.message };
    }
  },

  getPostsRecipesByMonth: async (year = new Date().getFullYear()) => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/posts-recipes-by-month?year=${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching posts and recipes data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get cultural origin data for pie chart
  getCulturalOrigin: async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/cultural-origin`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching cultural origin data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get popular categories data
  getPopularCategories: async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/popular-categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching popular categories data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get top contributors data - UPDATED to use separate endpoints
  getTopContributors: async (view = 'recipes') => {
    try {
      console.log(`🔄 Fetching top contributors for: ${view}`);
      
      // Use separate endpoints to avoid HPP 'view' parameter issue
      const endpoint = view === 'recipes' ? 'top-contributors-recipes' : 'top-contributors-stories';
      const response = await fetch(`${API_URL}/api/analytics/${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching top contributors data:', error);
      return { success: false, error: error.message };
    }
  },

  // Get available years
  getAvailableYears: async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/available-years`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching available years:', error);
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
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);

  // ADD MISSING FUNCTION: Fetch top contributors
  const fetchTopContributors = async (view = 'recipes') => {
    try {
      const result = await analyticsApi.getTopContributors(view);
      if (result.success) {
        setTopContributors(result.data);
      } else {
        console.error('Error fetching top contributors:', result.error);
        setTopContributors([]);
      }
    } catch (error) {
      console.error('Error fetching top contributors:', error);
      setTopContributors([]);
    }
  };

  const fetchBarChartData = async (year) => {
    try {
      console.log(`🔄 Fetching bar chart data for year: ${year}`);
      const result = await analyticsApi.getPostsRecipesByMonth(year);
      console.log(`📊 API Response for ${year}:`, result);
      
      if (result.success) {
        console.log(`✅ Bar chart data loaded for ${year}:`, result.data);
        console.log(`📈 Totals for ${year}:`, result.totals);
        setBarChartData(result.data);
        setTotals(result.totals || {});
      } else {
        console.error(`❌ Error in bar chart data for ${year}:`, result.error);
        setBarChartData([]);
        setTotals({});
      }
    } catch (error) {
      console.error(`❌ Error fetching chart data for ${year}:`, error);
      setBarChartData([]);
      setTotals({});
    }
  };

  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const result = await analyticsApi.getAvailableYears();
        
        if (result.success) {
          setAvailableYears(result.data);
          // Set default to latest year
          if (result.data.length > 0) {
            setSelectedYear(result.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };

    fetchAvailableYears();
  }, []);

  // Update barChartData based on selectedYear - FIXED
  useEffect(() => {
    if (selectedYear) {
      fetchBarChartData(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get years first to set selectedYear
        const yearsResult = await analyticsApi.getAvailableYears();
        if (yearsResult.success && yearsResult.data.length > 0) {
          setAvailableYears(yearsResult.data);
          const defaultYear = yearsResult.data[0];
          setSelectedYear(defaultYear);
          
          // Fetch initial bar chart data with default year
          const barChartResult = await analyticsApi.getPostsRecipesByMonth(defaultYear);
          if (barChartResult.success) {
            setBarChartData(barChartResult.data);
            setTotals(barChartResult.totals || {});
          }
        }

        const [
          metricsResponse,
          culturalOriginResponse,
          popularCategoriesResponse,
          topContributorsResponse
        ] = await Promise.all([
          analyticsApi.getMetrics(),
          analyticsApi.getCulturalOrigin(),
          analyticsApi.getPopularCategories(),
          analyticsApi.getTopContributors('recipes') // Set initial view to recipes
        ]);

        console.log('📊 Analytics Responses:', {
          metrics: metricsResponse,
          culturalOrigin: culturalOriginResponse,
          popularCategories: popularCategoriesResponse,
          topContributors: topContributorsResponse
        });

        // ✅ Safe checking with default values
        if (metricsResponse?.success) setMetrics(metricsResponse.data || {});
        if (culturalOriginResponse?.success) setCulturalOriginData(culturalOriginResponse.data || []);
        if (popularCategoriesResponse?.success) setPopularCategories(popularCategoriesResponse.data || []);
        if (topContributorsResponse?.success) setTopContributors(topContributorsResponse.data || []);
        
        // Check if any API call failed
        const failedRequests = [
          metricsResponse, culturalOriginResponse, 
          popularCategoriesResponse, topContributorsResponse
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

    fetchAnalyticsData();
  }, []);

  // Calculate max submissions for percentage bars
  const maxSubmissions = popularCategories.length > 0 
    ? Math.max(...popularCategories.map(cat => cat.submissions))
    : 1;

  if (loading) {
    return (
      <div className="analytics">
        <div className="loading">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <header className="analytics-header">
        <h1><FaUsers className="icon-user" /> Community Analytics</h1>
        <p>Monitor community contributions and engagement metrics</p>
      </header>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <h2><FaChartLine className="icon-chartLine" /> Community Contributions</h2>
      <br></br>

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
                'Loading...'
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
                'Loading...'
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
                  <span className="filter-label">Year:</span>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="year-select"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
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
                {popularCategories.map((category, index) => (
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
                ))}
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
                    onClick={() => {
                      setViewMode('recipes');
                      fetchTopContributors('recipes');
                    }}
                  >
                    Recipes
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'stories' ? 'active' : ''}`}
                    onClick={() => {
                      setViewMode('stories');
                      fetchTopContributors('stories');
                    }}
                  >
                    Stories
                  </button>
                </div>
              </div>
              
              <div className="contributors-list">
                {topContributors && topContributors.length > 0 ? (
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