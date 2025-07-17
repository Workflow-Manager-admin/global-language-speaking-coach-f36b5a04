import React from "react";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * Sidebar component that displays the current speech accuracy/score for the user.
 * @param {Object} props
 * @param {string} target - The phrase the user is expected to pronounce.
 * @param {string} userInput - The user's transcribed speech or input.
 * @param {number|null} score - Pre-scored value if calculated upstream (overrides auto-calculation).
 */
function AccuracySidebar({ target, userInput, score = null }) {
  // Returns a number in [0, 100]
  function calculateSimilarity(a, b) {
    if (!a || !b) return 0;
    const sa = a.trim().toLowerCase();
    const sb = b.trim().toLowerCase();
    if (!sa || !sb) return 0;
    // Simple Levenshtein distance comparing text
    const matrix = Array(sb.length + 1).fill(null).map(() => []);
    for (let i = 0; i <= sb.length; i++) { matrix[i][0] = i; }
    for (let j = 0; j <= sa.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= sb.length; i++) {
      for (let j = 1; j <= sa.length; j++) {
        const cost = sa[j - 1] === sb[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,        // deletion
          matrix[i][j - 1] + 1,        // insertion
          matrix[i - 1][j - 1] + cost  // substitution
        );
      }
    }
    const rawScore = matrix[sb.length][sa.length];
    const maxLen = Math.max(sa.length, sb.length);
    if (maxLen === 0) return 100;
    const normalized = Math.max(0, 100 - (rawScore / maxLen) * 100);
    return Math.round(normalized);
  }

  let displayScore = score;
  if (score === null && target) {
    displayScore = calculateSimilarity(target, userInput);
  }

  let feedback = "";
  if (displayScore === 100) feedback = "Perfect!";
  else if (displayScore > 80) feedback = "Great!";
  else if (displayScore > 60) feedback = "Getting close!";
  else if (displayScore > 0) feedback = "Keep practicing!";
  else feedback = "Try speaking!";

  return (
    <aside style={{
      background: "#eaf9fa",
      borderLeft: "4px solid var(--accent-color)",
      minWidth: 140,
      padding: "22px 12px",
      position: "absolute",
      right: 0,
      top: 65,
      zIndex: 10,
      fontWeight: 500
    }}>
      <h4 style={{margin:0, color:"var(--accent-color)"}}>Accuracy</h4>
      <div style={{fontSize:28, fontWeight: 700, margin: "12px 0"}}>
        {displayScore || 0}%
      </div>
      <div style={{color:"var(--secondary-color)", minHeight: 24}}>{feedback}</div>
      <div style={{marginTop: 14, fontSize:13, color:"var(--primary-color)"}}>
        Target: <br /><span style={{fontWeight:600}}>{target||"-"}</span>
      </div>
      <div style={{marginTop: 6, fontSize:13, color:"var(--primary-color)"}}>
        You said: <br /><span style={{fontStyle: "italic"}}>{userInput||"-"}</span>
      </div>
    </aside>
  );
}
export default AccuracySidebar;
