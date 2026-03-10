// src/pages/Analytics.jsx
import React, { useState, useEffect } from "react";
import PieChart from "./charts/piechart";
import BarChart from "./charts/barchart";
import "../css/Analytics.css";
import { useTranslation } from "react-i18next";
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

      console.log('🔍 Fetching from:', url);
      
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
  const { t } = useTranslation();
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
        setError(t("analytics.someDataFailed", { count: failedRequests.length }));
      }
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(t("analytics.errorLoadingAnalytics"));
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
          setError(t("analytics.noDataAvailable"));
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError(t("analytics.errorLoadingInitial"));
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
        <div className="loading">{t("analytics.loadingAnalytics")}</div>
      </div>
    );
  }

  const maxSubmissions = popularCategories.length > 0 
    ? Math.max(...popularCategories.map(cat => cat.submissions))
    : 1;

  return (
    <div className="analytics">
      <header className="analytics-header">
        <h1><FaUsers className="icon-user" /> {t("analytics.communityAnalytics")}</h1>
        <p>{t("analytics.monitorMetrics")}</p>
      </header>

      {/* Timeline Controls Section */}
      <div className="timeline-controls">
        <h2 className="timeline-title">
          <FaChartLine className="icon-chartLine" /> {t("analytics.analyticsTimeline")}
        </h2>
        
        <div className="timeline-filters">
          <div className="filter-group">
            <label className="filter-label">{t("analytics.viewType")}</label>
            <div className="timeframe-tabs">
              <button 
                className={`timeframe-tab ${timeframeType === 'yearly' ? 'active' : ''}`}
                onClick={() => handleTimeframeTypeChange('yearly')}
              >
                {t("analytics.yearlyView")}
              </button>
              <button 
                className={`timeframe-tab ${timeframeType === 'monthly' ? 'active' : ''}`}
                onClick={() => handleTimeframeTypeChange('monthly')}
              >
                {t("analytics.monthlyView")}
              </button>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">{t("analytics.year")}</label>
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
              <label className="filter-label">{t("analytics.month")}</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-select"
                disabled={availableMonths.length === 0 || loading}
              >
                <option value="">{t("analytics.selectMonth")}</option>
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
            {t("analytics.currentlyViewing")} <strong>
              {timeframeType === 'yearly' 
                ? t("analytics.yearlyOverview", { year: selectedYear })
                : selectedMonth 
                  ? t("analytics.monthYear", { month: getMonthName(selectedMonth), year: selectedYear })
                  : t("analytics.selectMonthFor", { year: selectedYear })
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
          {t("analytics.loadingData")} {selectedYear}{selectedMonth ? `, ${getMonthName(selectedMonth)}` : ''}...
        </div>
      )}

      <div className="analytics-dashboard">
        <div className="metrics-grid">
          {/* Total Recipes Card */}
          <div className="metric-card">
            <h3 className="metric-title">{t("analytics.totalRecipesShared")} <FaUtensils className="icon-utensils" /></h3>
            <div className="metric-value">{metrics.totalRecipes?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.percentages?.recipes !== undefined ? (
                <span className={metrics.percentages.recipes >= 0 ? 'positive' : 'negative'}>
                  {metrics.percentages.recipes >= 0 ? '+' : ''}{metrics.percentages.recipes}{t("analytics.fromLastMonth")}
                </span>
              ) : (
                t("analytics.noData")
              )}
            </div>
          </div>

          {/* Total Stories Card */}
          <div className="metric-card">
            <h3 className="metric-title">{t("analytics.totalStoriesShared")} <FaBook className="icon-book" /></h3>     
            <div className="metric-value">{metrics.totalStories?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.percentages?.stories !== undefined ? (
                <span className={metrics.percentages.stories >= 0 ? 'positive' : 'negative'}>
                  {metrics.percentages.stories >= 0 ? '+' : ''}{metrics.percentages.stories}{t("analytics.fromLastMonth")}
                </span>
              ) : (
                t("analytics.noData")
              )}
            </div>
          </div>

          {/* Pending Recipes Card */}
          <div className="metric-card">
            <h3 className="metric-title">{t("analytics.recipePendingReviews")}<FaExclamationTriangle className="icon-alert" /></h3>
            <div className="metric-value">{metrics.pendingRecipes?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.pendingRecipes > 0 ? (
                <span className="attention-tag">
                  <FaExclamationTriangle className="tag-icon" />
                  {t("analytics.requiresAttention")}
                </span>
              ) : (
                <span className="all-caught-tag">
                  <BsCheckCircle className="tag-icon" />
                  {t("analytics.allCaughtUp")}
                </span>
              )}
            </div>
          </div>

          {/* Pending Stories Card */}
          <div className="metric-card">
            <h3 className="metric-title">{t("analytics.storiesPendingReviews")} <FaExclamationTriangle className="icon-alert" /></h3>
            <div className="metric-value">{metrics.pendingStories?.toLocaleString() || '0'}</div>
            <div className="metric-change">
              {metrics.pendingStories > 0 ? (
                <span className="attention-tag">
                  <FaExclamationTriangle className="tag-icon" />
                  {t("analytics.requiresAttention")}
                </span>
              ) : (
                <span className="all-caught-tag">
                  <BsCheckCircle className="tag-icon" />
                  {t("analytics.allCaughtUp")}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="charts-section">
          <div className="charts-grid">
            {/* Pie Chart Card */}
            <div className="chart-card">
              <div className="pie-chart-card">
                <h3 className="chart-title">{t("analytics.foodSubmissionsByCulturalOrigin")}</h3>
                <PieChart data={culturalOriginData} />
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">{t("analytics.monthlyCommunityContributionTrends")}</h3>
              </div>
              <BarChart data={barChartData} width={550} height={350} />
            </div>
          </div>

          {/* Additional Cards Section */}
          <div className="additional-cards-grid">
            {/* Popular Food Categories Card */}
            <div className="additional-card">
              <h3 className="additional-card-title"><FaFlag className="icon-flag" /> {t("analytics.popularFoodCategories")}</h3>
              <div className="categories-list">
                {popularCategories.length > 0 ? (
                  popularCategories.map((category, index) => (
                    <div key={index} className={`category-item ${index === 0 ? 'category-main' : ''}`}>
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <span className="category-submissions">{category.submissions} {t("analytics.submissions")}</span>
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
                  <div className="no-data">{t("analytics.noCategoryData")}</div>
                )}
              </div>
            </div>

            {/* Top Contributors Card */}
            <div className="additional-card">
              <div className="card-header-with-toggle">
                <h3 className="additional-card-title">
                  <FaStar className="icon-star" /> {t("analytics.top5Contributors")}
                </h3>
                <div className="view-toggle">
                  <button 
                    className={`toggle-btn ${viewMode === 'recipes' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('recipes')}
                  >
                    {t("analytics.recipes")}
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'stories' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('stories')}
                  >
                    {t("analytics.stories")}
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
                          {viewMode === 'recipes' ? t("analytics.recipes_label") : t("analytics.stories_label")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-contributors">
                    {t("analytics.noContributorsFound", { viewMode })}
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