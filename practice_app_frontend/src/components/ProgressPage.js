import React from "react";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
function ProgressPage() {
  const { levels, stats } = useProgress();

  return (
    <div className="progress-page">
      <h2>My Progress</h2>
      <div className="progress-stats">
        <div><b>Level Reached:</b> {stats.level}</div>
        <div><b>Levels Completed:</b> {stats.completed} / {stats.totalLevels}</div>
        <progress max="100" value={stats.progressPercent}>{stats.progressPercent}%</progress>
        <div><b>Overall:</b> {stats.progressPercent}%</div>
      </div>
      <div className="progress-lessons">
        <h3>Level History</h3>
        <ul>
          {levels.map(l => (
            <li key={l.level}>
              Level {l.level}:&nbsp;
              <span>
                {(l.practiceComplete ? "🗸 Practice" : "⏳ Practice")}
                &nbsp;|&nbsp;
                {l.testScore ?
                  (l.testScore.passed ? `✅ Test (${l.testScore.score}%)`
                    : `❌ Test (${l.testScore.score}%)`)
                  : "⏳ Test"
                }
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
export default ProgressPage;
