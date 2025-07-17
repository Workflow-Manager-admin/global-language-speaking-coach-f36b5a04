import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import AccuracySidebar from "./AccuracySidebar";
import "../App.css";

// PUBLIC_INTERFACE
function ConversationPage() {
  const { levelId } = useParams();
  const { lessons } = useProgress();
  const navigate = useNavigate();

  const lesson = lessons.find(l => String(l.level) === String(levelId));
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    supported
  } = useSpeechRecognition();

  const [aiMessage] = useState(`(AI) Let's practice: "${lesson?.example || ""}" Say your answer!`);
  const [userMessage, setUserMessage] = useState("");
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsUtterRef = useRef(null);

  // Speak the AI message (e.g., on load and after user submits)
  useEffect(() => {
    if (aiMessage && window.speechSynthesis && lesson?.example) {
      const utt = new window.SpeechSynthesisUtterance(
        `Let's practice. ${lesson.example}. Please say your answer!`
      );
      utt.lang = "en-US";
      ttsUtterRef.current = utt;
      setTtsPlaying(true);
      utt.onend = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utt);
    }
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
    };
    // eslint-disable-next-line
  }, [aiMessage, lesson]);

  // Allow AI to repeat the phrase/pronounce on demand
  const handlePronounceAgain = () => {
    if (window.speechSynthesis && lesson?.example) {
      try { window.speechSynthesis.cancel(); } catch { }
      const utt = new window.SpeechSynthesisUtterance(lesson.example);
      utt.lang = "en-US";
      window.speechSynthesis.speak(utt);
    }
  };

  // When user clicks Submit, the AI "responds"
  const handleSend = () => {
    setUserMessage(transcript);
    setTimeout(() => {
      // Simulated spoken feedback
      if (window.speechSynthesis) {
        const utt = new window.SpeechSynthesisUtterance(
          "Well done! Try to use a more complete sentence next time."
        );
        utt.lang = "en-US";
        window.speechSynthesis.speak(utt);
      }
      alert("AI feedback: Well done! Try to use a more complete sentence next time.");
    }, 400);
  };

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <div style={{position: "relative", minHeight: 430}}>
      <div className="conversation-page">
        <h2>AI-Powered Voice Practice</h2>
        <div className="conversation-box">
          <div className="ai-message">
            {aiMessage}
            <button
              onClick={handlePronounceAgain}
              style={{marginLeft: 10, fontSize: "0.90rem"}}
              title="Hear pronunciation again"
            >🔊</button>
            {ttsPlaying && <span style={{marginLeft:10, color:"var(--primary-color)", fontWeight:400}}>Speaking...</span>}
          </div>
          <div className="user-message">
            <button
              className={listening ? "listening" : ""}
              onMouseDown={startListening}
              onMouseUp={stopListening}
            >
              {listening ? "Listening... (release to finish)" : "🎙️ Hold to Speak"}
            </button>
            <div className="user-transcript">{transcript}</div>
          </div>
          <button
            className="btn btn-accent"
            disabled={!transcript || listening}
            onClick={handleSend}
          >
            Submit
          </button>
        </div>
        <button className="btn btn-primary" style={{marginTop:24}}
          onClick={() => navigate(`/challenge/${lesson.level}`)}
        >
          Take Speaking Challenge
        </button>
      </div>
      <AccuracySidebar target={lesson.example} userInput={transcript} />
    </div>
  );
}
export default ConversationPage;
