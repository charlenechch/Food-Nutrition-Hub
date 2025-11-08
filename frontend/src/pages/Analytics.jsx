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

  // Get posts and recipes by month for bar chart
  getPostsRecipesByMonth: async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/posts-recipes-by-month`);
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

  // Get top contributors data
  getTopContributors: async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/top-contributors`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching top contributors data:', error);
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

  useEffect(() => {
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        metricsResponse,
        barChartResponse,
        culturalOriginResponse,
        popularCategoriesResponse,
        topContributorsResponse
      ] = await Promise.all([
        analyticsApi.getMetrics(),
        analyticsApi.getPostsRecipesByMonth(),
        analyticsApi.getCulturalOrigin(),
        analyticsApi.getPopularCategories(),
        analyticsApi.getTopContributors()
      ]);

      console.log('📊 Analytics Responses:', {
        metrics: metricsResponse,
        barChart: barChartResponse,
        culturalOrigin: culturalOriginResponse,
        popularCategories: popularCategoriesResponse,
        topContributors: topContributorsResponse
      });

      // ✅ Safe checking with default values
      if (metricsResponse?.success) setMetrics(metricsResponse.data || {});
      if (barChartResponse?.success) setBarChartData(barChartResponse.data || []);
      if (culturalOriginResponse?.success) setCulturalOriginData(culturalOriginResponse.data || []);
      if (popularCategoriesResponse?.success) setPopularCategories(popularCategoriesResponse.data || []);
      if (topContributorsResponse?.success) setTopContributors(topContributorsResponse.data || []);
      
      // Check if any API call failed
      const failedRequests = [
        metricsResponse, barChartResponse, culturalOriginResponse, 
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
  const maxSubmissions = Math.max(...popularCategories.map(cat => cat.submissions));

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

      <h2><FaChartLine className="icon-chartLine" /> Community Contributions</h2>
      <br></br>

      <div className="analytics-dashboard">
        <div className="metrics-grid">
        {/* Total Recipes Card */}
        <div className="metric-card">
          <h3 className="metric-title">Total Recipes Shared <FaUtensils className="icon-utensils" /></h3>
          <div className="metric-value">{metrics.totalRecipes?.toLocaleString() || '0'}</div>
          <div className={`metric-change ${metrics.recentRecipes >= 0 ? 'positive' : 'negative'}`}>
            {metrics.recentRecipes !== undefined ? (
              <>
                {metrics.recentRecipes >= 0 ? '+' : ''}{metrics.recentRecipes} This Month
                {metrics.recentRecipes < 0 && <span className="change-indicator">↓</span>}
              </>
            ) : (
              'Loading...'
            )}
          </div>
        </div>

        {/* Total Stories Card */}
        <div className="metric-card">
          <h3 className="metric-title">Total Stories Shared <FaBook className="icon-book" /></h3>     
          <div className="metric-value">{metrics.totalStories?.toLocaleString() || '0'}</div>
          <div className={`metric-change ${metrics.recentPosts >= 0 ? 'positive' : 'negative'}`}>
            {metrics.recentPosts !== undefined ? (
              <>
                {metrics.recentPosts >= 0 ? '+' : ''}{metrics.recentPosts} This Month
                {metrics.recentPosts < 0 && <span className="change-indicator">↓</span>}
              </>
            ) : (
              'Loading...'
            )}
          </div>
        </div>

        {/* Pending Recipes Card */}
        <div 
          className="metric-card clickable"
          onClick={() => navigate('/admin/pending-recipes')}
          style={{cursor: 'pointer'}}
        >
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
        <div 
          className="metric-card clickable"
          onClick={() => navigate('/admin/pending-stories')}
          style={{cursor: 'pointer'}}
        >
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
                <PieChart data={culturalOriginData} width={500} height={350} />
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="chart-card">
              <h3 className="chart-title">Monthly Community Contribution Trends</h3>
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
                    onClick={() => setViewMode('recipes')}
                  >
                    Recipes
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'stories' ? 'active' : ''}`}
                    onClick={() => setViewMode('stories')}
                  >
                    Stories
                  </button>
                </div>
              </div>
              
              <div className="contributors-list">
                {topContributors
                  .filter(contributor => viewMode === 'recipes' ? contributor.recipes > 0 : contributor.stories > 0)
                  .slice(0, 5)
                  .map((contributor, index) => (
                    <div key={index} className="contributor-item">
                      <div className="contributor-rank">{index + 1}</div>
                      <div className="contributor-info">
                        <span className="contributor-name">{contributor.name || contributor.username || `${contributor.firstname} ${contributor.lastname}` || 'Unknown User'}</span>
                      </div>
                      <div className="contributor-posts">
                        <span className="posts-count">
                          {viewMode === 'recipes' ? contributor.recipes : contributor.stories}
                        </span>
                        <span className="posts-label">
                          {viewMode === 'recipes' ? 'recipes' : 'stories'}
                        </span>
                      </div>
                    </div>
                  ))
                }
                {topContributors.filter(contributor => viewMode === 'recipes' ? contributor.recipes > 0 : contributor.stories > 0).length === 0 && (
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