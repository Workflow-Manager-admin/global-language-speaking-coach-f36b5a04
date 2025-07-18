import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import AccuracySidebar from "./AccuracySidebar";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * ChallengePage for the level test:
 * Prompts with the word/phrase in the user's base language,
 * user must provide the translation in the target (learning) language.
 */
function ChallengePage() {
  const { levelId } = useParams();
  const {
    levels,
    markLevelTestScore,
    nextAvailableLevel,
    selectedLanguage,
    baseLanguage,
  } = useProgress();

  const levelIdx = levels.findIndex((l) => String(l.level) === String(levelId));
  const level = levels[levelIdx];
  const navigate = useNavigate();

  // Speech recognition for input (should be in target/learning language)
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

  // For multi-word sequential challenge
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAttempts, setUserAttempts] = useState(Array(level?.words?.length || 0).fill(""));
  const [results, setResults] = useState(Array(level?.words?.length || 0).fill(null));
  const [showReview, setShowReview] = useState(false);
  const totalWords = level?.words?.length || 0;

  const {
    transcript,
    listening,
    startListening,
    stopListening,
    supported
  } = useSpeechRecognition(speechLang);

  const ttsUtterRef = useRef(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  if (!level) return <div>Level not found</div>;

  // Prevent if practice incomplete
  if (!level.practiceComplete)
    return (
      <div className="challenge-page">
        <h2>Level {level.level} Test Locked</h2>
        <p>Please complete the practice for this level before taking the test.</p>
      </div>
    );

  // Prevent if level locked
  if (level.level > nextAvailableLevel)
    return (
      <div className="challenge-page">
        <h2>Level {level.level} Test is Locked</h2>
        <p>You need to pass Level {level.level - 1} before attempting this test.</p>
      </div>
    );

  // Speak the prompt in the base language (not the learning language)
  const handleSpeakPrompt = () => {
    const promptEntry = level.words[currentIdx];
    if (!promptEntry) return;
    const baseLangCode = baseLanguage?.code || "en";
    const bcp47BaseMap = {
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
    const baseSpeechLang = bcp47BaseMap[baseLangCode] || baseLangCode;
    if (window.speechSynthesis && promptEntry.translation) {
      try { window.speechSynthesis.cancel(); } catch {}
      const voices = window.speechSynthesis.getVoices() || [];
      let v =
        voices.find(
          vo =>
            vo.lang &&
            vo.lang.toLowerCase().startsWith(baseLangCode.toLowerCase()) &&
            ((vo.name && /google/i.test(vo.name)) ||
              (vo.voiceURI && /google/i.test(vo.voiceURI)))
        ) ||
        voices.find(
          vo =>
            vo.lang &&
            (vo.lang.toLowerCase().startsWith(baseLangCode.toLowerCase()) ||
              vo.lang.toLowerCase() === baseSpeechLang.toLowerCase())
        );
      if (!v && voices.length > 0) v = voices[0];
      const utt = new window.SpeechSynthesisUtterance(promptEntry.translation);
      utt.lang = v?.lang || baseSpeechLang;
      utt.rate = 1;
      utt.pitch = 1.15;
      if (v) utt.voice = v;
      ttsUtterRef.current = utt;
      setTtsPlaying(true);
      utt.onend = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utt);
    }
  };

  // Calculate similarity between answer and user's attempt
  function calcScore(expected, userSpoken) {
    if (!expected || !userSpoken) return 0;
    let exp = expected;
    if (typeof exp === "object" && exp !== null) {
      if (typeof exp.word === "string") exp = exp.word;
      else if (typeof exp.translation === "string") exp = exp.translation;
      else exp = JSON.stringify(exp);
    }
    if (typeof exp !== "string") exp = String(exp ?? "");
    let usr = userSpoken;
    if (typeof usr !== "string") usr = String(usr ?? "");
    let a = exp.trim().toLowerCase(), b = usr.trim().toLowerCase();

    // Levenshtein
    const sa = a, sb = b;
    const matrix = Array(sb.length + 1).fill(null).map(() => []);
    for (let i = 0; i <= sb.length; i++) { matrix[i][0] = i; }
    for (let j = 0; j <= sa.length; j++) { matrix[0][j] = j; }
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
    return Math.round(Math.max(0, 100 - (rawScore / maxLen) * 100));
  }

  // User submits an attempt
  const handleWordSubmit = () => {
    const expected = level.words[currentIdx]?.word; // correct answer in target language
    const attempt = transcript;
    const score = calcScore(expected, attempt);
    setUserAttempts((atts) => {
      const copy = [...atts];
      copy[currentIdx] = attempt;
      return copy;
    });
    setResults((rs) => {
      const rr = [...rs];
      rr[currentIdx] = score;
      return rr;
    });
  };

  const handleNextWord = () => {
    if (currentIdx < totalWords - 1) {
      setCurrentIdx((idx) => idx + 1);
    } else {
      setShowReview(true);
    }
  };

  const handleTestSubmit = () => {
    const numPassed = results.filter((s) => s !== null && s >= 75).length;
    const percent = Math.round((numPassed / totalWords) * 100);
    markLevelTestScore(level.level, percent);
    setShowReview("submit");
  };

  // Render word test/question step-by-step
  if (!showReview)
    return (
      <div style={{ position: "relative", minHeight: 380 }}>
        <div className="challenge-page">
          <h2>Level {level.level} Test</h2>
          <div>
            <b>Prompt {currentIdx + 1} of {totalWords}:</b>{" "}
            <span style={{ fontWeight: 600, fontSize: "1.08em" }}>
              {level.words[currentIdx]?.translation}
            </span>
            <span style={{
              color: "var(--secondary-color)",
              fontStyle: "italic",
              fontSize: "1em",
              marginLeft: 6
            }}>
              ({baseLanguage?.label || "Base Language"})
            </span>
            <button
              onClick={handleSpeakPrompt}
              style={{ marginLeft: 10, fontSize: "0.95rem" }}
              title={`Hear "${level.words[currentIdx]?.translation}" in base language`}
            >🔊</button>
            {ttsPlaying && (
              <span style={{
                marginLeft: 7,
                color: "var(--primary-color)",
                fontWeight: 400
              }}>Speaking...</span>
            )}
          </div>
          <div className="user-challenge">
            <button
              className={listening ? "listening" : ""}
              onMouseDown={startListening}
              onMouseUp={stopListening}
            >
              {listening ? "Listening... (release to finish)" : "🎤 Hold to Record"}
            </button>
            <div style={{
              fontSize: '1.1em',
              fontWeight: 500,
              color: "var(--primary-color)"
            }}>
              <span>
                Say or type the translation in <b>{selectedLanguage?.label || "target language"}</b>:
              </span>
            </div>
            <div className="user-transcript">{transcript}</div>
          </div>
          <button
            className="btn btn-accent"
            disabled={!transcript || listening}
            onClick={handleWordSubmit}
          >
            Submit Attempt
          </button>
          {!!userAttempts[currentIdx] && results[currentIdx] !== null && (
            <>
              <AccuracySidebar
                target={level.words[currentIdx]?.word}
                userInput={userAttempts[currentIdx]}
                score={results[currentIdx]}
              />
              <div style={{
                color: results[currentIdx] >= 75 ? "var(--accent-color)" : "var(--primary-color)",
                marginTop: 16,
                fontWeight: 600
              }}>
                {results[currentIdx] >= 75 ? "Correct!" : "Keep practicing!"}
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 14 }}
                onClick={handleNextWord}
              >
                {currentIdx === totalWords - 1 ? "Finish Test" : "Next Word"}
              </button>
            </>
          )}
        </div>
      </div>
    );

  // Review summary page after all attempts
  if (showReview === true)
    return (
      <div className="challenge-page">
        <h2>Level {level.level} Test Review</h2>
        <ul style={{ fontSize: "1.1rem", listStyle: "none", padding: 0 }}>
          {level.words.map((entry, i) => (
            <li key={(entry.translation ?? "") + "-" + i} style={{
              color: results[i] >= 75 ? "var(--accent-color)" : "var(--primary-color)",
              padding: "5px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <b>{i + 1}.</b>
              <span style={{ minWidth: 105, fontWeight: 600 }}>{entry.translation}</span>
              <span style={{
                color: "#666",
                minWidth: 100,
                marginLeft: 6,
                fontStyle: "italic",
                fontWeight: 400
              }}>
                ({baseLanguage?.label || "Base Language"})
              </span>
              <span style={{
                fontStyle: "italic",
                marginLeft: 7,
                minWidth: 120,
                color: "#333"
              }}>
                {userAttempts[i]}
              </span>
              <span style={{
                marginLeft: "10px",
                color: "#999",
                fontWeight: 400,
                fontSize: "1em"
              }}>
                <span>Correct: <b>{entry.word}</b></span>
              </span>
              <span>
                {results[i] !== null ? `${results[i]}%` : ""}
                {results[i] >= 75 ? " ✔️" : " ❌"}
              </span>
            </li>
          ))}
        </ul>
        <button
          className="btn btn-accent"
          style={{ marginTop: 24 }}
          onClick={handleTestSubmit}
        >
          Submit & See Result
        </button>
      </div>
    );

  // Final test result after record
  if (showReview === "submit") {
    const numPassed = results && results.length > 0 ? results.filter((s) => s !== null && s >= 75).length : 0;
    const percent = Math.round((numPassed / totalWords) * 100);
    const passed = percent >= 75;

    return (
      <div className="challenge-page">
        <h2>Level {level.level} Test Result</h2>
        <div style={{
          fontSize: "1.4rem",
          marginTop: 20,
          color: passed ? "var(--accent-color)" : "var(--primary-color)",
          fontWeight: 700
        }}>
          {passed
            ? `✅ Congratulations! You passed with ${percent}% accuracy.`
            : `❌ Unfortunately, you got only ${percent}%. Try again.`}
        </div>
        <div style={{ marginTop: 28 }}>
          {passed ? (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/lesson/${level.level + 1}`)}
            >
              Next Level
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry Level Test
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default ChallengePage;
