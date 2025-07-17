import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
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

  const handleSend = () => {
    setUserMessage(transcript);
    // In real app, send transcript to AI and get feedback.
    // Simulated AI response: for demo.
    setTimeout(() => {
      alert("AI feedback: Well done! Try to use a more complete sentence next time.");
    }, 400);
  };

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <div className="conversation-page">
      <h2>AI-Powered Voice Practice</h2>
      <div className="conversation-box">
        <div className="ai-message">{aiMessage}</div>
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
  );
}
export default ConversationPage;
