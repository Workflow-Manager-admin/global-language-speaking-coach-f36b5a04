import React, { createContext, useContext, useState, useEffect } from "react";

// Helper: Example word pool for basic language; expand as needed.
const BASIC_WORDS = [
  "hello", "goodbye", "please", "thank", "you", "yes", "no", "sorry", "help", "friend",
  "water", "food", "bathroom", "where", "is", "my", "name", "what", "how", "much",
  "one", "two", "three", "love", "family", "school", "teacher", "student", "learn", "speak",
  "more", "again", "repeat", "slowly", "fast", "understand", "not", "can", "do", "like"
];

/**
 * Create levels, each with 10 words: new words and mix of reviewed words for spaced repetition.
 * Returns: Array of {level, words: [10 strings], ...}
 * Approach: Each new level introduces new words (in order), and mixes previous words for review.
 * Level test and practice phase flags are managed per user progress in localStorage.
 */
function createLevelData(wordList, wordsPerLevel = 10, reviewMix = 0.3) {
  const levels = [];
  let index = 0;
  let learnedWords = [];
  let level = 1;
  while (index < wordList.length) {
    // Select new words for this level
    const countNew = Math.min(wordsPerLevel - Math.floor(wordsPerLevel * reviewMix), wordList.length - index);
    const newWords = wordList.slice(index, index + countNew);
    // Add some review words (from learned so far, but not from this batch)
    const eligibleForReview = learnedWords.slice(0);
    let reviewWords = [];
    if (eligibleForReview.length > 0 && wordsPerLevel - newWords.length > 0) {
      for (let k = 0; k < wordsPerLevel - newWords.length; k++) {
        // Use random review or repeat first review
        const word = eligibleForReview.length === 0 ? "" : eligibleForReview[Math.floor(Math.random() * eligibleForReview.length)];
        reviewWords.push(word);
      }
    }
    // Assemble list for this level
    const wordSet = [...newWords, ...reviewWords].slice(0, wordsPerLevel);
    levels.push({
      level,
      words: wordSet,
      complete: false,
      practiceComplete: false,
      testScore: null // e.g. {score: %, passed: bool}
    });
    // Move index
    index += countNew;
    // Track what is learned
    learnedWords = learnedWords.concat(newWords);
    level++;
  }
  return levels;
}

// PUBLIC_INTERFACE
const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  // Levels state
  const [levels, setLevels] = useState(
    () => JSON.parse(localStorage.getItem("levels")) || createLevelData(BASIC_WORDS, 10)
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => JSON.parse(localStorage.getItem("selectedLanguage")) || null
  );

  // Level tracking for current user session
  useEffect(() => {
    localStorage.setItem("levels", JSON.stringify(levels));
  }, [levels]);
  useEffect(() => {
    localStorage.setItem("selectedLanguage", JSON.stringify(selectedLanguage));
  }, [selectedLanguage]);

  // Which level can user currently access? Progress gate: Only levels with all previous tests >= 75%
  const lastPassedLevel = levels.reduce((acc, l, idx) =>
    (l.testScore && l.testScore.passed) ? idx + 1 : acc, 0
  );
  const nextAvailableLevel = lastPassedLevel + 1; // 1-based

  // PUBLIC_INTERFACE
  function beginLevelPractice(levelNumber) {
    const idx = levels.findIndex(l => l.level === +levelNumber);
    if (idx >= 0 && !levels[idx].practiceComplete) {
      // Mark practice as started (could be extended to store timestamps, etc)
      setLevels(lvs => {
        const copy = [...lvs];
        copy[idx].practiceComplete = true;
        return copy;
      });
    }
  }

  // PUBLIC_INTERFACE
  function markLevelTestScore(levelNumber, score) {
    // "score" is percent, pass is >=75%
    const passed = score >= 75;
    setLevels(lvs => {
      const idx = lvs.findIndex(l => l.level === +levelNumber);
      if (idx === -1) return lvs;
      const copy = [...lvs];
      copy[idx].testScore = { score, passed };
      if (passed) copy[idx].complete = true;
      return copy;
    });
  }

  // Progress stats
  const highestUnlocked = Math.max(...levels.map((l, idx) => l.complete ? l.level : 1), 1);
  const totalLevels = levels.length;
  const completed = levels.filter(l => l.complete).length;
  const stats = {
    totalLevels,
    completed,
    level: highestUnlocked,
    progressPercent: Math.round((completed / totalLevels) * 100),
  };

  // Raw lessons for UI compatibility, but derived from new levels
  const lessons = levels.map(l => ({
    level: l.level,
    words: l.words,
    title: "Level " + l.level,
    description: "Practice the following set of words.",
    completed: l.practiceComplete,
    challenged: l.testScore !== null
  }));

  return (
    <ProgressContext.Provider
      value={{
        levels,
        lessons,
        stats,
        selectedLanguage,
        setSelectedLanguage,
        nextAvailableLevel,
        beginLevelPractice,
        markLevelTestScore
      }}>
      {children}
    </ProgressContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useProgress() {
  return useContext(ProgressContext);
}
