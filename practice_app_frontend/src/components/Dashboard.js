import React from "react";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
function Dashboard() {
  const { stats, selectedLanguage } = useProgress();

  return (
    <div className="dashboard-container">
      <h2>Welcome back!</h2>
      <p>Language: <b>{selectedLanguage?.label || "Choose"}</b></p>
      <div className="dashboard-cards">
        <div className="dashboard-card"><b>Level:</b> {stats.level}</div>
        <div className="dashboard-card"><b>Total Lessons:</b> {stats.lessonsCompleted}</div>
        <div className="dashboard-card"><b>Challenges Completed:</b> {stats.challengesCompleted}</div>
        <div className="dashboard-card dashboard-progress">
          <b>Progress:</b>
          <progress max="100" value={stats.progressPercent}>{stats.progressPercent}%</progress>
          <span>{stats.progressPercent}%</span>
        </div>
      </div>
      <div style={{marginTop:16, color:"var(--accent-color)"}}>
        {stats.progressPercent < 100 ? "Keep going—your next speaking challenge awaits!" : "Congratulations! Try a harder level or a new language."}
      </div>
    </div>
  );
}
export default Dashboard;
