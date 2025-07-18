import React, { useState } from "react";
import { useProgress } from "../context/ProgressContext";

// PUBLIC_INTERFACE
/**
 * HowDoYouSayTool - Instant phrase/word translator and TTS tool for the user's selected language.
 * Not available in test/challenge screens. Uses local vocabulary for matching, else echoes input.
 */
function HowDoYouSayTool({ hidden }) {
  const { baseLanguage, selectedLanguage } = useProgress();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [speaking, setSpeaking] = useState(false);

  // Pull vocabulary lists from ProgressContext (same structure as lesson vocab)
  const vocabMap = require("../context/ProgressContext.js").LANGUAGE_VOCAB || {};
  const targetWords = vocabMap[selectedLanguage?.code] || [];
  const baseWords = vocabMap[baseLanguage?.code] || [];

  // Local phrase translation
  function translate(inputText) {
    if (!inputText) return { translation: "", spoken: "" };
    // Try to match inputText to baseWords or targetWords
    const normalized = inputText.trim().toLowerCase();
    let idx = baseWords.findIndex(w => w.toLowerCase() === normalized);
    if (idx !== -1) {
      return {
        translation: targetWords[idx] || "(Not available)",
        spoken: targetWords[idx] || ""
      };
    }
    idx = targetWords.findIndex(w => w.toLowerCase() === normalized);
    if (idx !== -1) {
      return {
        translation: baseWords[idx] || "(Not available)",
        spoken: targetWords[idx] || ""
      };
    }
    // Not found, just echo input as fallback (could call API in real app)
    return {
      translation: "(No translation found in core vocab)",
      spoken: ""
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input) {
      setResult(null);
      return;
    }
    setResult(translate(input));
  }

  function handleSpeak() {
    if (!result?.translation || result.translation.startsWith("(")) return;
    // Browser TTS for output in user's TARGET language
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
      pt: "pt-PT",
    };
    const code = selectedLanguage?.code || "en";
    const speechLang = languageBCP47Map[code] || code;
    if (window.speechSynthesis && result?.translation) {
      try { window.speechSynthesis.cancel(); } catch {}
      const voices = window.speechSynthesis.getVoices() || [];
      let v =
        voices.find(
          vo =>
            vo.lang &&
            vo.lang.toLowerCase().startsWith(code.toLowerCase()) &&
            ((vo.name && /google/i.test(vo.name)) ||
              (vo.voiceURI && /google/i.test(vo.voiceURI)))
        ) ||
        voices.find(
          vo =>
            vo.lang &&
            (vo.lang.toLowerCase().startsWith(code.toLowerCase()) ||
              vo.lang.toLowerCase() === speechLang.toLowerCase())
        );
      if (!v && voices.length > 0) v = voices[0];
      const utt = new window.SpeechSynthesisUtterance(result.translation);
      utt.lang = v?.lang || speechLang;
      utt.rate = 1;
      utt.pitch = 1.15;
      if (v) utt.voice = v;
      setSpeaking(true);
      utt.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utt);
    }
  }

  if (hidden) return null;
  return (
    <div
      style={{
        margin: "23px auto 40px auto",
        background: "#eaf9fa",
        borderRadius: 12,
        padding: "22px 20px 20px 20px",
        maxWidth: 420,
        minWidth: 240,
        boxShadow: "0 2px 12px 0 rgba(46,119,74,0.04)",
        border: "1.3px solid #aadbe7",
        textAlign: "center"
      }}
      data-testid="howdo-say-box"
    >
      <h3
        style={{
          margin: 0,
          marginBottom: 10,
          color: "var(--primary-color)",
          fontWeight: 700
        }}
      >
        How do you say...?
      </h3>
      <form
        style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 10 }}
        onSubmit={handleSubmit}
        aria-label="Translate phrase form"
      >
        <input
          type="text"
          placeholder={`Enter any word or phrase to translate`}
          style={{
            flex: 1,
            minWidth: 120,
            fontSize: "1.08em",
            padding: "8px 14px",
            borderRadius: 7,
            border: "1.5px solid #9cd9ea"
          }}
          value={input}
          onChange={e => { setInput(e.target.value); setResult(null); }}
          aria-label="Phrase to translate"
        />
        <button
          className="btn btn-accent"
          type="submit"
          style={{ minWidth: 75 }}
        >
          Translate
        </button>
      </form>
      {result && (
        <div
          style={{
            marginTop: 10,
            color: result.translation.startsWith("(")
              ? "#b14343"
              : "var(--primary-color)"
          }}
        >
          <div>
            <b>Translation:</b>
            <span style={{ marginLeft: 7, fontWeight: 600 }}>
              {result.translation}
            </span>
            {result.translation && !result.translation.startsWith("(") && (
              <button
                onClick={handleSpeak}
                title="Hear pronunciation"
                style={{
                  marginLeft: 7,
                  fontSize: "1.08em",
                  padding: "2px 8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--accent-color)"
                }}
                aria-label="Play pronunciation"
              >
                🔊
              </button>
            )}
            {speaking && (
              <span style={{ marginLeft: 4, fontSize: "0.96em", color: "#35a" }}>
                Speaking...
              </span>
            )}
          </div>
        </div>
      )}
      <div style={{ color: "#888", fontSize: "0.98em", marginTop: 9 }}>
        Type a word from either your language or the one you're learning!
      </div>
    </div>
  );
}

export default HowDoYouSayTool;
