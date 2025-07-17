import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import AccuracySidebar from "./AccuracySidebar";
import SpeechOptionsDropdown from "./SpeechOptionsDropdown";
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

  // Speech options state (voice URI, rate, pitch)
  let defaultLang = (window.localStorage.getItem("selectedLanguage") &&
                     JSON.parse(window.localStorage.getItem("selectedLanguage")).code) || "en";
  const [speechOpts, setSpeechOpts] = useState(() => {
    const ctx = localStorage.getItem("speechOptions_" + defaultLang);
    const last = localStorage.getItem("speechOptions_last");
    if (ctx) return JSON.parse(ctx);
    if (last) return JSON.parse(last);
    return {voiceURI: "", rate: 1, pitch: 1};
  });
  // Speak the AI message (e.g., on load and after user submits)
  useEffect(() => {
    if (!lesson?.example) return;
    if (!window.speechSynthesis) return;
    try { window.speechSynthesis.cancel(); } catch { }
    // Which voice/rate/pitch?
    const voices = window.speechSynthesis.getVoices() || [];
    let v = voices.find(vo => vo.voiceURI === speechOpts.voiceURI);
    if (!v) v = voices.find(vo => vo.lang && vo.lang.startsWith(defaultLang));
    if (!v && voices.length > 0) v = voices[0];
    const utt = new window.SpeechSynthesisUtterance(
      `Let's practice. ${lesson.example}. Please say your answer!`
    );
    utt.lang = v?.lang || defaultLang;
    if (v) utt.voice = v;
    utt.rate = speechOpts.rate || 1;
    utt.pitch = speechOpts.pitch || 1;
    ttsUtterRef.current = utt;
    setTtsPlaying(true);
    utt.onend = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utt);
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
    };
    // eslint-disable-next-line
  }, [aiMessage, lesson, speechOpts, defaultLang]);

  // Allow AI to repeat the phrase/pronounce on demand
  const handlePronounceAgain = () => {
    if (window.speechSynthesis && lesson?.example) {
      try { window.speechSynthesis.cancel(); } catch { }
      const voices = window.speechSynthesis.getVoices() || [];
      let v = voices.find(vo => vo.voiceURI === speechOpts.voiceURI);
      if (!v) v = voices.find(vo => vo.lang && vo.lang.startsWith(defaultLang));
      if (!v && voices.length > 0) v = voices[0];
      const utt = new window.SpeechSynthesisUtterance(lesson.example);
      utt.lang = v?.lang || defaultLang;
      utt.rate = speechOpts.rate || 1;
      utt.pitch = speechOpts.pitch || 1;
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
      let v = voices.find(vo => vo.voiceURI === speechOpts.voiceURI);
      if (!v) v = voices.find(vo => vo.lang && vo.lang.startsWith(defaultLang));
      if (!v && voices.length > 0) v = voices[0];
      const utt = new window.SpeechSynthesisUtterance(
        "Well done! Try to use a more complete sentence next time."
      );
      utt.lang = v?.lang || defaultLang;
      if (v) utt.voice = v;
      utt.rate = speechOpts.rate || 1;
      utt.pitch = speechOpts.pitch || 1;
      window.speechSynthesis.speak(utt);
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
        <SpeechOptionsDropdown
          languageCode={defaultLang}
          contextLabel="Conversation"
          onChange={setSpeechOpts}
        />
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
