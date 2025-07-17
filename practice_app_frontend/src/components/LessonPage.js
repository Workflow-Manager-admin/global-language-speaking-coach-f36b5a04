import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * LessonPage uses selectedLanguage from ProgressContext for TTS (no hardcoded localStorage/english fallback).
 */
function LessonPage() {
  const { levelId } = useParams();
  const {
    levels,
    beginLevelPractice,
    nextAvailableLevel,
    selectedLanguage
  } = useProgress();
  const levelIdx = levels.findIndex(l => String(l.level) === String(levelId));
  const level = levels[levelIdx];
  const navigate = useNavigate();

  const [wordsReviewed, setWordsReviewed] = useState(
    Array(level?.words.length || 0).fill(false)
  );
  const [isMarkedPractice, setIsMarkedPractice] = useState(
    !!level?.practiceComplete
  );

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
    pt: "pt-PT"
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

  // Practice completion
  const handlePracticeDone = () => {
    beginLevelPractice(level.level);
    setIsMarkedPractice(true);
  };

  return (
    <div style={{ position: "relative", minHeight: 330 }}>
      <div className="lesson-page">
        <h2>Level {level.level}: Practice Words</h2>
        <p>
          Go through each word. Listen and say it aloud to practice speaking.
        </p>
        <ul style={{ paddingLeft: 0, listStyle: "none", fontSize: "1.18rem" }}>
          {level.words.map((entry, idx) => (
            <li
              key={(entry.word || "") + "-" + idx}
              style={{
                marginBottom: 10,
                background: "#eaf9fa",
                display: "flex",
                alignItems: "center",
                padding: "7px 16px",
                borderRadius: "4px",
              }}
            >
              <b style={{ minWidth: 38 }}>{idx + 1}.</b>
              <span style={{ flex: 2, fontWeight: 600 }}>
                {entry.word}
              </span>
              <span style={{
                flex: 2,
                color: "var(--secondary-color)",
                marginLeft: 8,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "0.99em"
              }}>
                {entry.translation ? `(${entry.translation})` : ""}
              </span>
              <button
                className="btn btn-accent"
                style={{
                  marginLeft: 12,
                  padding: "2px 14px",
                  fontSize: "0.97rem"
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
                        vo =>
                          vo.lang &&
                          vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) &&
                          ((vo.name && /google/i.test(vo.name)) ||
                            (vo.voiceURI && /google/i.test(vo.voiceURI)))
                      ) ||
                      voices.find(
                        vo =>
                          vo.lang &&
                          (vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) ||
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
                  // Mark this word as reviewed
                  setWordsReviewed(wr =>
                    wr.map((val, i) => (i === idx ? true : val))
                  );
                }}
              >
                🔊
              </button>
              <span
                style={{
                  color: wordsReviewed[idx] ? "var(--accent-color)" : "#aaa",
                  fontWeight: 700,
                  marginLeft: 10,
                }}
              >
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
            style={{
              marginTop: 28,
              marginLeft: 5,
              fontFamily: "Arial, sans-serif"
            }}
            disabled={!isMarkedPractice}
            onClick={() => navigate(`/challenge/${level.level}`)}
          >
            {isMarkedPractice ? "Take Level Test" : "Unlock Test"}
          </button>
        </div>
      </div>
    </div>
  );
}
export default LessonPage;
