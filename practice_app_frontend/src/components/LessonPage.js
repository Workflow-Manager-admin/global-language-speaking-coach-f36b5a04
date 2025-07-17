import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
function LessonPage() {
  const { levelId } = useParams();
  const {
    levels,
    beginLevelPractice,
    nextAvailableLevel
  } = useProgress();
  const levelIdx = levels.findIndex(l => String(l.level) === String(levelId));
  const level = levels[levelIdx];
  const navigate = useNavigate();

  const [wordsReviewed, setWordsReviewed] = useState(Array(level?.words.length || 0).fill(false));
  const [isMarkedPractice, setIsMarkedPractice] = useState(!!level?.practiceComplete);

  if (!level) return <div>Lesson not found</div>;

  // Prevent user from accessing locked levels
  if (level.level > nextAvailableLevel)
    return (
      <div className="lesson-page">
        <h2>Level {level.level} is Locked</h2>
        <p>You need to pass Level {level.level - 1} with at least 75% accuracy to unlock this level.</p>
      </div>
    );

  // Practice completion
  const handlePracticeDone = () => {
    beginLevelPractice(level.level);
    setIsMarkedPractice(true);
  };

  return (
    <div style={{ position: "relative", minHeight: 330 }}>
      <div className="lesson-page">
        <h2>Level {level.level}: Practice Words</h2>
        <p>Go through each word. Listen and say it aloud to practice speaking.</p>
        <ul style={{ paddingLeft: 0, listStyle: "none", fontSize: "1.18rem" }}>
          {level.words.map((word, idx) => (
            <li key={word + idx} style={{
              marginBottom: 10,
              background: "#eaf9fa",
              display: "flex",
              alignItems: "center",
              padding: "7px 16px",
              borderRadius: "4px"
            }}>
              <b style={{minWidth:48}}>{idx + 1}.</b>
              <span style={{flex:1}}>{word}</span>
              <button
                className="btn btn-accent"
                style={{ marginLeft: 14, padding: "2px 17px", fontSize: "0.97rem" }}
                title="Hear pronunciation"
                onClick={() => {
                  if (window.speechSynthesis && word) {
                    try { window.speechSynthesis.cancel(); } catch { }
                    const ut = new window.SpeechSynthesisUtterance(word);
                    ut.lang = "en-US";
                    window.speechSynthesis.speak(ut);
                  }
                  // Mark this word as reviewed
                  setWordsReviewed(wr =>
                    wr.map((val, i) => (i === idx ? true : val))
                  );
                }}
              >
                🔊
              </button>
              <span style={{
                color: wordsReviewed[idx] ? "var(--accent-color)" : "#aaa",
                fontWeight: 700,
                marginLeft: 12
              }}>
                {wordsReviewed[idx] ? "✓" : ""}
              </span>
            </li>
          ))}
        </ul>
        <button
          className="btn btn-accent"
          disabled={isMarkedPractice || !wordsReviewed.every(Boolean)}
          onClick={handlePracticeDone}
          style={{ marginTop: 22 }}
        >
          {isMarkedPractice ? "Practice Complete" : "I Practiced Every Word"}
        </button>
        <div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 28, marginLeft: 5 }}
            disabled={!isMarkedPractice}
            onClick={() => navigate(`/challenge/${level.level}`)}
          >
            {isMarkedPractice ? "Take Level Test" : "Practice All Words to Unlock Test"}
          </button>
        </div>
      </div>
    </div>
  );
}
export default LessonPage;
