import React, { createContext, useContext, useState, useEffect } from "react";

// --- Badge Milestone Settings ---
const BADGES = [
  { id: "first_lesson", label: "🎈 First Lesson", description: "Complete your first lesson." },
  { id: "first_test", label: "🚩 First Test", description: "Complete your first challenge test." },
  { id: "daily_streak_3", label: "🔥 3-Day Streak", description: "Practice 3 days in a row." },
  { id: "daily_streak_7", label: "🔥 7-Day Streak", description: "Practice 7 days in a row." },
  { id: "xp_100", label: "⭐ XP 100+", description: "Earn 100 XP." },
  { id: "xp_500", label: "🌟 XP 500+", description: "Earn 500 XP." },
  { id: "all_tests_complete", label: "🏆 All Tests", description: "Complete all available tests." },
];

// PUBLIC_INTERFACE
const GamificationContext = createContext();

function getInitialGamification() {
  const stored = localStorage.getItem("gamificationData");
  if (stored) return JSON.parse(stored);
  return {
    xp: 0,
    dailyStreak: 0,
    lastPracticeDate: null,
    badges: [],
  };
}

// PUBLIC_INTERFACE
export function GamificationProvider({ children }) {
  const [gamification, setGamification] = useState(getInitialGamification);

  useEffect(() => {
    localStorage.setItem("gamificationData", JSON.stringify(gamification));
  }, [gamification]);

  // --- Progress logic ---

  // PUBLIC_INTERFACE
  // Call this whenever a lesson, test, or practice is completed
  function awardXP(amount, source = "generic") {
    setGamification(prev => ({
      ...prev,
      xp: prev.xp + amount
    }));
  }

  // PUBLIC_INTERFACE
  // Call once per day a user practices/finishes anything meaningful
  function recordPracticeEvent() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    setGamification(prev => {
      const prevDate = prev.lastPracticeDate;
      let newStreak = 1;
      if (prevDate) {
        const d1 = new Date(prevDate);
        const d2 = new Date(today);
        const diffDays = Math.floor((d2 - d1) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          newStreak = prev.dailyStreak + 1;
        } else if (diffDays === 0) {
          // Practiced again today, keep streak
          newStreak = prev.dailyStreak;
        } else {
          newStreak = 1;
        }
      }
      return {
        ...prev,
        lastPracticeDate: today,
        dailyStreak: newStreak
      };
    });
  }

  // --- Badge management ---

  // PUBLIC_INTERFACE
  function unlockBadge(badgeId) {
    setGamification(prev => {
      if (prev.badges.includes(badgeId)) return prev; // already unlocked
      return {
        ...prev,
        badges: [...prev.badges, badgeId]
      };
    });
  }

  // Helper: Check/unlock badges based on current stats
  useEffect(() => {
    for (const badge of BADGES) {
      switch (badge.id) {
        case "xp_100":
          if (gamification.xp >= 100) unlockBadge("xp_100");
          break;
        case "xp_500":
          if (gamification.xp >= 500) unlockBadge("xp_500");
          break;
        case "daily_streak_3":
          if (gamification.dailyStreak >= 3) unlockBadge("daily_streak_3");
          break;
        case "daily_streak_7":
          if (gamification.dailyStreak >= 7) unlockBadge("daily_streak_7");
          break;
        default:
          // other badges triggered by actions
          break;
      }
    }
  }, [gamification.xp, gamification.dailyStreak]);

  // PUBLIC_INTERFACE
  function resetGamification() {
    setGamification({
      xp: 0,
      dailyStreak: 0,
      lastPracticeDate: null,
      badges: [],
    });
  }

  return (
    <GamificationContext.Provider value={{
      ...gamification,
      awardXP,
      recordPracticeEvent,
      unlockBadge,
      resetGamification,
      BADGES,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useGamification() {
  return useContext(GamificationContext);
}

