// src/pages/Analytics.jsx
import React, { useState, useEffect } from "react";
import PieChart from "./charts/piechart";
import BarChart from "./charts/barchart";
import "../css/Analytics.css";
import { FaUtensils, FaBook, FaUsers, FaExclamationTriangle, FaStar, FaFlag, FaChartLine } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

export const analyticsApi = {
  // Get metrics data for cards
  getMetrics: async () => {
    try {
      const response = await fetch(`${API_URL}/admin/analytics/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      throw error;
    }
  },

  // Get posts and recipes by month for bar chart
  getPostsRecipesByMonth: async () => {
    try {
      const response =  await fetch(`${API_URL}/admin/analytics/posts-recipes-by-month`);
      return response.data;
    } catch (error) {
      console.error('Error fetching posts and recipes data:', error);
      throw error;
    }
  },

  // Get cultural origin data for pie chart
  getCulturalOrigin: async () => {
    try {
      const response =  await fetch(`${API_URL}/admin/analytics/cultural-origin`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cultural origin data:', error);
      throw error;
    }
  },

  // Get popular categories data
  getPopularCategories: async () => {
    try {
      const response = await fetch(`${API_URL}/admin/analytics/popular-categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular categories data:', error);
      throw error;
    }
  },

  // Get top contributors data
  getTopContributors: async () => {
    try {
      const response = await fetch(`${API_URL}/admin/analytics/top-contributors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top contributors data:', error);
      throw error;
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

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel for better performance
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

        if (metricsResponse.success) setMetrics(metricsResponse.data);
        if (barChartResponse.success) {
          setBarChartData(barChartResponse.data);
          setTotals(barChartResponse.totals);
        }
        if (culturalOriginResponse.success) setCulturalOriginData(culturalOriginResponse.data);
        if (popularCategoriesResponse.success) setPopularCategories(popularCategoriesResponse.data);
        if (topContributorsResponse.success) setTopContributors(topContributorsResponse.data);
        
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
        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <h3 className="metric-title">Total Recipes Shared <FaUtensils className="icon-utensils" /></h3>
            <div className="metric-value">1,247</div>
            <div className="metric-change positive">+12% This Month</div>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Total Stories Shared <FaBook className="icon-book" /></h3>     
            <div className="metric-value">892</div>
            <div className="metric-change positive">+8% This Month</div>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Recipe Pending Reviews<FaUsers className="icon-users" /></h3>
            <div className="metric-value">156</div>
            <div className="metric-change positive">Requires attention</div>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Stories Pending Reviews <FaExclamationTriangle className="icon-alert" /></h3>
            <div className="metric-value">23</div>
            <div className="metric-change attention">Requires attention</div>
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
              <BarChart width={500} height={350} />
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
              <h3 className="additional-card-title"><FaStar className="icon-star" /> Top Contributors</h3>
              <div className="contributors-list">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="contributor-item">
                    <div className="contributor-rank">{index + 1}</div>
                    <div className="contributor-info">
                      <span className="contributor-name">{contributor.name}</span>
                      <span className="contributor-stats">
                        {contributor.submissions} submissions • {contributor.recipes} recipes
                      </span>
                    </div>
                    <div className="contributor-posts">
                      <span className="posts-count">{contributor.submissions}</span>
                      <span className="posts-label">posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;