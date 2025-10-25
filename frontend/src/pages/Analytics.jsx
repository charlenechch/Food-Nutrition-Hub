// src/pages/Analytics.jsx
import React from "react";
import PieChart from "./charts/piechart";
import BarChart from "./charts/barchart";
import "../css/Analytics.css";
import { FaUtensils, FaBook, FaUsers, FaExclamationTriangle, FaStar, FaFlag, FaChartLine } from "react-icons/fa";

const Analytics = () => {
  const culturalOriginData = [
    { name: 'Iban', value: 35 },
    { name: 'Dayak', value: 28 },
    { name: 'Bidayuh', value: 15 },
    { name: 'Malanau', value: 22 }
  ];

  const popularCategories = [
    { name: 'Traditional Dishes', submissions: 324 },
    { name: 'Snacks & Appetizers', submissions: 287 },
    { name: 'Beverages', submissions: 198 },
    { name: 'Desserts', submissions: 156 },
    { name: 'Ingredients', submissions: 134 },
    { name: 'Preserved Foods', submissions: 148 }
  ];

  const topContributors = [
    { name: 'Sarah Lim', submissions: 47, recipes: 23 },
    { name: 'Ahmad Rahman', submissions: 39, recipes: 18 },
    { name: 'Maria Anak', submissions: 35, recipes: 21 },
    { name: 'Chen Wei Ming', submissions: 32, recipes: 15 },
    { name: 'Siti Aminah', submissions: 28, recipes: 19 }
  ];

  // Calculate max submissions for percentage bars
  const maxSubmissions = Math.max(...popularCategories.map(cat => cat.submissions));

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
            <h3 className="metric-title">Total Food Submissions <FaUtensils className="icon-utensils" /></h3>
            <div className="metric-value">1,247</div>
            <div className="metric-change positive">+12% This Month</div>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Recipes Shared <FaBook className="icon-book" /></h3>     
            <div className="metric-value">892</div>
            <div className="metric-change positive">+8% This Month</div>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Active Contributors<FaUsers className="icon-users" /></h3>
            <div className="metric-value">156</div>
            <div className="metric-change positive">+15% This Month</div>
          </div>

          <div className="metric-card">
            <h3 className="metric-title">Pending Reviews <FaExclamationTriangle className="icon-alert" /></h3>
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