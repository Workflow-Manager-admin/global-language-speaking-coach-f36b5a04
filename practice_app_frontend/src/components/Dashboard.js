import React from "react";
import { useProgress } from "../context/ProgressContext";
import { useGamification } from "../context/GamificationContext";
import Leaderboard from "./Leaderboard";
import FriendsList from "./FriendsList";
import "../App.css";

// PUBLIC_INTERFACE
function Dashboard() {
  const { stats, selectedLanguage, getDueAdaptiveReview, markAdaptiveReviewWordSuccess, removeAdaptiveReviewWord } = useProgress();
  const { xp, dailyStreak, badges, BADGES } = useGamification();

  const badgeData = BADGES.filter(b => badges.includes(b.id));
  const reviewWords = getDueAdaptiveReview ? getDueAdaptiveReview() : [];

  // ---- MOCKED DATA ----
  let currentUser = null;
  if (typeof window !== "undefined" && localStorage.getItem("user")) {
    try {
      currentUser = JSON.parse(localStorage.getItem("user"));
    } catch {}
  }
  const leaderboardEntries = [
    { username: "polyglot_anne", xp: 440, streak: 15 },
    { username: "linguist_lee", xp: 330, streak: 7 },
    { username: currentUser?.username || "You", xp, streak: dailyStreak, isCurrentUser: true },
    { username: "minerva", xp: 295, streak: 5 },
    { username: "marco", xp: 155, streak: 2 },
  ];
  if (
    currentUser &&
    !leaderboardEntries.some(
      entry => entry.username === currentUser.username
    )
  ) {
    leaderboardEntries.push({
      username: currentUser.username,
      xp,
      streak: dailyStreak,
      isCurrentUser: true,
    });
  }
  const friendsList = [
    { username: "minerva", xp: 295 },
    { username: "marco", xp: 155 },
    { username: "sophia", xp: 88 },
  ];

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
      {/* ---- NEW: Leaderboard and Friends UI ---- */}
      <div style={{
        display: "flex",
        gap: 32,
        marginTop: 30,
        flexWrap: "wrap"
      }}>
        <Leaderboard data={leaderboardEntries} />
        <FriendsList friends={friendsList} />
      </div>
      {/* ---- Adaptive Review Section ---- */}
      {reviewWords.length > 0 && (
        <div style={{
          marginTop: 30,
          background: "#eaf9fa",
          borderRadius: 8,
          padding: "14px 18px",
          border: "1px solid #d3fada"
        }}>
          <h3 style={{ color: "var(--primary-color)", margin: "2px 0 8px 0", fontWeight: 700, fontSize: "1.07rem" }}>
            Review Trouble Words
            <span style={{ marginLeft: 6, fontSize: "1.12em", color: "#ff8617" }}>🕓</span>
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {reviewWords.map((entry, i) =>
              <li key={entry.word + "::" + entry.translation + "::" + entry.idx}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    marginBottom: 6,
                    borderBottom: "1px dashed #ccc", paddingBottom: 2
                  }}>
                <span style={{ minWidth: 70, fontWeight: 600, color: "var(--accent-color)" }}>{entry.word}</span>
                <span style={{ color: "#8aa", fontStyle: "italic", minWidth: 70 }}>({entry.translation})</span>
                <button
                  className="btn btn-accent"
                  style={{ padding: "2px 13px", fontSize: "0.96em", marginLeft: 10 }}
                  title="Mark as mastered (remove from review)"
                  onClick={() => removeAdaptiveReviewWord(entry.word, entry.translation, entry.idx)}
                >✓ Mastered</button>
                <button
                  className="btn btn-primary"
                  style={{ padding: "2px 13px", fontSize: "0.96em", marginLeft: 4 }}
                  title="Mark as reviewed now (schedule for later)"
                  onClick={() => markAdaptiveReviewWordSuccess(entry.word, entry.translation, entry.idx)}
                >Reviewed</button>
              </li>
            )}
          </ul>
          <div style={{ color: "var(--primary-color)", marginTop: 7, fontSize: "0.98em" }}>
            Practice these difficult words now! <b>Repeat aloud</b> and click <span style={{ fontWeight: 700 }}>Reviewed</span> after you practice.
          </div>
        </div>
      )}
      {/* ---- End Adaptive Review ---- */}
      <div style={{marginTop:16, color:"var(--accent-color)"}}>
        {stats.progressPercent < 100 ? "Keep going—your next speaking challenge awaits!" : "Congratulations! Try a harder level or a new language."}
      </div>
    </div>
  );
}
export default Dashboard;
