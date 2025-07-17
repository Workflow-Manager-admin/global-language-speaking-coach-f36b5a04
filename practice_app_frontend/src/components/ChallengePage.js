import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import AccuracySidebar from "./AccuracySidebar";
import "../App.css";

// PUBLIC_INTERFACE
function ChallengePage() {
  const { levelId } = useParams();
  const { lessons, completeChallenge } = useProgress();
  const lesson = lessons.find(l => String(l.level) === String(levelId));
  const navigate = useNavigate();

  const {
    transcript,
    listening,
    startListening,
    stopListening,
    supported
  } = useSpeechRecognition();

  const [result, setResult] = useState(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsUtterRef = useRef(null);

  // On mount, say the prompt
  React.useEffect(() => {
    if (lesson?.example && window.speechSynthesis) {
      const utt = new window.SpeechSynthesisUtterance(`Please say: ${lesson.example}`);
      utt.lang = "en-US";
      ttsUtterRef.current = utt;
      setTtsPlaying(true);
      utt.onend = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utt);
    }
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
    };
  }, [lesson]);

  const handlePronounceAgain = () => {
    if (window.speechSynthesis && lesson?.example) {
      try { window.speechSynthesis.cancel(); } catch { }
      const utt = new window.SpeechSynthesisUtterance(lesson.example);
      utt.lang = "en-US";
      window.speechSynthesis.speak(utt);
    }
  };

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  // AccuracySidebar calculates similarity, but for passing, we use threshold logic on submit
  const handleSubmit = () => {
    // Simple similarity threshold: pass if >75% similarity
    // Using same algorithm as in AccuracySidebar for consistency
    const sa = lesson.example.trim().toLowerCase();
    const sb = transcript.trim().toLowerCase();
    if (!sa || !sb) { setResult("fail"); return; }
    // Levenshtein distance, same logic as sidebar
    function lev(a, b) {
      const matrix = Array(b.length + 1).fill(null).map(() => []);
      for (let i = 0; i <= b.length; i++) { matrix[i][0] = i; }
      for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          const cost = a[j - 1] === b[i - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      const rawScore = matrix[b.length][a.length];
      const maxLen = Math.max(a.length, b.length);
      if (maxLen === 0) return 100;
      return Math.round(Math.max(0, 100 - (rawScore / maxLen) * 100));
    }
    const score = lev(sa, sb);
    if (score > 75) {
      setResult("pass");
      completeChallenge(lesson.level);
      // (optional) TTS success feedback
      if (window.speechSynthesis) {
        const utt = new window.SpeechSynthesisUtterance(
          "Excellent! You passed the challenge."
        );
        utt.lang = "en-US";
        window.speechSynthesis.speak(utt);
      }
    } else {
      setResult("fail");
      if (window.speechSynthesis) {
        const utt = new window.SpeechSynthesisUtterance(
          "Not quite there. Try saying the phrase again as clearly as you can."
        );
        utt.lang = "en-US";
        window.speechSynthesis.speak(utt);
      }
    }
  };

  return (
    <div style={{position: "relative", minHeight: 350}}>
      <div className="challenge-page">
        <h2>Speaking Challenge - Level {lesson.level}</h2>
        <div>
          <b>Prompt:</b> {lesson.example}
          <button
            onClick={handlePronounceAgain}
            style={{marginLeft: 10, fontSize: "0.90rem"}}
            title="Hear phrase"
          >🔊</button>
          {ttsPlaying && <span style={{marginLeft:7, color:"var(--primary-color)", fontWeight:400}}>Speaking...</span>}
        </div>
        <div className="user-challenge">
          <button
            className={listening ? "listening" : ""}
            onMouseDown={startListening}
            onMouseUp={stopListening}
          >
            {listening ? "Listening... (release to finish)" : "🎤 Hold to Record Answer"}
          </button>
          <div className="user-transcript">{transcript}</div>
        </div>
        <button className="btn btn-accent" disabled={!transcript || listening} onClick={handleSubmit}>
          Submit
        </button>
        {result === "pass" && (
          <div className="challenge-pass">
            ✅ Success! Try the next lesson.
            <button className="btn btn-primary" style={{marginTop:16}} onClick={() => navigate(`/lesson/${parseInt(lesson.level)+1}`)}>
              Next Lesson
            </button>
          </div>
        )}
        {result === "fail" && (
          <div className="challenge-fail" style={{color:"var(--primary-color)"}}>
            ❌ Not quite! Try speaking again using the expected words.
          </div>
        )}
      </div>
      <AccuracySidebar target={lesson.example} userInput={transcript} />
    </div>
  );
}
export default ChallengePage;
