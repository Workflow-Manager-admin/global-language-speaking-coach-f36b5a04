import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { useGamification } from "../context/GamificationContext";
import "../App.css";

/**
 * PUBLIC_INTERFACE
 * LessonPage presents micro-lessons (short, atomic vocabulary/grammar/speaking activities)
 * to maximize focus, feedback, and engagement. Tracks and displays per-activity state.
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

  // Micro-lessons: [{type, content, completed, id}]
  const microLessons = level?.microLessons || [];

  // State: index of current micro-lesson step
  const [microIdx, setMicroIdx] = useState(0);

  // Track user input per micro-lesson
  const [userInputs, setUserInputs] = useState(
    Array(microLessons.length || 0).fill("")
  );
  // Feedback per micro-lesson: null = not checked, true = correct, false = incorrect
  const [microResults, setMicroResults] = useState(
    Array(microLessons.length || 0).fill(null)
  );
  // Explanation for incorrect/correct
  const [microExplanation, setMicroExplanation] = useState(
    Array(microLessons.length || 0).fill("")
  );
  // Animation for instant feedback
  const [successAnim, setSuccessAnim] = useState(
    Array(microLessons.length || 0).fill(false)
  );

  // Micro-lesson completion state estimate
  const allComplete =
    microResults.filter((res) => res === true).length === microLessons.length;

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

  // Guard: Prevent access to locked levels
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

  // Levenshtein similarity checker (matches others)
  function calculateSimilarity(a, b) {
    if (!a || !b) return 0;
    const sa = a.trim().toLowerCase();
    const sb = b.trim().toLowerCase();
    if (!sa || !sb) return 0;
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

  // Check the answer for current micro-lesson and show feedback
  const handleCheck = () => {
    const ml = microLessons[microIdx];
    const answerRaw = ml.content.word || "";
    const correctAnswer = answerRaw.trim().toLowerCase();
    const userAnswer = (userInputs[microIdx] || "").trim().toLowerCase();
    const similarity = calculateSimilarity(correctAnswer, userAnswer);
    const isCorrect = similarity >= 80;

    setMicroResults((arr) => {
      const n = [...arr];
      n[microIdx] = isCorrect;
      return n;
    });
    setMicroExplanation((arr) => {
      const n = [...arr];
      if (isCorrect) {
        n[microIdx] = "";
      } else if (!userAnswer) {
        n[microIdx] = "No answer entered. Try typing what you hear or see!";
      } else if (similarity > 50) {
        n[microIdx] = `Almost correct! Spelling or typo. Correct: "${answerRaw}"`;
      } else {
        n[microIdx] = `Incorrect. Correct answer: "${answerRaw}"`;
      }
      return n;
    });

    // Success pop
    if (isCorrect) {
      setSuccessAnim((arr) => {
        const n = [...arr];
        n[microIdx] = true;
        return n;
      });
      setTimeout(() => {
        setSuccessAnim((arr) => {
          const n = [...arr];
          n[microIdx] = false;
          return n;
        });
      }, 900);
    }
  };

  // Mark lesson as done to enable progression, award XP
  const handlePracticeDone = () => {
    beginLevelPractice(level.level);
    awardXP(10, "lesson_complete");
    recordPracticeEvent();
    if (level.level === 1) unlockBadge("first_lesson");
  };

  // UI for single micro-lesson at a time
  function renderMicroLesson(ml, idx) {
    return (
      <div
        key={ml.id}
        style={{
          marginBottom: 16,
          background: "#eaf9fa",
          display: "flex",
          flexDirection: "column",
          padding: "20px 22px 20px 22px",
          borderRadius: "7px",
          position: "relative",
          border:
            microResults[idx] === true
              ? "2.3px solid var(--accent-color)"
              : microResults[idx] === false
              ? "2px solid #d23c37"
              : "1.3px solid #b6d5db",
          boxShadow: successAnim[idx]
            ? "0 0 16px 2px #62f997"
            : undefined,
          minHeight: 144,
          transition: "border .2s, box-shadow .2s",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "1.14em", marginBottom: 3 }}>
          {"Practice: "}
          <span style={{ color: "var(--primary-color)" }}>
            {ml.content.word}
          </span>
        </div>
        <div style={{
          color: "var(--secondary-color)",
          fontSize: "1.1em",
          marginBottom: 8,
        }}>
          Meaning: <span style={{ fontWeight: 600 }}>{ml.content.translation}</span>
        </div>
        <button
          className="btn btn-accent"
          style={{
            marginLeft: 3,
            padding: "2.5px 18px",
            fontSize: "1.08rem",
            maxWidth: 130,
          }}
          title="Hear pronunciation"
          onClick={async () => {
            if (window.speechSynthesis && ml.content.word) {
              try { window.speechSynthesis.cancel(); } catch {}
              const voices = window.speechSynthesis.getVoices() || [];
              let v =
                voices.find(
                  (vo) =>
                    vo.lang &&
                    vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) &&
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
              const ut = new window.SpeechSynthesisUtterance(ml.content.word);
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
        <div style={{ margin: "16px 0 0 0", display: "flex", alignItems: "flex-end", gap: 12 }}>
          <input
            style={{
              fontSize: "1.18em",
              flex: 3,
              border:
                microResults[idx] === true
                  ? "2px solid var(--accent-color)"
                  : microResults[idx] === false
                  ? "2px solid #d23c37"
                  : "1.3px solid #b6d5db",
              borderRadius: 7,
              padding: "7px 16px",
              marginRight: 4,
              transition: "border .17s",
              width: "80%",
            }}
            placeholder={"Type what you hear or see"}
            value={userInputs[idx]}
            onChange={(e) => {
              setUserInputs((arr) => {
                const n = [...arr];
                n[idx] = e.target.value;
                return n;
              });
              if (microResults[idx] !== null) {
                setMicroResults((arr) => {
                  const n = [...arr];
                  n[idx] = null;
                  return n;
                });
                setMicroExplanation((arr) => {
                  const n = [...arr];
                  n[idx] = "";
                  return n;
                });
              }
            }}
            disabled={microResults[idx] === true}
            aria-label="Type answer"
            autoComplete="off"
          />
          <button
            className="btn btn-primary"
            style={{ minWidth: 74 }}
            onClick={handleCheck}
            disabled={
              microResults[idx] === true || !userInputs[idx].trim()
            }
            aria-label="Check answer"
          >
            Check
          </button>
          {microResults[idx] === true && (
            <span style={{
              color: "var(--accent-color)",
              fontWeight: 700,
              fontSize: "1.15em",
              marginLeft: 5,
              transition: "color .2s",
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
          {microResults[idx] === false && (
            <span style={{
              color: "#d23c37",
              fontWeight: 700,
              fontSize: "1.08em",
              marginLeft: 5
            }}>
              ✗ Incorrect
            </span>
          )}
        </div>
        {microExplanation[idx] && (
          <div style={{
            color: microResults[idx] ? "var(--accent-color)" : "#b14343",
            marginTop: 6,
            fontSize: "1.01em",
            fontStyle: "italic",
            minHeight: 17,
            transition: "color .2s"
          }}>
            {microExplanation[idx]}
          </div>
        )}
      </div>
    );
  }

  // Move to next/previous micro-lesson
  const goNext = () => {
    setMicroIdx((prev) => Math.min(prev + 1, microLessons.length - 1));
  };
  const goPrev = () => {
    setMicroIdx((prev) => Math.max(prev - 1, 0));
  };

  // On finish, trigger completion and congratulation
  const finishedState = allComplete;

  return (
    <div style={{ position: "relative", minHeight: 260 }}>
      <div className="lesson-page" style={{ maxWidth: 430, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 3 }}>Level {level.level}: Micro-Lessons</h2>
        <p style={{ color: "#306", marginBottom: 15 }}>
          Bite-sized activities! Get <b>instant feedback</b> as you practice each word or phrase.
        </p>
        {microLessons.length === 0 ? (
          <div>No micro-lessons available.</div>
        ) : (
          <>
            <div>
              <div style={{
                color: "var(--accent-color)",
                marginBottom: 7,
                fontWeight: 600,
                fontSize: ".99em"
              }}>
                {`Progress: ${microIdx + 1} / ${microLessons.length}`}
              </div>
              {renderMicroLesson(microLessons[microIdx], microIdx)}
              <div style={{ marginTop: 6, display: "flex", gap: 18 }}>
                <button
                  className="btn btn-primary"
                  onClick={goPrev}
                  disabled={microIdx === 0}
                >
                  Prev
                </button>
                <button
                  className="btn btn-primary"
                  onClick={goNext}
                  disabled={microIdx === microLessons.length - 1}
                >
                  Next
                </button>
              </div>
              <div style={{ marginTop: 19 }}>
                {finishedState && (
                  <div style={{ color: "#30a94e", fontWeight: 700, fontSize: "1.1em" }}>
                    🎯 Micro-lesson set complete! Mark as done to unlock next test.
                  </div>
                )}
                <button
                  className="btn btn-accent"
                  style={{ marginTop: 12 }}
                  disabled={!finishedState}
                  onClick={handlePracticeDone}
                >
                  {finishedState ? "Practice Complete" : "Finish All First"}
                </button>
              </div>
              <div>
                <button
                  className="btn btn-primary"
                  style={{
                    marginTop: 19,
                    marginLeft: 5,
                    fontFamily: "Arial, sans-serif",
                  }}
                  disabled={!finishedState}
                  onClick={() => navigate(`/challenge/${level.level}`)}
                >
                  {finishedState ? "Take Level Test" : "Unlock Test"}
                </button>
              </div>
            </div>
          </>
        )}
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
