import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import AccuracySidebar from "./AccuracySidebar";
import "../App.css";

// --- CHARACTER/PERSONALITY PRESETS ---
const CHARACTER_PRESETS = [
  {
    key: "cheerful_friend",
    label: "Cheerful Friend",
    mood: "Cheerful",
    role: "Peer",
    icon: "🙂",
    description: "Friendly, casual, positive.",
    starter: "Hey! Let's chat. How was your day?",
    prompt: (user) => `That's awesome! Tell me more, if you'd like.`
  },
  {
    key: "strict_teacher",
    label: "Strict Teacher",
    mood: "Serious",
    role: "Teacher",
    icon: "👩‍🏫",
    description: "Formal, focused on learning.",
    starter: "Let's begin the lesson. Please introduce yourself in a full sentence.",
    prompt: (user) => user && user.length > 0
      ? `Thank you. Please provide a more complete answer, including your name and where you're from.`
      : `I'm waiting. Please answer clearly.`
  },
  {
    key: "curious_tourist",
    label: "Curious Tourist",
    mood: "Curious",
    role: "Visitor",
    icon: "🧳",
    description: "Asks about culture, travel, daily life.",
    starter: "Hello! What is your favorite place in your city?",
    prompt: (user) => user.includes("park") ? `I love parks too! Why do you like it?`
      : `That sounds interesting! Describe it more.`
  },
  {
    key: "business_partner",
    label: "Business Partner",
    mood: "Formal",
    role: "Colleague",
    icon: "💼",
    description: "Professional, business-like.",
    starter: "Good morning. Can you explain your work or daily tasks?",
    prompt: (user) => user && user.length > 20
      ? `Thank you for the summary. What are your goals in your role?`
      : `Could you give me more details about your responsibilities?`
  },
];

// PUBLIC_INTERFACE
/**
 * ConversationPage component uses selectedLanguage from ProgressContext,
 * now with role-play adaptive mode, character/personality selection,
 * AI dialogue that adapts with user messages via local template logic.
 */
function ConversationPage() {
  const { levelId } = useParams();
  const { lessons, selectedLanguage } = useProgress();
  const navigate = useNavigate();
  const lesson = lessons.find(l => String(l.level) === String(levelId));

  // Language for TTS/Speech recognition (use lesson language)
  const languageCode =
    selectedLanguage?.code ||
    "en";
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

  // UI State
  const [selectedPreset, setSelectedPreset] = useState(CHARACTER_PRESETS[0]);
  const [aiHistory, setAiHistory] = useState([
    { role: "system", msg: "", userMsg: "", fromStarter: true }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [step, setStep] = useState(0);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsUtterRef = useRef(null);

  // On preset change reset conversation
  useEffect(() => {
    setAiHistory([
      { role: "ai", msg: selectedPreset.starter, userMsg: "", fromStarter: true }
    ]);
    setUserMessage("");
    setStep(0);
    try { window.speechSynthesis.cancel(); } catch {}
  }, [selectedPreset]);

  // Pronounce last AI message (auto and on demand)
  useEffect(() => {
    const lastAI = aiHistory[aiHistory.length-1];
    if (!lastAI?.msg) return;
    if (!window.speechSynthesis) return;
    // Only speak for role=ai
    if (lastAI.role !== "ai") return;
    try { window.speechSynthesis.cancel(); } catch {}
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
    const utt = new window.SpeechSynthesisUtterance(lastAI.msg);
    utt.lang = v?.lang || speechLang;
    if (v) utt.voice = v;
    utt.rate = 1;
    utt.pitch = 1.15;
    ttsUtterRef.current = utt;
    setTtsPlaying(true);
    utt.onend = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utt);
    // eslint-disable-next-line
    // silence between each new prompt
    // eslint-disable-next-line
  }, [aiHistory, languageCode, speechLang]);

  // Re-speak last message
  const handlePronounceAgain = () => {
    const lastAI = aiHistory[aiHistory.length-1];
    if (window.speechSynthesis && lastAI?.msg) {
      try { window.speechSynthesis.cancel(); } catch {}
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
      const utt = new window.SpeechSynthesisUtterance(lastAI.msg);
      utt.lang = v?.lang || speechLang;
      utt.rate = 1;
      utt.pitch = 1.15;
      if (v) utt.voice = v;
      window.speechSynthesis.speak(utt);
    }
  };

  // Adaptive dialogue logic (template-based)
  // Acquire new prompt for this "character" based on last user response
  const getNextPrompt = (userInput) => {
    if (!selectedPreset || !selectedPreset.prompt) {
      // Fallback
      return "Interesting, let's keep talking!";
    }
    return (typeof selectedPreset.prompt === "function")
      ? selectedPreset.prompt(userInput || "")
      : selectedPreset.prompt;
  };

  // Handle submission (user speaks and submits)
  const handleSend = () => {
    if (!transcript) return;
    setUserMessage(transcript);
    setAiHistory((old) => [
      ...old,
      { role: "user", msg: transcript, userMsg: transcript, fromStarter: false }
    ]);
    const aiReply = getNextPrompt(transcript);
    setTimeout(() => {
      setAiHistory((old) => [
        ...old,
        { role: "ai", msg: aiReply, userMsg: transcript, fromStarter: false }
      ]);
      setUserMessage("");
    }, 350);
  };

  if (!supported) {
    return <div>Your browser does not support speech recognition.</div>;
  }

  return (
    <div style={{ position: "relative", minHeight: 470 }}>
      <div className="conversation-page" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>Role-Play Conversation Practice</h2>
        {/* Character/Personality selection */}
        <div style={{
          marginBottom: 20,
          display: "flex",
          gap: 9,
          flexWrap: "wrap"
        }}>
          {CHARACTER_PRESETS.map((c) => (
            <button
              key={c.key}
              className="btn"
              aria-label={c.label}
              style={{
                background: selectedPreset.key === c.key ? "var(--accent-color)" : "#eaf9fa",
                color: selectedPreset.key === c.key ? "#fff" : "var(--primary-color)",
                border: selectedPreset.key === c.key ? "2px solid var(--primary-color)" : "1.4px solid #aee1b8",
                fontWeight: 600,
                minWidth: 124,
                marginBottom: 2,
                borderRadius: 9
              }}
              onClick={() => setSelectedPreset(c)}
              title={c.description}
            >
              <span style={{ fontSize: 23, marginRight: 7 }}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
        <div className="conversation-box" style={{ marginTop: 12 }}>
          {/* Chat history */}
          <div>
            {aiHistory.filter(msg => !!msg.msg).map((entry, idx) => (
              <div key={idx + "-" + entry.role}
                className={entry.role === "ai" ? "ai-message" : "user-message"}
                style={{
                  marginBottom: entry.role === "ai" ? 12 : 11,
                  background: entry.role === "ai" ? "#eaf9fa" : "#f5f9ff",
                  color: entry.role === "ai" ? "var(--secondary-color)" : "#232",
                  borderRadius: 6,
                  padding: entry.role === "ai" ? "11px 15px" : "11px 12px",
                  fontWeight: entry.role === "ai" ? 600 : 500
                }}>
                {entry.role === "ai" ? (
                  <>
                    {entry.msg}
                    {idx === aiHistory.length-1 && (
                      <>
                        <button
                          onClick={handlePronounceAgain}
                          style={{ marginLeft: 8, fontSize: "0.92em" }}
                          title="Hear this message again"
                        >
                          🔊
                        </button>
                        {ttsPlaying && (
                          <span style={{
                            marginLeft: 7,
                            color: "var(--primary-color)",
                            fontWeight: 400
                          }}>
                            Speaking...
                          </span>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <span>
                    <span style={{fontStyle: "italic"}}>You:</span> {entry.msg}
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* User input microphone UI */}
          <div className="user-message">
            <button
              className={listening ? "listening" : ""}
              onMouseDown={startListening}
              onMouseUp={stopListening}
              style={{ marginRight: 6 }}
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
            style={{ marginTop: 9 }}
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
      {/* The accuracy sidebar still available, showing text match with lesson example */}
      <AccuracySidebar target={lesson.example} userInput={transcript} />
    </div>
  );
}

export default ConversationPage;
