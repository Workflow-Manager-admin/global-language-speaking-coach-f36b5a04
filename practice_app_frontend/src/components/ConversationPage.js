import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import AccuracySidebar from "./AccuracySidebar";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * ConversationPage component uses selectedLanguage from ProgressContext
 * for both speech recognition and synthesis. All AI pronunciation/synthesis
 * and voice-to-text will reflect the user's selected language code.
 */
function ConversationPage() {
  const { levelId } = useParams();
  const { lessons, selectedLanguage } = useProgress();
  const navigate = useNavigate();

  const lesson = lessons.find(l => String(l.level) === String(levelId));
  // Derive language code for use in all TTS and SR; fallback to English.
  const languageCode =
    selectedLanguage?.code ||
    "en"; // fallback for safety—should always be set after selection

  // Try matching to BCP47 for speech recognition and synth APIs
  // Some APIs need regional variant: e.g. en-US, es-ES, etc.
  // We'll create a map for some common codes for improvement.
  const languageBCP47Map = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    zh: "zh-CN",
    ja: "ja-JP",
    ar: "ar-SA",
    ru: "ru-RU",
    ko: "ko-KR",
    pt: "pt-PT"
  };
  const speechLang = languageBCP47Map[languageCode] || languageCode;

  const {
    transcript,
    listening,
    startListening,
    stopListening,
    supported
  } = useSpeechRecognition(speechLang);

  const [aiMessage] = useState(
    `(AI) Let's practice: "${lesson?.example || ""}" Say your answer!`
  );
  const [userMessage, setUserMessage] = useState("");
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsUtterRef = useRef(null);

  // Speak the AI message (lesson intro, etc.) on mount and AI message change
  useEffect(() => {
    if (!lesson?.example) return;
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    // Pick the best matching voice for the current language code
    const voices = window.speechSynthesis.getVoices() || [];
    // Prefer Google-branded voice for language, else any voice matching lang, else fallback
    let v =
      voices.find(
        vo =>
          vo.lang &&
          vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) &&
          ((vo.name && /google/i.test(vo.name)) ||
            (vo.voiceURI && /google/i.test(vo.voiceURI)))
      ) ||
      voices.find(
        vo =>
          vo.lang &&
          (vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) ||
            vo.lang.toLowerCase() === speechLang.toLowerCase())
      );
    if (!v && voices.length > 0) v = voices[0];
    const utt = new window.SpeechSynthesisUtterance(
      `Let's practice. ${lesson.example}. Please say your answer!`
    );
    utt.lang = v?.lang || speechLang;
    if (v) utt.voice = v;
    utt.rate = 1;
    utt.pitch = 1.15;
    ttsUtterRef.current = utt;
    setTtsPlaying(true);
    utt.onend = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utt);
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
    // eslint-disable-next-line
  }, [aiMessage, lesson, languageCode, speechLang]);

  // Allow AI to repeat the phrase/pronounce on demand (same logic as above)
  const handlePronounceAgain = () => {
    if (window.speechSynthesis && lesson?.example) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      const voices = window.speechSynthesis.getVoices() || [];
      let v =
        voices.find(
          vo =>
            vo.lang &&
            vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) &&
            ((vo.name && /google/i.test(vo.name)) ||
              (vo.voiceURI && /google/i.test(vo.voiceURI)))
        ) ||
        voices.find(
          vo =>
            vo.lang &&
            (vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) ||
              vo.lang.toLowerCase() === speechLang.toLowerCase())
        );
      if (!v && voices.length > 0) v = voices[0];
      const utt = new window.SpeechSynthesisUtterance(lesson.example);
      utt.lang = v?.lang || speechLang;
      utt.rate = 1;
      utt.pitch = 1.15;
      if (v) utt.voice = v;
      window.speechSynthesis.speak(utt);
    }
  };

  // When user clicks Submit, the AI "responds"
  const handleSend = () => {
    setUserMessage(transcript);
    setTimeout(() => {
      if (!window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices() || [];
      let v =
        voices.find(
          vo =>
            vo.lang &&
            vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) &&
            ((vo.name && /google/i.test(vo.name)) ||
              (vo.voiceURI && /google/i.test(vo.voiceURI)))
        ) ||
        voices.find(
          vo =>
            vo.lang &&
            (vo.lang.toLowerCase().startsWith(languageCode.toLowerCase()) ||
              vo.lang.toLowerCase() === speechLang.toLowerCase())
        );
      if (!v && voices.length > 0) v = voices[0];
      const utt = new window.SpeechSynthesisUtterance(
        "Well done! Try to use a more complete sentence next time."
      );
      utt.lang = v?.lang || speechLang;
      if (v) utt.voice = v;
      utt.rate = 1;
      utt.pitch = 1.15;
      window.speechSynthesis.speak(utt);
      alert(
        "AI feedback: Well done! Try to use a more complete sentence next time."
      );
    }, 400);
  };

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <div style={{ position: "relative", minHeight: 430 }}>
      <div className="conversation-page">
        <h2>AI-Powered Voice Practice</h2>
        <div className="conversation-box">
          <div className="ai-message">
            {aiMessage}
            <button
              onClick={handlePronounceAgain}
              style={{ marginLeft: 10, fontSize: "0.90rem" }}
              title="Hear pronunciation again"
            >
              🔊
            </button>
            {ttsPlaying && (
              <span
                style={{
                  marginLeft: 10,
                  color: "var(--primary-color)",
                  fontWeight: 400
                }}
              >
                Speaking...
              </span>
            )}
          </div>
          <div className="user-message">
            <button
              className={listening ? "listening" : ""}
              onMouseDown={startListening}
              onMouseUp={stopListening}
            >
              {listening
                ? "Listening... (release to finish)"
                : "🎙️ Hold to Speak"}
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
        <button
          className="btn btn-primary"
          style={{ marginTop: 24 }}
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
