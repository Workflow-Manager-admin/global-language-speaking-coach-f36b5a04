import React, { createContext, useContext, useState, useEffect } from "react";

// Demo lessons/challenges for levels 1–3
const defaultLessons = [
  { level: 1, title: "Greetings", description: "Practice basic greetings in your chosen language.", example: "Hello! How are you?", completed: false, challenged: false },
  { level: 2, title: "Ordering Food", description: "Learn how to order food and drinks.", example: "I'd like a coffee, please.", completed: false, challenged: false },
  { level: 3, title: "Asking for Directions", description: "Ask for help to find places.", example: "Where is the train station?", completed: false, challenged: false },
];

// PUBLIC_INTERFACE
const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => JSON.parse(localStorage.getItem("selectedLanguage")) || null
  );
  const [lessons, setLessons] = useState(
    () => JSON.parse(localStorage.getItem("lessons")) || defaultLessons
  );

  useEffect(() => {
    localStorage.setItem("selectedLanguage", JSON.stringify(selectedLanguage));
  }, [selectedLanguage]);
  useEffect(() => {
    localStorage.setItem("lessons", JSON.stringify(lessons));
  }, [lessons]);

  // PUBLIC_INTERFACE
  function completeLesson(level) {
    setLessons(ls =>
      ls.map(l => l.level === level ? { ...l, completed: true } : l)
    );
  }

  // PUBLIC_INTERFACE
  function completeChallenge(level) {
    setLessons(ls =>
      ls.map(l => l.level === level ? { ...l, challenged: true } : l)
    );
  }

  // Progress stats
  const total = lessons.length;
  const completed = lessons.filter(l => l.completed).length;
  const challenged = lessons.filter(l => l.challenged).length;
  const level = completed + 1 > total ? total : completed + 1;
  const progressPercent = Math.round((completed / total) * 100);

  const stats = {
    total,
    lessonsCompleted: completed,
    challengesCompleted: challenged,
    level,
    progressPercent,
  };

  return (
    <ProgressContext.Provider
      value={{
        lessons,
        completeLesson,
        completeChallenge,
        stats,
        selectedLanguage,
        setSelectedLanguage,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useProgress() {
  return useContext(ProgressContext);
}
