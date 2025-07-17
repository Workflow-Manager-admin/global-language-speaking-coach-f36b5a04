import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import AccuracySidebar from "./AccuracySidebar";
import "../App.css";

// PUBLIC_INTERFACE
function ChallengePage() {
  const { levelId } = useParams();
  const { levels, markLevelTestScore, nextAvailableLevel } = useProgress();
  const levelIdx = levels.findIndex(l => String(l.level) === String(levelId));
  const level = levels[levelIdx];
  const navigate = useNavigate();

  // For multi-word sequential challenge
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAttempts, setUserAttempts] = useState(Array((level?.words || []).length).fill(""));
  const [results, setResults] = useState(Array((level?.words || []).length).fill(null));
  const [showReview, setShowReview] = useState(false);
  const totalWords = level?.words.length || 0;

  const {
    transcript,
    listening,
    startListening,
    stopListening,
    supported
  } = useSpeechRecognition();

  const ttsUtterRef = useRef(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  if (!level) return <div>Level not found</div>;

  // Ignore test route if practice not done yet
  if (!level.practiceComplete)
    return (
      <div className="challenge-page">
        <h2>Level {level.level} Test Locked</h2>
        <p>Please complete the practice for this level before taking the test.</p>
      </div>
    );

  // Prevent user from accessing locked levels
  if (level.level > nextAvailableLevel)
    return (
      <div className="challenge-page">
        <h2>Level {level.level} Test is Locked</h2>
        <p>You need to pass Level {level.level - 1} before attempting this test.</p>
      </div>
    );

  // Handle TTS for current word (AI pronunciation)
  const handleSpeakPrompt = () => {
    const prompt = level.words[currentIdx];
    if (window.speechSynthesis && prompt) {
      try { window.speechSynthesis.cancel(); } catch { }
      // Use selected language if set
      let selectedLangObj =
        window.localStorage.getItem("selectedLanguage") &&
        JSON.parse(window.localStorage.getItem("selectedLanguage"));
      let defaultLang = (selectedLangObj && selectedLangObj.code) || "en";
      const voices = window.speechSynthesis.getVoices() || [];
      // Prefer Google-branded voice for language
      let v = voices.find(
        vo =>
          vo.lang &&
          vo.lang.toLowerCase().startsWith(defaultLang.toLowerCase()) &&
          (vo.name && /google/i.test(vo.name) || vo.voiceURI && /google/i.test(vo.voiceURI))
      );
      // Native fallback matching language
      if (!v) {
        v = voices.find(
          vo => vo.lang && vo.lang.toLowerCase().startsWith(defaultLang.toLowerCase())
        );
      }
      if (!v && voices.length > 0) v = voices[0];
      const utt = new window.SpeechSynthesisUtterance(prompt);
      utt.lang = v?.lang || defaultLang;
      utt.rate = 1;
      utt.pitch = 1.15;
      if (v) utt.voice = v;
      ttsUtterRef.current = utt;
      setTtsPlaying(true);
      utt.onend = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utt);
    }
  };

  // Calculate similarity function
  function calcScore(expected, userSpoken) {
    if (!expected || !userSpoken) return 0;
    let a = expected.trim().toLowerCase(), b = userSpoken.trim().toLowerCase();
    // Levenshtein, same as sidebar
    const sa = a, sb = b;
    const matrix = Array(sb.length + 1).fill(null).map(() => []);
    for (let i = 0; i <= sb.length; i++) { matrix[i][0] = i; }
    for (let j = 0; j <= sa.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= sb.length; i++) {
      for (let j = 1; j <= sa.length; j++) {
        const cost = sa[j - 1] === sb[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost
        );
      }
    }
    const rawScore = matrix[sb.length][sa.length];
    const maxLen = Math.max(sa.length, sb.length);
    if (maxLen === 0) return 100;
    return Math.round(Math.max(0, 100 - (rawScore / maxLen) * 100));
  }

  // On submit for this word
  const handleWordSubmit = () => {
    const prompt = level.words[currentIdx];
    const attempt = transcript;
    const score = calcScore(prompt, attempt);
    setUserAttempts(atts => {
      const copy = [...atts];
      copy[currentIdx] = attempt;
      return copy;
    });
    setResults(rs => {
      const rr = [...rs];
      rr[currentIdx] = score;
      return rr;
    });
  };

  // Proceed to next or review
  const handleNextWord = () => {
    if (currentIdx < totalWords - 1) {
      setCurrentIdx(idx => idx + 1);
    } else {
      setShowReview(true);
    }
  };

  // On submitting test after all words attempted
  const handleTestSubmit = () => {
    // Compute average (as percentage of words ≥ 75%), require ≥ 75%
    const numPassed = results.filter(s => s !== null && s >= 75).length;
    const percent = Math.round((numPassed / totalWords) * 100);
    markLevelTestScore(level.level, percent);
    setShowReview("submit"); // Used as a flag to show pass/fail summary
  };

  // Render word test/question step-by-step
  if (!showReview)
    return (
      <div style={{ position: "relative", minHeight: 380 }}>
        <div className="challenge-page">
          <h2>Level {level.level} Test</h2>
          <div>
            <b>Prompt {currentIdx + 1} of {totalWords}:</b> <span style={{ fontWeight: 600 }}>{level.words[currentIdx]}</span>
            <button
              onClick={handleSpeakPrompt}
              style={{ marginLeft: 10, fontSize: "0.95rem" }}
              title="Hear word"
            >🔊</button>
            {ttsPlaying && <span style={{ marginLeft: 7, color: "var(--primary-color)", fontWeight: 400 }}>Speaking...</span>}
          </div>
          <div className="user-challenge">
            <button
              className={listening ? "listening" : ""}
              onMouseDown={startListening}
              onMouseUp={stopListening}
            >
              {listening ? "Listening... (release to finish)" : "🎤 Hold to Record"}
            </button>
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
            <React.Fragment>
              <AccuracySidebar target={level.words[currentIdx]} userInput={userAttempts[currentIdx]} score={results[currentIdx]} />
              <div style={{ color: results[currentIdx] >= 75 ? "var(--accent-color)" : "var(--primary-color)", marginTop: 16, fontWeight: 600 }}>
                {results[currentIdx] >= 75 ? "Correct!" : "Keep practicing!"}
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 14 }}
                onClick={handleNextWord}
              >
                {currentIdx === totalWords - 1 ? "Finish Test" : "Next Word"}
              </button>
            </React.Fragment>
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
          {level.words.map((w, i) => (
            <li key={w + i} style={{
              color: results[i] >= 75 ? "var(--accent-color)" : "var(--primary-color)",
              padding: "5px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <b>{i + 1}.</b> <span style={{ minWidth: 120 }}>{w}</span>
              <span style={{
                fontStyle: "italic",
                marginLeft: 7,
                minWidth: 120,
                color: "#333"
              }}>
                {userAttempts[i]}
              </span>
              <span>
                {results[i] !== null ? `${results[i]}%` : ""}
                {results[i] >= 75 ? " ✔️" : " ❌"}
              </span>
            </li>
          ))}
        </ul>
        <button className="btn btn-accent" style={{ marginTop: 24 }} onClick={handleTestSubmit}>
          Submit & See Result
        </button>
      </div>
    );

  // Final test result after record
  if (showReview === "submit") {
    // Find the percent correct
    const numPassed = results && results.length > 0 ? results.filter(s => s !== null && s >= 75).length : 0;
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
          {passed ? `✅ Congratulations! You passed with ${percent}% accuracy.` : `❌ Unfortunately, you got only ${percent}%. Try again.`}
        </div>
        <div style={{ marginTop: 28 }}>
          {passed ? (
            <button className="btn btn-primary" onClick={() => navigate(`/lesson/${level.level + 1}`)}>
              Next Level
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
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
