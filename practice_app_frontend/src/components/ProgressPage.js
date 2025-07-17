import React from "react";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
function ProgressPage() {
  const { stats, lessons } = useProgress();

  return (
    <div className="progress-page">
      <h2>My Progress</h2>
      <div className="progress-stats">
        <div><b>Level:</b> {stats.level}</div>
        <div><b>Lessons Completed:</b> {stats.lessonsCompleted}</div>
        <div><b>Speaking Challenges Completed:</b> {stats.challengesCompleted}</div>
        <progress max="100" value={stats.progressPercent}>{stats.progressPercent}%</progress>
        <div><b>Overall:</b> {stats.progressPercent}%</div>
      </div>
      <div className="progress-lessons">
        <h3>Lesson History</h3>
        <ul>
          {lessons.filter(l => l.completed).map(l =>
            <li key={l.level}>Lesson {l.level}: {l.title} ✅</li>
          )}
        </ul>
      </div>
    </div>
  );
}
export default ProgressPage;
