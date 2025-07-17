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

  // --- Helper: find matching browser voice for selected language ---
  const pickVoiceAndLang = () => {
    let fallback = false;
    let langCode =
      (window.localStorage.getItem("selectedLanguage") &&
        JSON.parse(window.localStorage.getItem("selectedLanguage")).code) ||
      "en";
    const langMap = {
      en: "en", es: "es", fr: "fr", de: "de", zh: "zh", ja: "ja", ar: "ar",
      ru: "ru", ko: "ko", pt: "pt"
    };
    langCode = langMap[langCode] || "en";
    const voices = window.speechSynthesis.getVoices();
    let voice =
      voices.find((v) => v.lang && v.lang.substr(0, 2) === langCode) ||
      voices.find((v) => v.lang && v.lang.toLowerCase().includes(langCode + "-")) ||
      voices.find((v) => v.lang && v.lang.toLowerCase().includes(langCode)) ||
      null;
    if (!voice && voices.length > 0) {
      fallback = true;
      voice = voices[0];
    }
    return { voice, lang: voice?.lang || langCode, fallback, voiceName: voice?.name || "" };
  };

  // Speak the AI message (e.g., on load and after user submits)
  useEffect(() => {
    let fallbackTTS = false;
    if (aiMessage && window.speechSynthesis && lesson?.example) {
      const { voice, lang, fallback } = pickVoiceAndLang();
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
      const { voice, lang, fallback: fallbackInner } = pickVoiceAndLang();
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
        const { voice, lang, fallback: fallbackInner } = pickVoiceAndLang();
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
