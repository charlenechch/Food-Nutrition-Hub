import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/Leaderboard.css";
import { useTranslation } from "react-i18next";

const Leaderboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("recipes");
  const [leaderboardData, setLeaderboardData] = useState({
    recipes: [],
    posts: [],
    level: []
  });
  const [loading, setLoading] = useState(true);
  
  // Generate last 6 months for the dropdown
  const getLast6Months = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthValue = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      
      months.push({
        value: monthValue,
        label: `${monthName} ${year}`,
        year: date.getFullYear(),
        month: date.getMonth() + 1
      });
    }
    return months;
  };

  const recentMonths = getLast6Months();
  
  // Time filter state - default to current month
  const [selectedMonth, setSelectedMonth] = useState(recentMonths[0].value);

  // Fetch all 3 tabs whenever selected month changes (also runs on mount)
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const monthData = recentMonths.find(m => m.value === selectedMonth);

        if (!monthData) return;

        const [recipesRes, postsRes, levelRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/xp/leaderboard?type=recipe&year=${monthData.year}&month=${monthData.month}`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/api/xp/leaderboard?type=post&year=${monthData.year}&month=${monthData.month}`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/api/xp/leaderboard?type=level&year=${monthData.year}&month=${monthData.month}`, { credentials: "include" }),
        ]);

        const [recipesData, postsData, levelData] = await Promise.all([
          recipesRes.json(),
          postsRes.json(),
          levelRes.json(),
        ]);

        setLeaderboardData({
          recipes: recipesData.success ? recipesData.leaderboard : [],
          posts: postsData.success ? postsData.leaderboard : [],
          level: levelData.success ? levelData.leaderboard : [],
        });
      } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedMonth]);

  const getCurrentData = () => {
    switch(activeTab) {
      case "recipes":
        return leaderboardData.recipes;
      case "posts":
        return leaderboardData.posts;
      case "level":
        return leaderboardData.level;
      default:
        return [];
    }
  };

  const getFullName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || "Unknown User";
  };

  const getMetricLabel = () => {
    switch(activeTab) {
      case "recipes":
        return t("leaderboard.recipes");
      case "posts":
        return t("leaderboard.posts");
      case "level":
        return t("leaderboard.xp");
      default:
        return "";
    }
  };

  const getMetricValue = (item) => {
    switch(activeTab) {
      case "recipes":
        return item.contributions;
      case "posts":
        return item.contributions;
      case "level":
        return item.xp;
      default:
        return 0;
    }
  };

  const getInfoText = () => {
    switch(activeTab) {
      case "recipes":
        return t("leaderboard.top_recipe_contributors_info");
      case "posts":
        return t("leaderboard.top_posts_contributors_info");
      case "level":
        return null;
      default:
        return null;
    }
  };

  const getRewardsData = () => {
    switch(activeTab) {
      case "recipes":
        return {
          title: t("leaderboard.recipe_contributor_rewards_title"),
          rewards: [
            { rank: t("leaderboard.1st_place"), points: "200 XP", description: t("leaderboard.top_recipe_contributor") },
            { rank: t("leaderboard.2nd_place"), points: "150 XP", description: t("leaderboard.second_best_recipe_contributor") },
            { rank: t("leaderboard.3rd_place"), points: "100 XP", description: t("leaderboard.third_best_recipe_contributor") }
          ]
        };
      case "posts":
        return {
          title: t("leaderboard.community_post_rewards_title"),
          rewards: [
            { rank: t("leaderboard.1st_place"), points: "100 XP", description: t("leaderboard.top_community_poster") },
            { rank: t("leaderboard.2nd_place"), points: "50 XP", description: t("leaderboard.second_best_community_poster") },
            { rank: t("leaderboard.3rd_place"), points: "25 XP", description: t("leaderboard.third_best_community_poster") }
          ]
        };
      case "level":
        return null;
      default:
        return null;
    }
  };

  const getSelectedMonthLabel = () => {
    const monthData = recentMonths.find(m => m.value === selectedMonth);
    return monthData ? monthData.label : "";
  };

  if (loading && getCurrentData().length === 0) {
    return (
      <>
        <Header />
        <div className="leaderboard-container">
          <div className="loading-spinner">{t("leaderboard.loading_leaderboard")}</div>
        </div>
        <Footer />
      </>
    );
  }

  const rewards = getRewardsData();

  return (
  <>
    <Header />
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>{t("leaderboard.community_leaderboard")}</h1>
        <p>{t("leaderboard.celebrating_top_contributors")}</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "recipes" ? "active" : ""}`}
          onClick={() => setActiveTab("recipes")}
        >
          🍳 {t("leaderboard.top_recipe_contributors")}
        </button>
        <button
          className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          💬 {t("leaderboard.top_community_posters")}
        </button>
        <button
          className={`tab-btn ${activeTab === "level" ? "active" : ""}`}
          onClick={() => setActiveTab("level")}
        >
          ⭐ {t("leaderboard.level_leaders")}
        </button>
      </div>

      <div className="time-filter-row">
        <div className="time-filter-section">
          <div className="filter-label">
            <span>{t("leaderboard.time_period")}:</span>
          </div>
          <select 
            className="month-filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {recentMonths.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <div className="filter-badge">
            <span className="badge-text">
              {t("leaderboard.showing")}: {getSelectedMonthLabel()}
            </span>
          </div>
        </div>
      </div>

      {getInfoText() && (
        <div className="info-banner">
          <span className="info-icon">ℹ️</span>
          <span className="info-text">{getInfoText()}</span>
        </div>
      )}

      <div className="leaderboard-main">
        <div className="leaderboard-content">
          <div className="leaderboard-table-wrapper">
            <div className={`leaderboard-table ${activeTab === "level" ? "level-mode" : "normal-mode"}`}>
              <div className="table-header">
                <div className="rank-col">{t("leaderboard.rank")}</div>
                <div className="user-col">{t("leaderboard.user")}</div>
                <div className="metric-col">{getMetricLabel()}</div>
                {activeTab === "level" && <div className="level-col">{t("leaderboard.level")}</div>}
              </div>
              
              <div className="table-body">
                {getCurrentData().length === 0 ? (
                  <div className="empty-state">
                    <p>{t("leaderboard.no_data_for_period")}</p>
                  </div>
                ) : (
                  getCurrentData().map((user, index) => (
                    <div key={user.id} className={`table-row ${index < 3 ? "top-three" : ""}`}>
                      <div className="rank-col">
                        {index === 0 && <span className="rank-badge gold">🥇</span>}
                        {index === 1 && <span className="rank-badge silver">🥈</span>}
                        {index === 2 && <span className="rank-badge bronze">🥉</span>}
                        {index > 2 && <span className="rank-number">{index + 1}</span>}
                      </div>
                      <div className="user-col">
                        <div
                          className="user-avatar"
                          onClick={() => {
                            if (authUser && String(authUser.userProfileID) === String(user.id)) navigate("/profile");
                            else navigate(`/profile/${user.id}`);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={getFullName(user)} />
                          ) : (
                            <span>{user.firstName ? user.firstName.charAt(0) : "?"}</span>
                          )}
                        </div>
                        <span
                          className="user-name"
                          onClick={() => {
                            if (authUser && String(authUser.userProfileID) === String(user.id)) navigate("/profile");
                            else navigate(`/profile/${user.id}`);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {getFullName(user)}
                        </span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-value">{getMetricValue(user).toLocaleString()}</span>
                      </div>
                      {activeTab === "level" && (
                        <div className="level-col">
                          <span className="level-number">Lv.{user.level}</span>
                          <div className="xp-progress">
                            <div 
                              className="xp-progress-fill" 
                              style={{ width: `${(user.xp % 500) / 5}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {rewards && (
          <div className="rewards-sticky-note">
            <div className="sticky-note-header">
              <span className="sticky-note-icon">📝</span>
              <h3>{rewards.title}</h3>
            </div>
            <div className="sticky-note-content">
              <p className="reward-intro">{t("leaderboard.reward_alert")}</p>
              <div className="rewards-list">
                {rewards.rewards.map((reward, idx) => (
                  <div key={idx} className="reward-item">
                    <div className="reward-rank">{reward.rank}</div>
                    <div className="reward-points">{reward.points}</div>
                    <div className="reward-desc">{reward.description}</div>
                  </div>
                ))}
              </div>
              <div className="reward-footer">
                <span>{t("leaderboard.xp_awarded_automatically")}</span>
                <p className="reward-disclaimer">{t("leaderboard.approval_disclaimer")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <Footer />
  </>
);
}

export default Leaderboard;