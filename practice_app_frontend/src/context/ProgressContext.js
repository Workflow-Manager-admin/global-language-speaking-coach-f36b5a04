import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Vocabulary: actual translations for each supported language, using
 * human-translated core words/phrases. Per language code, each array aligns positions.
 */
const LANGUAGE_VOCAB = {
  en: [
    "hello", "goodbye", "please", "thank you", "yes", "no", "sorry", "help", "friend", "water",
    "food", "bathroom", "where", "is", "my", "name", "what", "how", "much", "one",
    "two", "three", "love", "family", "school", "teacher", "student", "learn", "speak",
    "more", "again", "repeat", "slowly", "fast", "understand", "not", "can", "do", "like"
  ],
  es: [
    "hola", "adiós", "por favor", "gracias", "sí", "no", "lo siento", "ayuda", "amigo", "agua",
    "comida", "baño", "dónde", "es", "mi", "nombre", "qué", "cómo", "cuánto", "uno",
    "dos", "tres", "amor", "familia", "escuela", "maestro", "estudiante", "aprender", "hablar",
    "más", "otra vez", "repetir", "despacio", "rápido", "entender", "no", "puede", "hacer", "gustar"
  ],
  fr: [
    "bonjour", "au revoir", "s'il vous plaît", "merci", "oui", "non", "désolé", "aide", "ami", "eau",
    "nourriture", "toilettes", "où", "est", "mon", "nom", "quoi", "comment", "combien", "un",
    "deux", "trois", "amour", "famille", "école", "professeur", "étudiant", "apprendre", "parler",
    "plus", "encore", "répéter", "lentement", "vite", "comprendre", "pas", "pouvoir", "faire", "aimer"
  ],
  de: [
    "hallo", "auf Wiedersehen", "bitte", "danke", "ja", "nein", "entschuldigung", "hilfe", "freund", "wasser",
    "essen", "badezimmer", "wo", "ist", "mein", "name", "was", "wie", "wie viel", "eins",
    "zwei", "drei", "liebe", "familie", "schule", "lehrer", "schüler", "lernen", "sprechen",
    "mehr", "wieder", "wiederholen", "langsam", "schnell", "verstehen", "nicht", "können", "machen", "mögen"
  ],
  zh: [
    "你好", "再见", "请", "谢谢", "是", "不是", "对不起", "帮助", "朋友", "水",
    "食物", "洗手间", "哪里", "是", "我的", "名字", "什么", "怎么", "多少", "一",
    "二", "三", "爱", "家庭", "学校", "老师", "学生", "学习", "说",
    "更多", "再一次", "重复", "慢", "快", "理解", "不是", "能", "做", "喜欢"
  ],
  ja: [
    "こんにちは", "さようなら", "お願いします", "ありがとう", "はい", "いいえ", "ごめんなさい", "助けて", "友達", "水",
    "食べ物", "トイレ", "どこ", "です", "私の", "名前", "何", "どう", "いくら", "一",
    "二", "三", "愛", "家族", "学校", "先生", "学生", "学ぶ", "話す",
    "もっと", "もう一度", "繰り返す", "ゆっくり", "速く", "理解する", "ない", "できる", "する", "好き"
  ],
  ar: [
    "مرحبا", "وداعا", "من فضلك", "شكرا", "نعم", "لا", "آسف", "مساعدة", "صديق", "ماء",
    "طعام", "حمام", "أين", "هو", "لي", "اسم", "ماذا", "كيف", "كم", "واحد",
    "اثنان", "ثلاثة", "حب", "عائلة", "مدرسة", "معلم", "طالب", "يتعلم", "يتكلم",
    "أكثر", "مرة أخرى", "كرر", "ببطء", "بسرعة", "يفهم", "ليس", "يمكن", "يفعل", "يحب"
  ],
  ru: [
    "привет", "до свидания", "пожалуйста", "спасибо", "да", "нет", "извини", "помощь", "друг", "вода",
    "еда", "ванная", "где", "есть", "мой", "имя", "что", "как", "сколько", "один",
    "два", "три", "любовь", "семья", "школа", "учитель", "студент", "учиться", "говорить",
    "ещё", "опять", "повторить", "медленно", "быстро", "понимать", "не", "мочь", "делать", "нравиться"
  ],
  ko: [
    "안녕하세요", "안녕히 가세요", "제발", "감사합니다", "네", "아니요", "미안합니다", "도와주세요", "친구", "물",
    "음식", "화장실", "어디", "이다", "나의", "이름", "무엇", "어떻게", "얼마", "하나",
    "둘", "셋", "사랑", "가족", "학교", "선생님", "학생", "배우다", "말하다",
    "더", "다시", "반복하다", "천천히", "빠르게", "이해하다", "아니다", "할 수 있다", "하다", "좋아하다"
  ],
  pt: [
    "olá", "adeus", "por favor", "obrigado", "sim", "não", "desculpe", "ajuda", "amigo", "água",
    "comida", "banheiro", "onde", "é", "meu", "nome", "o que", "como", "quanto", "um",
    "dois", "três", "amor", "família", "escola", "professor", "aluno", "aprender", "falar",
    "mais", "de novo", "repetir", "devagar", "rápido", "entender", "não", "poder", "fazer", "gostar"
  ],
};

/**
 * Create levels from the relevant translated word list for the current language.
 * Each level introduces new words (in order), and mixes previous words for review (spaced repetition).
 * Real translation is used for each word in the target language.
 */
function createLevelDataForLanguage(languageCode, wordsPerLevel = 10, reviewMix = 0.3) {
  // Default to English if unknown code
  const wordList = LANGUAGE_VOCAB[languageCode] || LANGUAGE_VOCAB["en"];
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
    const wordSet = [...newWords, ...reviewWords].slice(0, wordsPerLevel);
    levels.push({
      level,
      words: wordSet,
      complete: false,
      practiceComplete: false,
      testScore: null // e.g. {score: %, passed: bool}
    });
    index += countNew;
    learnedWords = learnedWords.concat(newWords);
    level++;
  }
  return levels;
}

// PUBLIC_INTERFACE
const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  // Each language has its own levels/progress and settings in localStorage, keyed by language.
  const defaultLanguage = JSON.parse(localStorage.getItem("selectedLanguage")) || { code: "en", label: "English" };
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

  // Initial levels loaded for selected language; fallback to English if not set.
  const [levels, setLevels] = useState(() => {
    const key = selectedLanguage ? `levels_${selectedLanguage.code}` : "levels_en";
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
    return createLevelDataForLanguage(selectedLanguage?.code || "en", 10);
  });

  // When levels or language changes, update the correct localStorage keys
  useEffect(() => {
    const key = selectedLanguage ? `levels_${selectedLanguage.code}` : "levels_en";
    localStorage.setItem(key, JSON.stringify(levels));
  }, [levels, selectedLanguage]);
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

  // PUBLIC_INTERFACE
  // When the user selects a new language, also update levels accordingly
  function handleSetSelectedLanguage(langObj) {
    setSelectedLanguage(langObj);
    // Initialize new levels for that language (or load from localStorage if exists)
    const key = langObj ? `levels_${langObj.code}` : "levels_en";
    const cached = localStorage.getItem(key);
    if (cached) {
      setLevels(JSON.parse(cached));
    } else {
      setLevels(createLevelDataForLanguage(langObj.code, 10));
    }
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
        setSelectedLanguage: handleSetSelectedLanguage,
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
