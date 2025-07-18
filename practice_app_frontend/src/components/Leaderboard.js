import React from "react";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * Leaderboard UI - shows rankings by mock XP/streak.
 * Optionally, highlights the current user.
 *
 * @param {Object[]} data - array of user stats: {username, xp, streak, isCurrentUser}
 */
function Leaderboard({ data }) {
  if (!data || !data.length) {
    return (
      <div className="leaderboard-block" style={{
        padding: "22px 14px",
        background: "#fff",
        borderRadius: 10,
        marginTop: 26,
        minWidth: 220,
        boxShadow: "0 1px 7px 0 rgba(41,61,120,0.06)",
      }}>
        <h3 style={{margin:0, color:"var(--accent-color)", fontWeight:700}}>Leaderboard</h3>
        <div style={{margin: "18px 0", color: "#888"}}>No leaderboard data yet</div>
      </div>
    );
  }

  // Sorted descending by XP → Streak
  const sorted = [...data].sort((a, b) => b.xp - a.xp || b.streak - a.streak);

  return (
    <div className="leaderboard-block" style={{
      padding: "22px 14px",
      background: "#fff",
      borderRadius: 10,
      marginTop: 26,
      minWidth: 220,
      boxShadow: "0 1px 7px 0 rgba(41,61,120,0.06)",
    }}>
      <h3 style={{margin:0, color:"var(--accent-color)", fontWeight:700}}>Leaderboard</h3>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 10,
        fontSize: "1.02em"
      }}>
        <thead>
          <tr style={{color: "#839"}}>
            <th style={{textAlign:"left", paddingRight:8}}>Rank</th>
            <th style={{textAlign:"left"}}>User</th>
            <th style={{textAlign:"right"}}>XP</th>
            <th style={{textAlign:"right"}}>🔥</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <tr key={entry.username}
                style={{
                  background: entry.isCurrentUser ? "var(--accent-color)" : (i % 2 ? "#f3f5f9" : "#fff"),
                  color: entry.isCurrentUser ? "#fff" : undefined,
                  fontWeight: entry.isCurrentUser ? 700 : 500,
                }}>
              <td style={{fontWeight: 600, paddingRight:8}}>{i+1}</td>
              <td>{entry.username}</td>
              <td style={{textAlign:"right"}}>{entry.xp}</td>
              <td style={{textAlign:"right"}}>{entry.streak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
