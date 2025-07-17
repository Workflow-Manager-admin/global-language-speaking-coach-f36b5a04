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
 * Create levels from the relevant translated word list for the current language,
 * aligned with the base language (so each word index is a translation pair).
 * Returns each lesson as an array of {word, translation}.
 */
function createLevelDataForLanguageWithTranslations(targetLanguageCode, baseLanguageCode, wordsPerLevel = 10, reviewMix = 0.3) {
  // Fallback to English if needed
  const targetWords = LANGUAGE_VOCAB[targetLanguageCode] || LANGUAGE_VOCAB["en"];
  const baseWords = LANGUAGE_VOCAB[baseLanguageCode] || LANGUAGE_VOCAB["en"];
  // Both lists are aligned by index
  const levels = [];
  let index = 0;
  let learnedIndices = [];
  let level = 1;
  while (index < targetWords.length) {
    // New words
    const countNew = Math.min(
      wordsPerLevel - Math.floor(wordsPerLevel * reviewMix),
      targetWords.length - index
    );
    const newIndices = [];
    for (let i = 0; i < countNew; i++) newIndices.push(index + i);

    // Eligible for review: indices of previous learned
    const eligibleReview = learnedIndices.slice(0);
    let reviewIndices = [];
    if (eligibleReview.length > 0 && wordsPerLevel - newIndices.length > 0) {
      for (let k = 0; k < wordsPerLevel - newIndices.length; k++) {
        // Use random review index, fallback to the first
        const idx =
          eligibleReview.length === 0
            ? 0
            : eligibleReview[Math.floor(Math.random() * eligibleReview.length)];
        reviewIndices.push(idx);
      }
    }
    const wordIndices = [...newIndices, ...reviewIndices].slice(0, wordsPerLevel);

    const wordPairs = wordIndices.map(idx => ({
      word: targetWords[idx] ?? "",
      translation: baseWords[idx] ?? "",
      idx: idx
    }));

    levels.push({
      level,
      words: wordPairs, // [{word, translation, idx}]
      complete: false,
      practiceComplete: false,
      testScore: null
    });

    index += countNew;
    learnedIndices = learnedIndices.concat(newIndices);
    level++;
  }
  return levels;
}

// PUBLIC_INTERFACE
const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  // Known ('base') language selection
  const defaultBaseLanguage = JSON.parse(localStorage.getItem("baseLanguage")) || { code: "en", label: "English" };
  const defaultTargetLanguage = JSON.parse(localStorage.getItem("selectedLanguage")) || { code: "es", label: "Spanish" };

  const [baseLanguage, setBaseLanguage] = useState(defaultBaseLanguage);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultTargetLanguage);

  // Initial levels loaded for (base, target) combination.
  const [levels, setLevels] = useState(() => {
    const key =
      baseLanguage && selectedLanguage
        ? `levels_${baseLanguage.code}_${selectedLanguage.code}`
        : "levels_en_es";
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
    return createLevelDataForLanguageWithTranslations(
      selectedLanguage?.code || "es",
      baseLanguage?.code || "en",
      10
    );
  });

  // When levels, base, or target changes, update the correct localStorage keys
  useEffect(() => {
    const key =
      baseLanguage && selectedLanguage
        ? `levels_${baseLanguage.code}_${selectedLanguage.code}`
        : "levels_en_es";
    localStorage.setItem(key, JSON.stringify(levels));
  }, [levels, baseLanguage, selectedLanguage]);
  useEffect(() => {
    localStorage.setItem("selectedLanguage", JSON.stringify(selectedLanguage));
  }, [selectedLanguage]);
  useEffect(() => {
    localStorage.setItem("baseLanguage", JSON.stringify(baseLanguage));
  }, [baseLanguage]);

  // When user switches the base or study language, reset (or load) the appropriate level data
  function handleSetSelectedLanguage(langObj) {
    setSelectedLanguage(langObj);
    // Try to load or create for (baseLanguage, langObj)
    const key =
      baseLanguage && langObj
        ? `levels_${baseLanguage.code}_${langObj.code}`
        : "levels_en_es";
    const cached = localStorage.getItem(key);
    if (cached) {
      setLevels(JSON.parse(cached));
    } else {
      setLevels(createLevelDataForLanguageWithTranslations(
        langObj.code,
        baseLanguage?.code || "en",
        10
      ));
    }
  }
  function handleSetBaseLanguage(langObj) {
    setBaseLanguage(langObj);
    // Try to load or create for (langObj, selectedLanguage)
    const key =
      langObj && selectedLanguage
        ? `levels_${langObj.code}_${selectedLanguage.code}`
        : "levels_en_es";
    const cached = localStorage.getItem(key);
    if (cached) {
      setLevels(JSON.parse(cached));
    } else {
      setLevels(createLevelDataForLanguageWithTranslations(
        selectedLanguage?.code || "es",
        langObj.code,
        10
      ));
    }
  }

  // Which level can user currently access?
  const lastPassedLevel = levels.reduce(
    (acc, l, idx) =>
      l.testScore && l.testScore.passed ? idx + 1 : acc,
    0
  );
  const nextAvailableLevel = lastPassedLevel + 1;

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
    progressPercent: Math.round((completed / totalLevels) * 100)
  };

  // Lessons: each word is now {word, translation}
  const lessons = levels.map(l => ({
    level: l.level,
    words: l.words, // [{word, translation, idx}]
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
        baseLanguage,
        setBaseLanguage: handleSetBaseLanguage,
        nextAvailableLevel,
        beginLevelPractice,
        markLevelTestScore,
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
