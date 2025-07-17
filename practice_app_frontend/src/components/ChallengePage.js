import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
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

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  const handleSubmit = () => {
    // Simulate scoring: if transcript contains the keyword, pass.
    const keyword = lesson.example.split(" ")[0].toLowerCase();
    if (transcript.toLowerCase().includes(keyword)) {
      setResult("pass");
      completeChallenge(lesson.level);
    } else {
      setResult("fail");
    }
  };

  return (
    <div className="challenge-page">
      <h2>Speaking Challenge - Level {lesson.level}</h2>
      <div><b>Prompt:</b> {lesson.example}</div>
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
  );
}
export default ChallengePage;
