import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/Leaderboard.css";

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("recipes");
  const [leaderboardData, setLeaderboardData] = useState({
    recipes: [],
    posts: [],
    level: []
  });
  const [loading, setLoading] = useState(true);

  // Dummy data without badge property
  const dummyData = {
    recipes: [
      { id: 1, name: "Sarah Johnson", contributions: 156, avatar: "SJ" },
      { id: 2, name: "Michael Chen", contributions: 142, avatar: "MC" },
      { id: 3, name: "Emma Williams", contributions: 128, avatar: "EW" },
      { id: 4, name: "David Brown", contributions: 115, avatar: "DB" },
      { id: 5, name: "Lisa Anderson", contributions: 108, avatar: "LA" },
      { id: 6, name: "James Taylor", contributions: 97, avatar: "JT" },
      { id: 7, name: "Maria Garcia", contributions: 89, avatar: "MG" },
      { id: 8, name: "Robert Wilson", contributions: 84, avatar: "RW" },
      { id: 9, name: "Jennifer Lee", contributions: 78, avatar: "JL" },
      { id: 10, name: "Thomas Martinez", contributions: 72, avatar: "TM" },
      { id: 11, name: "Patricia Rodriguez", contributions: 68, avatar: "PR" },
      { id: 12, name: "Christopher White", contributions: 63, avatar: "CW" },
      { id: 13, name: "Jessica Davis", contributions: 59, avatar: "JD" },
      { id: 14, name: "Daniel Miller", contributions: 54, avatar: "DM" },
      { id: 15, name: "Nancy Wilson", contributions: 49, avatar: "NW" },
      { id: 16, name: "Kevin Moore", contributions: 45, avatar: "KM" },
      { id: 17, name: "Linda Taylor", contributions: 41, avatar: "LT" },
      { id: 18, name: "Paul Anderson", contributions: 38, avatar: "PA" },
      { id: 19, name: "Karen Thomas", contributions: 34, avatar: "KT" },
      { id: 20, name: "Mark Jackson", contributions: 30, avatar: "MJ" }
    ],
    posts: [
      { id: 1, name: "Emily Chen", contributions: 89, avatar: "EC" },
      { id: 2, name: "Oliver Wang", contributions: 76, avatar: "OW" },
      { id: 3, name: "Sophia Kim", contributions: 68, avatar: "SK" },
      { id: 4, name: "Lucas Martinez", contributions: 62, avatar: "LM" },
      { id: 5, name: "Isabella Garcia", contributions: 57, avatar: "IG" },
      { id: 6, name: "Mason Rodriguez", contributions: 51, avatar: "MR" },
      { id: 7, name: "Amelia Davis", contributions: 48, avatar: "AD" },
      { id: 8, name: "Ethan Brown", contributions: 44, avatar: "EB" },
      { id: 9, name: "Mia Wilson", contributions: 41, avatar: "MW" },
      { id: 10, name: "Alexander Taylor", contributions: 38, avatar: "AT" },
      { id: 11, name: "Charlotte Moore", contributions: 35, avatar: "CM" },
      { id: 12, name: "Benjamin Johnson", contributions: 32, avatar: "BJ" },
      { id: 13, name: "Harper Lee", contributions: 29, avatar: "HL" },
      { id: 14, name: "William White", contributions: 27, avatar: "WW" },
      { id: 15, name: "Evelyn Harris", contributions: 25, avatar: "EH" },
      { id: 16, name: "James Clark", contributions: 23, avatar: "JC" },
      { id: 17, name: "Abigail Lewis", contributions: 21, avatar: "AL" },
      { id: 18, name: "Henry Walker", contributions: 19, avatar: "HW" },
      { id: 19, name: "Grace Hall", contributions: 17, avatar: "GH" },
      { id: 20, name: "Daniel Young", contributions: 15, avatar: "DY" }
    ],
    level: [
      { id: 1, name: "Alex Thompson", xp: 12500, level: 25, avatar: "AT" },
      { id: 2, name: "Rachel Green", xp: 11250, level: 23, avatar: "RG" },
      { id: 3, name: "Monica Geller", xp: 10800, level: 22, avatar: "MG" },
      { id: 4, name: "Chandler Bing", xp: 9500, level: 20, avatar: "CB" },
      { id: 5, name: "Phoebe Buffay", xp: 8900, level: 19, avatar: "PB" },
      { id: 6, name: "Ross Geller", xp: 8200, level: 18, avatar: "RG" },
      { id: 7, name: "Joey Tribbiani", xp: 7800, level: 17, avatar: "JT" },
      { id: 8, name: "Pam Beesly", xp: 7200, level: 16, avatar: "PB" },
      { id: 9, name: "Jim Halpert", xp: 6800, level: 15, avatar: "JH" },
      { id: 10, name: "Dwight Schrute", xp: 6500, level: 14, avatar: "DS" },
      { id: 11, name: "Michael Scott", xp: 6100, level: 13, avatar: "MS" },
      { id: 12, name: "Leslie Knope", xp: 5800, level: 12, avatar: "LK" },
      { id: 13, name: "Ron Swanson", xp: 5500, level: 11, avatar: "RS" },
      { id: 14, name: "April Ludgate", xp: 5200, level: 10, avatar: "AL" },
      { id: 15, name: "Andy Dwyer", xp: 4900, level: 9, avatar: "AD" },
      { id: 16, name: "Tom Haverford", xp: 4600, level: 8, avatar: "TH" },
      { id: 17, name: "Donna Meagle", xp: 4300, level: 7, avatar: "DM" },
      { id: 18, name: "Ben Wyatt", xp: 4000, level: 6, avatar: "BW" },
      { id: 19, name: "Chris Traeger", xp: 3700, level: 5, avatar: "CT" },
      { id: 20, name: "Ann Perkins", xp: 3400, level: 4, avatar: "AP" }
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

  const getMetricLabel = () => {
    switch(activeTab) {
      case "recipes":
        return "Recipes";
      case "posts":
        return "Posts";
      case "level":
        return "XP";
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
        return "🏆 Top Recipe Contributors for this month • Refreshes monthly";
      case "posts":
        return "💬 Top Community Post Contributors for this month • Refreshes monthly";
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
          title: "🏆 Recipe Contributor Rewards",
          rewards: [
            { rank: "1st Place", points: "200 XP", description: "Top Recipe Contributor" },
            { rank: "2nd Place", points: "150 XP", description: "Second Best Recipe Contributor" },
            { rank: "3rd Place", points: "100 XP", description: "Third Best Recipe Contributor" }
          ]
        };
      case "posts":
        return {
          title: "💬 Community Post Rewards",
          rewards: [
            { rank: "1st Place", points: "100 XP", description: "Top Community Poster" },
            { rank: "2nd Place", points: "50 XP", description: "Second Best Community Poster" },
            { rank: "3rd Place", points: "25 XP", description: "Third Best Community Poster" }
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
          <div className="loading-spinner">Loading leaderboard...</div>
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
          <h1>Community Leaderboard</h1>
          <p>Celebrating our top contributors!</p>
        </div>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "recipes" ? "active" : ""}`}
            onClick={() => setActiveTab("recipes")}
          >
            🍳 Top Recipe Contributors
          </button>
          <button
            className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            💬 Top Community Posters
          </button>
          <button
            className={`tab-btn ${activeTab === "level" ? "active" : ""}`}
            onClick={() => setActiveTab("level")}
          >
            ⭐ Level Leaders
          </button>
        </div>

        {/* Info text for recipe and post tabs */}
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
                  <div className="rank-col">RANK</div>
                  <div className="user-col">USER</div>
                  <div className="metric-col">{getMetricLabel()}</div>
                  {activeTab === "level" && <div className="level-col">LEVEL</div>}
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
                          {user.avatar}
                        </div>
                        <span className="user-name">{user.name}</span>
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

          {/* Sticky Note for Rewards */}
          {rewards && (
            <div className="rewards-sticky-note">
              <div className="sticky-note-header">
                <span className="sticky-note-icon">📝</span>
                <h3>{rewards.title}</h3>
              </div>
              <div className="sticky-note-content">
                <p className="reward-intro">🏅 Congratulations to our top contributors! You'll receive:</p>
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
                  <span>✨ XP will be awarded automatically at the end of each month ✨</span>
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