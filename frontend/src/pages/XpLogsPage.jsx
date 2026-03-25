import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/UserProfilePage.css";

const MOCK_XP_LOGS = [
  { id: 101, action_type: "RECIPE_APPROVED", reference_title: "Manok Pansoh", xp_awarded: 100, created_at: "2026-03-23T10:30:00Z" },
  { id: 102, action_type: "POST_LIKED", reference_title: "Best places to eat in Kuching", xp_awarded: 5, created_at: "2026-03-22T14:15:00Z" },
  { id: 103, action_type: "RECIPE_REJECTED", reference_title: "Nasi Lemak", xp_awarded: -20, created_at: "2026-03-20T09:00:00Z" },
  { id: 104, action_type: "ACCOUNT_CREATION", reference_title: "Welcome to the Hub!", xp_awarded: 50, created_at: "2026-03-15T08:00:00Z" }
];

const formatActionType = (actionType) => {
  return actionType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function XpLogsPage() {
  const navigate = useNavigate();

  return (
    <div className="user-profile-page">
      <Header />
      
      <div className="upp-page">
        <div className="upp-stack xlp-stack">
          
          <button 
            className="lrp-btn lrp-btn-outline xlp-btn" 
            onClick={() => navigate(-1)}
          >
            ← Back to Profile
          </button>

          <div className="upp-card">
            <h2 className="upp-card-title xlp-card-title">XP Logs</h2>
            <p className="upp-muted2 xlp-muted2">
              A complete history of how you've earned your rank on the Food-Nutrition Hub.
            </p>

            <div className="xp-log-list">
              {MOCK_XP_LOGS.map((log) => (
                <div key={log.id} className="xp-log-item">
                  <div className="xp-log-info">
                    <div className="xp-log-action">{formatActionType(log.action_type)}</div>
                    <div className="xp-log-details">{log.reference_title}</div>
                    <div className="upp-muted2">
                      {new Date(log.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>
                  <div className={`xp-log-amount ${log.xp_awarded > 0 ? "xp-positive" : "xp-negative"}`}>
                    {log.xp_awarded > 0 ? "+" : ""}{log.xp_awarded} XP
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}