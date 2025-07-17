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

  // Determine learning language code for TTS selection
  let selectedLangObj =
    window.localStorage.getItem("selectedLanguage") &&
    JSON.parse(window.localStorage.getItem("selectedLanguage"));
  let defaultLang = (selectedLangObj && selectedLangObj.code) || "en";

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

  // Helper: robustly select the best matching voice for the selected language code.
  function pickBestVoiceForLanguage(langCode) {
    if (!window.speechSynthesis) return { voice: null, lang: langCode, fallback: true };
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return { voice: null, lang: langCode, fallback: true };
    // Step 1: Try for exact BCP47 match (e.g., es-ES for "es")
    let mainLang = langCode;
    // Step 2: Look for best match
    let exact = voices.find(v => v.lang && v.lang.toLowerCase() === langCode.toLowerCase());
    if (exact) return { voice: exact, lang: exact.lang, fallback: false, voiceName: exact.name };
    // Step 3: Look for ones that start with language code (es, es-ES, es-MX, ...)
    let prefix = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(mainLang.toLowerCase() + '-'));
    if (prefix) return { voice: prefix, lang: prefix.lang, fallback: false, voiceName: prefix.name };
    // Step 4: Any voice with just the plain language code
    let justLang = voices.find(v => v.lang && v.lang.substr(0, 2).toLowerCase() === mainLang.toLowerCase());
    if (justLang) return { voice: justLang, lang: justLang.lang, fallback: false, voiceName: justLang.name };
    // Step 5: Fallback, return first available
    return { voice: voices[0], lang: voices[0].lang, fallback: true, voiceName: voices[0].name };
  }

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
                onClick={async () => {
                  // Always use best Google voice for language, fallback to high quality native
                  if (window.speechSynthesis && word) {
                    try { window.speechSynthesis.cancel(); } catch { }
                    const voices = window.speechSynthesis.getVoices() || [];
                    // Step 1: Google voice for language (matches code, Google in name/voiceURI)
                    let v = voices.find(
                      vo =>
                        vo.lang &&
                        vo.lang.toLowerCase().startsWith(defaultLang.toLowerCase()) &&
                        (vo.name && /google/i.test(vo.name) || vo.voiceURI && /google/i.test(vo.voiceURI))
                    );
                    // Step 2: Native voice with language
                    if (!v) {
                      v = voices.find(
                        vo => vo.lang && vo.lang.toLowerCase().startsWith(defaultLang.toLowerCase())
                      );
                    }
                    // Step 3: Any available voice
                    if (!v && voices.length > 0) v = voices[0];
                    const ut = new window.SpeechSynthesisUtterance(word);
                    ut.lang = v?.lang || defaultLang;
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
            style={{ marginTop: 28, marginLeft: 5, fontFamily: 'Arial, sans-serif' }}
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
