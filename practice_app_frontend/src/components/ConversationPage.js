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

  // --- Helper: robustly select the best matching voice for the selected language code. Copied from LessonPage.js for consistency.
  function pickBestVoiceForLanguage(langCode) {
    if (!window.speechSynthesis) return { voice: null, lang: langCode, fallback: true };
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return { voice: null, lang: langCode, fallback: true };
    // Step 1: Try for exact BCP47 match
    let mainLang = langCode;
    let exact = voices.find(v => v.lang && v.lang.toLowerCase() === langCode.toLowerCase());
    if (exact) return { voice: exact, lang: exact.lang, fallback: false, voiceName: exact.name };
    // Step 2: Prefix match
    let prefix = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(mainLang.toLowerCase() + '-'));
    if (prefix) return { voice: prefix, lang: prefix.lang, fallback: false, voiceName: prefix.name };
    // Step 3: 2-letter lang code only
    let justLang = voices.find(v => v.lang && v.lang.substr(0, 2).toLowerCase() === mainLang.toLowerCase());
    if (justLang) return { voice: justLang, lang: justLang.lang, fallback: false, voiceName: justLang.name };
    // Step 4: Fallback
    return { voice: voices[0], lang: voices[0].lang, fallback: true, voiceName: voices[0].name };
  }

  // Speak the AI message (e.g., on load and after user submits)
  useEffect(() => {
    let fallbackTTS = false;
    if (aiMessage && window.speechSynthesis && lesson?.example) {
      let langCode =
        (window.localStorage.getItem("selectedLanguage") &&
          JSON.parse(window.localStorage.getItem("selectedLanguage")).code) ||
        "en";
      const langMap = {
        en: "en", es: "es", fr: "fr", de: "de", zh: "zh", ja: "ja", ar: "ar",
        ru: "ru", ko: "ko", pt: "pt"
      };
      langCode = langMap[langCode] || "en";
      const { voice, lang, fallback } = pickBestVoiceForLanguage(langCode);
      fallbackTTS = fallback;
      const utt = new window.SpeechSynthesisUtterance(
        `Let's practice. ${lesson.example}. Please say your answer!`
      );
      utt.lang = lang;
      if (voice) utt.voice = voice;
      ttsUtterRef.current = utt;
      setTtsPlaying(true);
      utt.onend = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utt);
      if (fallback) {
        setTimeout(() => {
          window.alert(
            "The selected language's voice was not found in your browser. Using the default voice instead. To improve speech synthesis, ensure system/browser support for this language."
          );
        }, 200);
      }
    }
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
    };
    // eslint-disable-next-line
  }, [aiMessage, lesson]);

  // Allow AI to repeat the phrase/pronounce on demand
  const handlePronounceAgain = () => {
    let fallback = false;
    if (window.speechSynthesis && lesson?.example) {
      try { window.speechSynthesis.cancel(); } catch { }
      let langCode =
        (window.localStorage.getItem("selectedLanguage") &&
        JSON.parse(window.localStorage.getItem("selectedLanguage")).code) ||
        "en";
      const langMap = {
        en: "en", es: "es", fr: "fr", de: "de", zh: "zh", ja: "ja", ar: "ar",
        ru: "ru", ko: "ko", pt: "pt"
      };
      langCode = langMap[langCode] || "en";
      const { voice, lang, fallback: fallbackInner } = pickBestVoiceForLanguage(langCode);
      fallback = fallbackInner;
      const utt = new window.SpeechSynthesisUtterance(lesson.example);
      utt.lang = lang;
      if (voice) utt.voice = voice;
      window.speechSynthesis.speak(utt);
      if (fallback) {
        setTimeout(() => {
          window.alert(
            "The selected language's voice was not found in your browser. Using the default voice instead. To improve speech synthesis, ensure system/browser support for this language."
          );
        }, 200);
      }
    }
  };

  // When user clicks Submit, the AI "responds"
  const handleSend = () => {
    setUserMessage(transcript);
    setTimeout(() => {
      // Simulated spoken feedback in correct language
      let fallback = false;
      if (window.speechSynthesis) {
        let langCode =
          (window.localStorage.getItem("selectedLanguage") &&
            JSON.parse(window.localStorage.getItem("selectedLanguage")).code) ||
          "en";
        const langMap = {
          en: "en", es: "es", fr: "fr", de: "de", zh: "zh", ja: "ja", ar: "ar",
          ru: "ru", ko: "ko", pt: "pt"
        };
        langCode = langMap[langCode] || "en";
        const { voice, lang, fallback: fallbackInner } = pickBestVoiceForLanguage(langCode);
        fallback = fallbackInner;
        const utt = new window.SpeechSynthesisUtterance(
          "Well done! Try to use a more complete sentence next time."
        );
        utt.lang = lang;
        if (voice) utt.voice = voice;
        window.speechSynthesis.speak(utt);
        if (fallback) {
          setTimeout(() => {
            window.alert(
              "The selected language's voice was not found in your browser. Using the default voice instead. To improve speech synthesis, ensure system/browser support for this language."
            );
          }, 200);
        }
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
