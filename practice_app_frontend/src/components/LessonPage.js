import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { useGamification } from "../context/GamificationContext";
import "../App.css";

/**
 * PUBLIC_INTERFACE
 * LessonPage uses selectedLanguage from ProgressContext for TTS (no hardcoded localStorage/english fallback).
 * Now includes instant feedback with correct/incorrect indicator and explanation for user's answer submission.
 */
function LessonPage() {
  const { levelId } = useParams();
  const {
    levels,
    beginLevelPractice,
    nextAvailableLevel,
    selectedLanguage,
  } = useProgress();
  const levelIdx = levels.findIndex((l) => String(l.level) === String(levelId));
  const level = levels[levelIdx];
  const navigate = useNavigate();

  const [wordsReviewed, setWordsReviewed] = useState(
    Array(level?.words.length || 0).fill(false)
  );
  const [isMarkedPractice, setIsMarkedPractice] = useState(
    !!level?.practiceComplete
  );

  // Track user input for each word
  const [userInputs, setUserInputs] = useState(
    Array(level?.words.length || 0).fill("")
  );
  // Track submission result for each word: null = not checked; true = correct, false = incorrect
  const [answerResults, setAnswerResults] = useState(
    Array(level?.words.length || 0).fill(null)
  );
  // Optionally, explanation text for incorrect
  const [answerExplanation, setAnswerExplanation] = useState(
    Array(level?.words.length || 0).fill("")
  );
  // Animation trigger for correct answer
  const [successAnim, setSuccessAnim] = useState(
    Array(level?.words.length || 0).fill(false)
  );

  const { awardXP, recordPracticeEvent, unlockBadge } = useGamification();

  // Use BCP47 code if possible for TTS
  const languageBCP47Map = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    zh: "zh-CN",
    ja: "ja-JP",
    ar: "ar-SA",
    ru: "ru-RU",
    ko: "ko-KR",
    pt: "pt-PT",
  };
  const languageCode = selectedLanguage?.code || "en";
  const speechLang = languageBCP47Map[languageCode] || languageCode;

  if (!level) return <div>Lesson not found</div>;

  // Prevent user from accessing locked levels
  if (level.level > nextAvailableLevel)
    return (
      <div className="lesson-page">
        <h2>Level {level.level} is Locked</h2>
        <p>
          You need to pass Level {level.level - 1} with at least 75% accuracy to
          unlock this level.
        </p>
      </div>
    );

  // Levenshtein similarity (helper, matches the logic in AccuracySidebar)
  function calculateSimilarity(a, b) {
    if (!a || !b) return 0;
    const sa = a.trim().toLowerCase();
    const sb = b.trim().toLowerCase();
    if (!sa || !sb) return 0;
    // Levenshtein
    const matrix = Array(sb.length + 1)
      .fill(null)
      .map(() => []);
    for (let i = 0; i <= sb.length; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= sa.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= sb.length; i++) {
      for (let j = 1; j <= sa.length; j++) {
        const cost = sa[j - 1] === sb[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const rawScore = matrix[sb.length][sa.length];
    const maxLen = Math.max(sa.length, sb.length);
    if (maxLen === 0) return 100;
    const normalized = Math.max(0, 100 - (rawScore / maxLen) * 100);
    return Math.round(normalized);
  }

  // Check answer and trigger feedback
  const handleAnswerCheck = (idx) => {
    const correctAnswer = (level.words[idx]?.word || "").trim().toLowerCase();
    const userText = (userInputs[idx] || "").trim().toLowerCase();
    const similarity = calculateSimilarity(correctAnswer, userText);
    // Accept as correct if > 80% similarity (for spelling mistakes etc.)
    const isCorrect = similarity >= 80;

    setAnswerResults((arr) => {
      const n = [...arr];
      n[idx] = isCorrect;
      return n;
    });
    setAnswerExplanation((arr) => {
      const n = [...arr];
      if (isCorrect) {
        n[idx] = "";
      } else if (!userText) {
        n[idx] = "No answer entered. Try typing the word as you heard it.";
      } else if (similarity > 50) {
        n[idx] = `Almost correct! Spelling or small mistake. Correct: "${level.words[idx]?.word}"`;
      } else {
        n[idx] = `Incorrect. Correct answer: "${level.words[idx]?.word}"`;
      }
      return n;
    });
    // Play animation for correct answer
    if (isCorrect) {
      setSuccessAnim((arr) => {
        const n = [...arr];
        n[idx] = true;
        return n;
      });
      setTimeout(() => {
        setSuccessAnim((arr) => {
          const n = [...arr];
          n[idx] = false;
          return n;
        });
      }, 900);
    }
    // Mark as reviewed on correct
    if (isCorrect) {
      setWordsReviewed((arr) => {
        const n = [...arr];
        n[idx] = true;
        return n;
      });
    }
  };

  // Practice completion
  const handlePracticeDone = () => {
    beginLevelPractice(level.level);
    setIsMarkedPractice(true);
    awardXP(10, "lesson_complete");
    recordPracticeEvent();
    if (level.level === 1) unlockBadge("first_lesson");
  };

  return (
    <div style={{ position: "relative", minHeight: 330 }}>
      <div className="lesson-page">
        <h2>Level {level.level}: Practice Words</h2>
        <p style={{ maxWidth: 540 }}>
          Go through each word. Listen and <b>type what you hear</b> to practice your listening and spelling. You'll get instant feedback after submission!
        </p>
        <ul style={{ paddingLeft: 0, listStyle: "none", fontSize: "1.18rem" }}>
          {level.words.map((entry, idx) => (
            <li
              key={(entry.word || "") + "-" + idx}
              style={{
                marginBottom: 16,
                background: "#eaf9fa",
                display: "flex",
                flexDirection: "column",
                padding: "12px 18px",
                borderRadius: "6px",
                position: "relative",
                border: answerResults[idx] === true
                  ? "2px solid var(--accent-color)"
                  : answerResults[idx] === false
                  ? "2px solid #d23c37"
                  : "1.5px solid #b6d5db",
                boxShadow: successAnim[idx]
                  ? "0 0 16px 2px #62f997"
                  : undefined,
                transition: "border .2s, box-shadow .2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <b style={{ minWidth: 38 }}>{idx + 1}.</b>
                <span style={{ flex: 2, fontWeight: 600, fontSize: "1.13em" }}>
                  {entry.word}
                </span>
                <span
                  style={{
                    flex: 2,
                    color: "var(--secondary-color)",
                    marginLeft: 8,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "0.99em",
                  }}
                >
                  {entry.translation ? `(${entry.translation})` : ""}
                </span>
                <button
                  className="btn btn-accent"
                  style={{
                    marginLeft: 12,
                    padding: "2px 14px",
                    fontSize: "0.97rem",
                  }}
                  title="Hear pronunciation"
                  onClick={async () => {
                    // Always use best Google voice for language, fallback to high quality native
                    if (window.speechSynthesis && entry.word) {
                      try {
                        window.speechSynthesis.cancel();
                      } catch {}
                      const voices = window.speechSynthesis.getVoices() || [];
                      // Prefer Google-branded voice for language
                      let v =
                        voices.find(
                          (vo) =>
                            vo.lang &&
                            vo.lang
                              .toLowerCase()
                              .startsWith(languageCode.toLowerCase()) &&
                            ((vo.name && /google/i.test(vo.name)) ||
                              (vo.voiceURI && /google/i.test(vo.voiceURI)))
                        ) ||
                        voices.find(
                          (vo) =>
                            vo.lang &&
                            (vo.lang
                              .toLowerCase()
                              .startsWith(languageCode.toLowerCase()) ||
                              vo.lang.toLowerCase() === speechLang.toLowerCase())
                        );
                      if (!v && voices.length > 0) v = voices[0];
                      const ut = new window.SpeechSynthesisUtterance(entry.word);
                      ut.lang = v?.lang || speechLang;
                      ut.rate = 1;
                      ut.pitch = 1.15;
                      if (v) ut.voice = v;
                      window.speechSynthesis.speak(ut);
                    }
                  }}
                >
                  🔊
                </button>
              </div>
              {/* Instant feedback answer area */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                <input
                  style={{
                    fontSize: "1.13em",
                    flex: 3,
                    border: answerResults[idx] === true
                      ? "2px solid var(--accent-color)"
                      : answerResults[idx] === false
                      ? "2px solid #d23c37"
                      : "1.3px solid #b6d5db",
                    borderRadius: 6,
                    padding: "4.5px 14px",
                    marginRight: 7,
                    transition: "border .19s"
                  }}
                  placeholder="Type what you heard"
                  value={userInputs[idx]}
                  onChange={(e) => {
                    // If they manually edit input after correct, reset state.
                    setUserInputs((arr) => {
                      const n = [...arr];
                      n[idx] = e.target.value;
                      return n;
                    });
                    if (answerResults[idx] !== null) {
                      setAnswerResults((arr) => {
                        const n = [...arr];
                        n[idx] = null;
                        return n;
                      });
                      setAnswerExplanation((arr) => {
                        const n = [...arr];
                        n[idx] = "";
                        return n;
                      });
                    }
                  }}
                  disabled={answerResults[idx] === true}
                  aria-label="Type answer"
                  autoComplete="off"
                />
                <button
                  className="btn btn-primary"
                  style={{ minWidth: 74 }}
                  onClick={() => handleAnswerCheck(idx)}
                  disabled={
                    answerResults[idx] === true ||
                    !userInputs[idx].trim()
                  }
                  aria-label="Check answer"
                >
                  Check
                </button>
                {answerResults[idx]===true && (
                  <span style={{
                    color: "var(--accent-color)",
                    fontWeight: 700,
                    fontSize: "1.15em",
                    marginLeft: 5,
                    transition: "color .2s"
                  }}>
                    ✓ Correct!
                    <span
                      style={{
                        marginLeft: 5,
                        animation: "kavia-pop 0.7s linear",
                        display: "inline-block"
                      }}
                    >
                      🎉
                    </span>
                  </span>
                )}
                {answerResults[idx]===false && (
                  <span style={{
                    color: "#d23c37",
                    fontWeight: 700,
                    fontSize: "1.10em",
                    marginLeft: 5
                  }}>
                    ✗ Incorrect
                  </span>
                )}
              </div>
              {answerExplanation[idx] && (
                <div style={{
                  color: answerResults[idx] ? "var(--accent-color)" : "#b14343",
                  marginTop: 5,
                  fontSize: ".99em",
                  fontStyle: "italic",
                  minHeight: 17,
                  transition: "color .2s"
                }}>
                  {answerExplanation[idx]}
                </div>
              )}
              <div style={{marginTop: 2}}>
                {wordsReviewed[idx] && answerResults[idx] === true && (
                  <span style={{
                    color: "#46bb54",
                    fontWeight: 600,
                    fontSize: ".98em"
                  }}>
                    Marked as reviewed!
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button
          className="btn btn-accent"
          disabled={
            isMarkedPractice ||
            wordsReviewed.filter(Boolean).length !== level.words.length
          }
          onClick={handlePracticeDone}
          style={{ marginTop: 22 }}
        >
          {isMarkedPractice
            ? "Practice Complete"
            : "I Completed All Words"}
        </button>
        <div>
          <button
            className="btn btn-primary"
            style={{
              marginTop: 28,
              marginLeft: 5,
              fontFamily: "Arial, sans-serif",
            }}
            disabled={!isMarkedPractice}
            onClick={() => navigate(`/challenge/${level.level}`)}
          >
            {isMarkedPractice ? "Take Level Test" : "Unlock Test"}
          </button>
        </div>
      </div>
      {/* Keyframes for animation */}
      <style>
        {`
          @keyframes kavia-pop {
            0% { transform: scale(1); opacity: .7;}
            60% { transform: scale(1.4); opacity: 1;}
            90% { transform: scale(.93);}
            100% { transform: scale(1);}
          }
        `}
      </style>
    </div>
  );
}
export default LessonPage;
