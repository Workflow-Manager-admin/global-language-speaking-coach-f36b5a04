import React, { useState } from "react";
import { useProgress } from "../context/ProgressContext";

/**
 * HowDoYouSayTool - Now allows translation of any word or phrase using a public web API (with fallback).
 * Safe: Only queries public CORS-compliant API, with robust fallback to local vocabulary or 'Not found' messaging.
 * Also provides TTS capability in the selected language.
 * Hidden in challenge/test screens as per design.
 *
 * PUBLIC_INTERFACE
 */
function HowDoYouSayTool({ hidden }) {
  const { baseLanguage, selectedLanguage } = useProgress();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);

  // Expanded local fallback: tries mapped vocab, then generic no-found message
  const vocabMap = require("../context/ProgressContext.js").LANGUAGE_VOCAB || {};
  const targetWords = vocabMap[selectedLanguage?.code] || [];
  const baseWords = vocabMap[baseLanguage?.code] || [];
  function fallbackTranslate(inputText) {
    if (!inputText) return { translation: "", spoken: "" };
    const normalized = inputText.trim().toLowerCase();
    let idx = baseWords.findIndex(w => w.toLowerCase() === normalized);
    if (idx !== -1) {
      return {
        translation: targetWords[idx] || "(Not available in local dictionary)",
        spoken: targetWords[idx] || ""
      };
    }
    idx = targetWords.findIndex(w => w.toLowerCase() === normalized);
    if (idx !== -1) {
      return {
        translation: baseWords[idx] || "(Not available in local dictionary)",
        spoken: baseWords[idx] || ""
      };
    }
    // Try searching individual words in phrase for partial match
    for (let word of normalized.split(/\s+/)) {
      idx = baseWords.findIndex(w => w.toLowerCase() === word);
      if (idx !== -1) {
        return {
          translation: targetWords[idx] || "(Not available in local dictionary)",
          spoken: targetWords[idx] || ""
        };
      }
      idx = targetWords.findIndex(w => w.toLowerCase() === word);
      if (idx !== -1) {
        return {
          translation: baseWords[idx] || "(Not available in local dictionary)",
          spoken: baseWords[idx] || ""
        };
      }
    }
    return {
      translation: "(No translation found)",
      spoken: ""
    };
  }

  // Language code mapping for APIs and TTS
  const LANG_API_MAP = { en: "en", es: "es", fr: "fr", de: "de", zh: "zh", ja: "ja", ar: "ar", ru: "ru", ko: "ko", pt: "pt" };
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

  // Actual API call: Uses LibreTranslate (free and public, CORS ready; see https://libretranslate.com/)
  // Use the free endpoint, falls back to local only if error/network offline
  async function fetchOnlineTranslation(inputText, from, to) {
    // We'll use LibreTranslate's free endpoint
    const apiUrl = "https://libretranslate.com/translate";
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: inputText,
          source: from,
          target: to,
          format: "text"
        })
      });
      const data = await resp.json();
      if (typeof data.translatedText === "string" && data.translatedText.trim() && data.translatedText !== inputText) {
        return data.translatedText;
      }
      // Could not translate, fallback
      return null;
    } catch (err) {
      // Network, CORS, or other error.
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);
    setError(null);
    if (!input || input.trim().length === 0) {
      setError("Please enter a word or phrase.");
      return;
    }
    setLoading(true);
    // Main flow: online API, fallback if error
    const srcLang = LANG_API_MAP[baseLanguage?.code] || "en";
    const tgtLang = LANG_API_MAP[selectedLanguage?.code] || "es";
    let translation = null;

    try {
      translation = await fetchOnlineTranslation(input.trim(), srcLang, tgtLang);
    } catch {
      translation = null;
    }
    setLoading(false);

    if (translation && typeof translation === "string" && translation.trim().length > 0) {
      setResult({ translation, spoken: translation });
    } else {
      // Fallback: local mapping (basic demo coverage)
      const fallback = fallbackTranslate(input);
      setResult(fallback);
      if (fallback.translation === "(No translation found)" || fallback.translation === "(Not available in local dictionary)") {
        setError("Translation not found. Please try rewording your phrase.");
      }
    }
  }

  function handleSpeak() {
    if (!result?.translation || !result.translation.trim() || result.translation.startsWith("(")) return;
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
          placeholder="Enter any word or phrase to translate"
          style={{
            flex: 1,
            minWidth: 120,
            fontSize: "1.08em",
            padding: "8px 14px",
            borderRadius: 7,
            border: "1.5px solid #9cd9ea"
          }}
          value={input}
          onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
          aria-label="Phrase to translate"
          disabled={loading}
        />
        <button
          className="btn btn-accent"
          type="submit"
          style={{ minWidth: 75 }}
          disabled={loading}
        >
          {loading ? "..." : "Translate"}
        </button>
      </form>
      {error && (
        <div style={{ color: "#b14343", fontWeight: 500, marginTop: 7 }}>{error}</div>
      )}
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
                disabled={speaking}
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
        You can translate any word or phrase (not just those in your lesson).<br />
        Online translation uses a public API when available. <span style={{ color: "#e87a41" }}>(Results may vary.)</span>
      </div>
    </div>
  );
}

export default HowDoYouSayTool;
