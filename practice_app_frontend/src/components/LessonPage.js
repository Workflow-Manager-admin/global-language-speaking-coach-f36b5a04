import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import AccuracySidebar from "./AccuracySidebar";
import "../App.css";

// PUBLIC_INTERFACE
function LessonPage() {
  const { levelId } = useParams();
  const { lessons, completeLesson } = useProgress();
  const lesson = lessons.find(l => String(l.level) === String(levelId));
  const navigate = useNavigate();

  // Track if the lesson example has been pronounced by AI
  const [pronounced, setPronounced] = useState(false);
  const ttsUtterRef = useRef(null);

  useEffect(() => {
    // Only play when lesson is valid and not already pronounced
    if (lesson?.example && !pronounced && window.speechSynthesis) {
      const utter = new window.SpeechSynthesisUtterance(lesson.example);
      utter.lang = "en-US"; // Could adapt per language
      ttsUtterRef.current = utter;
      utter.onend = () => setPronounced(true);
      window.speechSynthesis.speak(utter);
    }
    return () => {
      // Clean up any ongoing utterance if component unmounts
      try { window.speechSynthesis.cancel(); } catch { }
    }
    // eslint-disable-next-line
  }, [lesson, pronounced]);

  if (!lesson) return <div>Lesson not found</div>;

  const handleComplete = () => {
    completeLesson(lesson.level);
    navigate(`/conversation/${lesson.level}`);
  };

  // Render lesson and SideBar (score is 0, no user input here, but still shows 100%)
  return (
    <div style={{position: "relative", minHeight: 330}}>
      <div className="lesson-page">
        <h2>Lesson {lesson.level}: {lesson.title}</h2>
        <p>{lesson.description}</p>
        <div className="lesson-content">
          <div className="lesson-example">
            <b>Example:</b> {lesson.example}
            <button
              className="btn btn-accent"
              style={{marginLeft: 12, fontSize: "0.98rem", padding: "3px 12px"}}
              onClick={()=>{
                // Re-pronounce the phrase
                if (window.speechSynthesis) {
                  try { window.speechSynthesis.cancel(); } catch { }
                  const ut = new window.SpeechSynthesisUtterance(lesson.example);
                  ut.lang = "en-US";
                  window.speechSynthesis.speak(ut);
                }
              }}
              title="Hear pronunciation again"
            >🔊 Hear Again</button>
          </div>
        </div>
        <button className="btn btn-accent" onClick={handleComplete}>
          Start Practice Conversation!
        </button>
        {!pronounced && (
          <div style={{color:"var(--primary-color)", marginTop:14, fontSize:14}}>
            AI is saying the phrase for you...
          </div>
        )}
      </div>
      <AccuracySidebar target={lesson.example} userInput={""} score={100} />
    </div>
  );
}
export default LessonPage;
