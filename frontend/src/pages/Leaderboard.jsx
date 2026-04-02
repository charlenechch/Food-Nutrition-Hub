import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/Leaderboard.css";
import { useTranslation } from "react-i18next";

const Leaderboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("recipes");
  const [leaderboardData, setLeaderboardData] = useState({
    recipes: [],
    posts: [],
    level: []
  });
  const [loading, setLoading] = useState(true);

  // Simplified dummy data - same structure for all tabs
  const dummyData = {
    recipes: [
      { id: 1, firstName: "Sarah", lastName: "Johnson", contributions: 156, avatar: "SJ", level: 0 },
      { id: 2, firstName: "Michael", lastName: "Chen", contributions: 142, avatar: "MC", level: 0 },
      { id: 3, firstName: "Emma", lastName: "Williams", contributions: 128, avatar: "EW", level: 0 },
      { id: 4, firstName: "David", lastName: "Brown", contributions: 115, avatar: "DB", level: 0 },
      { id: 5, firstName: "Lisa", lastName: "Anderson", contributions: 108, avatar: "LA", level: 0 },
      { id: 6, firstName: "James", lastName: "Taylor", contributions: 97, avatar: "JT", level: 0 },
      { id: 7, firstName: "Maria", lastName: "Garcia", contributions: 89, avatar: "MG", level: 0 },
      { id: 8, firstName: "Robert", lastName: "Wilson", contributions: 84, avatar: "RW", level: 0 },
      { id: 9, firstName: "Jennifer", lastName: "Lee", contributions: 78, avatar: "JL", level: 0 },
      { id: 10, firstName: "Thomas", lastName: "Martinez", contributions: 72, avatar: "TM", level: 0 },
      { id: 11, firstName: "Patricia", lastName: "Rodriguez", contributions: 68, avatar: "PR", level: 0 },
      { id: 12, firstName: "Christopher", lastName: "White", contributions: 63, avatar: "CW", level: 0 },
      { id: 13, firstName: "Jessica", lastName: "Davis", contributions: 59, avatar: "JD", level: 0 },
      { id: 14, firstName: "Daniel", lastName: "Miller", contributions: 54, avatar: "DM", level: 0 },
      { id: 15, firstName: "Nancy", lastName: "Wilson", contributions: 49, avatar: "NW", level: 0 },
      { id: 16, firstName: "Kevin", lastName: "Moore", contributions: 45, avatar: "KM", level: 0 },
      { id: 17, firstName: "Linda", lastName: "Taylor", contributions: 41, avatar: "LT", level: 0 },
      { id: 18, firstName: "Paul", lastName: "Anderson", contributions: 38, avatar: "PA", level: 0 },
      { id: 19, firstName: "Karen", lastName: "Thomas", contributions: 34, avatar: "KT", level: 0 },
      { id: 20, firstName: "Mark", lastName: "Jackson", contributions: 30, avatar: "MJ", level: 0 }
    ],
    posts: [
      { id: 1, firstName: "Emily", lastName: "Chen", contributions: 89, avatar: "EC", level: 0 },
      { id: 2, firstName: "Oliver", lastName: "Wang", contributions: 76, avatar: "OW", level: 0 },
      { id: 3, firstName: "Sophia", lastName: "Kim", contributions: 68, avatar: "SK", level: 0 },
      { id: 4, firstName: "Lucas", lastName: "Martinez", contributions: 62, avatar: "LM", level: 0 },
      { id: 5, firstName: "Isabella", lastName: "Garcia", contributions: 57, avatar: "IG", level: 0 },
      { id: 6, firstName: "Mason", lastName: "Rodriguez", contributions: 51, avatar: "MR", level: 0 },
      { id: 7, firstName: "Amelia", lastName: "Davis", contributions: 48, avatar: "AD", level: 0 },
      { id: 8, firstName: "Ethan", lastName: "Brown", contributions: 44, avatar: "EB", level: 0 },
      { id: 9, firstName: "Mia", lastName: "Wilson", contributions: 41, avatar: "MW", level: 0 },
      { id: 10, firstName: "Alexander", lastName: "Taylor", contributions: 38, avatar: "AT", level: 0 },
      { id: 11, firstName: "Charlotte", lastName: "Moore", contributions: 35, avatar: "CM", level: 0 },
      { id: 12, firstName: "Benjamin", lastName: "Johnson", contributions: 32, avatar: "BJ", level: 0 },
      { id: 13, firstName: "Harper", lastName: "Lee", contributions: 29, avatar: "HL", level: 0 },
      { id: 14, firstName: "William", lastName: "White", contributions: 27, avatar: "WW", level: 0 },
      { id: 15, firstName: "Evelyn", lastName: "Harris", contributions: 25, avatar: "EH", level: 0 },
      { id: 16, firstName: "James", lastName: "Clark", contributions: 23, avatar: "JC", level: 0 },
      { id: 17, firstName: "Abigail", lastName: "Lewis", contributions: 21, avatar: "AL", level: 0 },
      { id: 18, firstName: "Henry", lastName: "Walker", contributions: 19, avatar: "HW", level: 0 },
      { id: 19, firstName: "Grace", lastName: "Hall", contributions: 17, avatar: "GH", level: 0 },
      { id: 20, firstName: "Daniel", lastName: "Young", contributions: 15, avatar: "DY", level: 0 }
    ],
    level: [
      { id: 1, firstName: "Alex", lastName: "Thompson", xp: 12500, level: 25, avatar: "AT", contributions: 0 },
      { id: 2, firstName: "Rachel", lastName: "Green", xp: 11250, level: 23, avatar: "RG", contributions: 0 },
      { id: 3, firstName: "Monica", lastName: "Geller", xp: 10800, level: 22, avatar: "MG", contributions: 0 },
      { id: 4, firstName: "Chandler", lastName: "Bing", xp: 9500, level: 20, avatar: "CB", contributions: 0 },
      { id: 5, firstName: "Phoebe", lastName: "Buffay", xp: 8900, level: 19, avatar: "PB", contributions: 0 },
      { id: 6, firstName: "Ross", lastName: "Geller", xp: 8200, level: 18, avatar: "RG", contributions: 0 },
      { id: 7, firstName: "Joey", lastName: "Tribbiani", xp: 7800, level: 17, avatar: "JT", contributions: 0 },
      { id: 8, firstName: "Pam", lastName: "Beesly", xp: 7200, level: 16, avatar: "PB", contributions: 0 },
      { id: 9, firstName: "Jim", lastName: "Halpert", xp: 6800, level: 15, avatar: "JH", contributions: 0 },
      { id: 10, firstName: "Dwight", lastName: "Schrute", xp: 6500, level: 14, avatar: "DS", contributions: 0 },
      { id: 11, firstName: "Michael", lastName: "Scott", xp: 6100, level: 13, avatar: "MS", contributions: 0 },
      { id: 12, firstName: "Leslie", lastName: "Knope", xp: 5800, level: 12, avatar: "LK", contributions: 0 },
      { id: 13, firstName: "Ron", lastName: "Swanson", xp: 5500, level: 11, avatar: "RS", contributions: 0 },
      { id: 14, firstName: "April", lastName: "Ludgate", xp: 5200, level: 10, avatar: "AL", contributions: 0 },
      { id: 15, firstName: "Andy", lastName: "Dwyer", xp: 4900, level: 9, avatar: "AD", contributions: 0 },
      { id: 16, firstName: "Tom", lastName: "Haverford", xp: 4600, level: 8, avatar: "TH", contributions: 0 },
      { id: 17, firstName: "Donna", lastName: "Meagle", xp: 4300, level: 7, avatar: "DM", contributions: 0 },
      { id: 18, firstName: "Ben", lastName: "Wyatt", xp: 4000, level: 6, avatar: "BW", contributions: 0 },
      { id: 19, firstName: "Chris", lastName: "Traeger", xp: 3700, level: 5, avatar: "CT", contributions: 0 },
      { id: 20, firstName: "Ann", lastName: "Perkins", xp: 3400, level: 4, avatar: "AP", contributions: 0 }
    ]
  };

  useEffect(() => {
    setLeaderboardData(dummyData);
    setLoading(false);
  }, []);

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

  if (loading) {
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

        {getInfoText() && (
          <div className="info-banner">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">{getInfoText()}</span>
          </div>
        )}

        <div className="leaderboard-main">
          <div className="leaderboard-content">
            <div className="leaderboard-table-wrapper">
              <div className="leaderboard-table">
                <div className="table-header">
                  <div className="rank-col">{t("leaderboard.rank")}</div>
                  <div className="user-col">{t("leaderboard.user")}</div>
                  <div className="metric-col">{getMetricLabel()}</div>
                  {activeTab === "level" && <div className="level-col">{t("leaderboard.level")}</div>}
                </div>
                
                <div className="table-body">
                  {getCurrentData().map((user, index) => (
                    <div key={user.id} className={`table-row ${index < 3 ? "top-three" : ""}`}>
                      <div className="rank-col">
                        {index === 0 && <span className="rank-badge gold">🥇</span>}
                        {index === 1 && <span className="rank-badge silver">🥈</span>}
                        {index === 2 && <span className="rank-badge bronze">🥉</span>}
                        {index > 2 && <span className="rank-number">{index + 1}</span>}
                      </div>
                      <div className="user-col">
                        <div className="user-avatar">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={getFullName(user)} />
                          ) : (
                            <span>{user.avatar || (user.firstName ? user.firstName.charAt(0) : "?")}</span>
                          )}
                        </div>
                        <span className="user-name">{getFullName(user)}</span>
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
                  ))}
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Leaderboard;