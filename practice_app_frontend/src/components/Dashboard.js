import React from "react";
import { useProgress } from "../context/ProgressContext";
import { useGamification } from "../context/GamificationContext";
import "../App.css";

// PUBLIC_INTERFACE
function Dashboard() {
  const { stats, selectedLanguage } = useProgress();
  const { xp, dailyStreak, badges, BADGES } = useGamification();

  const badgeData = BADGES.filter(b => badges.includes(b.id));

  return (
    <div className="dashboard-container">
      <h2>Welcome back!</h2>
      <p>Language: <b>{selectedLanguage?.label || "Choose"}</b></p>
      <div className="dashboard-cards">
        <div className="dashboard-card"><b>Level:</b> {stats.level}</div>
        <div className="dashboard-card"><b>Progress:</b>
          <progress max="100" value={stats.progressPercent}>{stats.progressPercent}%</progress>
          <span>{stats.progressPercent}%</span>
        </div>
        <div className="dashboard-card">
          <span style={{fontSize:20}}>⭐</span><b> XP:</b> {xp}
        </div>
        <div className="dashboard-card">
          <span role="img" aria-label="fire">🔥</span> <b>Streak:</b> {dailyStreak} day{dailyStreak === 1 ? "" : "s"}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 23 }}>
        <span style={{ fontWeight: 600 }}>Badges Unlocked:</span>
        {badgeData.length === 0 ? (
          <span style={{ marginLeft: 14, color: "#bbb" }}>None yet</span>
        ) : badgeData.map((badge, i) => (
          <span key={badge.id}
            style={{
              background: "#fff",
              color: "var(--secondary-color)",
              borderRadius: 7,
              padding: "4px 12px",
              fontWeight: 500,
              border: "1px solid var(--border)",
              marginLeft: i === 0 ? 8 : 3,
              fontSize: "1.1em"
            }}
            title={badge.description}
          >
            {badge.label}
          </span>
        ))}
      </div>
      <div style={{marginTop:16, color:"var(--accent-color)"}}>
        {stats.progressPercent < 100 ? "Keep going—your next speaking challenge awaits!" : "Congratulations! Try a harder level or a new language."}
      </div>
    </div>
  );
}
export default Dashboard;
