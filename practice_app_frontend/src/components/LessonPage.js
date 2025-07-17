import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
function LessonPage() {
  const { levelId } = useParams();
  const { lessons, completeLesson } = useProgress();
  const lesson = lessons.find(l => String(l.level) === String(levelId));
  const navigate = useNavigate();

  if (!lesson) return <div>Lesson not found</div>;

  const handleComplete = () => {
    completeLesson(lesson.level);
    navigate(`/conversation/${lesson.level}`);
  };

  return (
    <div className="lesson-page">
      <h2>Lesson {lesson.level}: {lesson.title}</h2>
      <p>{lesson.description}</p>
      <div className="lesson-content">
        {/* Placeholder: This is where the lesson practice/prompts would be displayed */}
        <div className="lesson-example"><b>Example:</b> {lesson.example}</div>
      </div>
      <button className="btn btn-accent" onClick={handleComplete}>
        Start Practice Conversation!
      </button>
    </div>
  );
}
export default LessonPage;
