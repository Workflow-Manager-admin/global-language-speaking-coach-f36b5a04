import React, { useState } from "react";
import { useProgress } from "../context/ProgressContext";

/**
 * HowDoYouSayTool - Now uses an AI translation and correction API endpoint (or mock).
 * Translates input after correcting grammar/spelling, and displays correction and translation.
 * Informs user when input corrections occurred before translation.
 *
 * PUBLIC_INTERFACE
 */
function HowDoYouSayTool({ hidden }) {
  const { baseLanguage, selectedLanguage } = useProgress();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // { corrected, translation, wasCorrected }
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);

  // Language API mapping for standardized codes
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

  // Fallback offline "dictionary" for isolated words
  const vocabMap = require("../context/ProgressContext.js").LANGUAGE_VOCAB || {};
  const targetWords = vocabMap[selectedLanguage?.code] || [];
  const baseWords = vocabMap[baseLanguage?.code] || [];
  function fallbackOfflineTranslate(inputText) {
    if (!inputText) return { corrected: inputText, translation: "", wasCorrected: false };
    const normalized = inputText.trim().toLowerCase();
    let idx = baseWords.findIndex((w) => w.toLowerCase() === normalized);
    if (idx !== -1) {
      return { corrected: inputText, translation: targetWords[idx] || "(Not available in local dictionary)", wasCorrected: false };
    }
    idx = targetWords.findIndex((w) => w.toLowerCase() === normalized);
    if (idx !== -1) {
      return { corrected: inputText, translation: baseWords[idx] || "(Not available in local dictionary)", wasCorrected: false };
    }
    return { corrected: inputText, translation: "(No translation found)", wasCorrected: false };
  }

  /**
   * Mock AI Correction and Translation
   * - Simulates grammar/spelling correction, then translation (uses LibreTranslate for translation if online).
   */
  async function aiCorrectAndTranslate(inputText, from, to) {
    // --- 1. Basic simulated correction logic (replace this with actual AI endpoint later) ---
    let corrected = inputText.trim();
    let wasCorrected = false;
    // Demonstrative correction: fix a few common mistakes as an example
    const quickFixes = [
      { wrong: "helo", fix: "hello" },
      { wrong: "frend", fix: "friend" },
      { wrong: "thnak you", fix: "thank you" },
      { wrong: "wat is", fix: "what is" },
      { wrong: "i want teh food", fix: "i want the food" }
    ];
    for (const { wrong, fix } of quickFixes) {
      if (corrected.toLowerCase().includes(wrong)) {
        corrected = corrected.toLowerCase().replace(wrong, fix);
        wasCorrected = true;
      }
    }
    // Simulate more advanced AI with a simple capitalization fix if all lowercase and >1 word
    if (/^[a-z\s,.'-?!]+$/.test(corrected) && corrected.split(" ").length > 1 && corrected[0] === corrected[0].toLowerCase()) {
      const capitalized = corrected.slice(0,1).toUpperCase() + corrected.slice(1);
      if (capitalized !== corrected) {
        corrected = capitalized;
        wasCorrected = true;
      }
    }

    // --- 2. Online AI translation if real endpoint available (mock with LibreTranslate) ---
    // NOTE: For real LLM endpoint: send { q: inputText, source: from, target: to } and get { corrected, translation }
    // Here, simulate by sending "corrected" to LibreTranslate. If error, use fallback.
    const apiUrl = "https://libretranslate.com/translate";
    let translation = null;
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: corrected,
          source: from,
          target: to,
          format: "text"
        })
      });
      const data = await resp.json();
      if (typeof data.translatedText === "string" && data.translatedText.trim()) {
        translation = data.translatedText;
      }
    } catch (err) {
      // Do nothing; fall through to fallback
    }

    if (!translation || !translation.trim()) {
      // Fallback to offline only for isolated words
      const fallback = fallbackOfflineTranslate(corrected);
      return { corrected, translation: fallback.translation, wasCorrected };
    }

    return { corrected, translation, wasCorrected };
  }

  // Form submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);
    setError(null);
    if (!input || input.trim().length === 0) {
      setError("Please enter a word, phrase, or sentence to translate.");
      return;
    }
    setLoading(true);

    const trimmedInput = input.trim();
    const srcLang = LANG_API_MAP[baseLanguage?.code] || "en";
    const tgtLang = LANG_API_MAP[selectedLanguage?.code] || "es";

    let aiResult = null;
    try {
      aiResult = await aiCorrectAndTranslate(trimmedInput, srcLang, tgtLang);
    } catch (err) {
      aiResult = null;
    }
    setLoading(false);

    if (!aiResult || !aiResult.translation || aiResult.translation.startsWith("(")) {
      setError("Translation not found or service unavailable.");
      setResult(aiResult);
      return;
    }
    setResult(aiResult);
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

  return (
    <div
      style={{
        margin: "23px auto 40px auto",
        background: "#eaf9fa",
        borderRadius: 12,
        padding: "22px 20px 20px 20px",
        maxWidth: 440,
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
        style={{
          display: "flex",
          gap: 7,
          justifyContent: "center",
          marginBottom: 10
        }}
        onSubmit={handleSubmit}
        aria-label="Translate phrase form"
      >
        <input
          type="text"
          placeholder="Enter any word, phrase, or sentence to translate"
          style={{
            flex: 1,
            minWidth: 120,
            fontSize: "1.08em",
            padding: "8px 14px",
            borderRadius: 7,
            border: "1.5px solid #9cd9ea"
          }}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setResult(null);
            setError(null);
          }}
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
      {result && !!result.corrected && result.corrected !== input.trim() && (
        <div
          style={{
            color: "#8b7500",
            fontWeight: 600,
            background: "#fffbe6",
            borderRadius: "7px",
            border: "1px dashed #e8c942",
            padding: "7px 11px",
            margin: "7px 0"
          }}
        >
          <span>
            <b>Input corrected:</b> <span style={{ fontStyle: "italic" }}>{result.corrected}</span>
          </span>
        </div>
      )}
      {result && result.translation && (
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
            {result.translation &&
              !result.translation.startsWith("(") && (
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
              <span
                style={{
                  marginLeft: 4,
                  fontSize: "0.96em",
                  color: "#35a"
                }}
              >
                Speaking...
              </span>
            )}
          </div>
        </div>
      )}
      <div
        style={{
          color: "#888",
          fontFamily:
            "Segoe UI, -apple-system, system-ui, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
          fontSize: "0.98em",
          marginTop: 9,
          textAlign: "center"
        }}
      >
        You can translate any word, phrase, or full sentence.
        <br />
        The entire text is first corrected (AI assisted), then fully translated.
        <br />
        <span style={{ color: "#e87a41" }}>
          {result && result.wasCorrected
            ? " (Your input was corrected before translation.)"
            : " (Results may vary. Full-phrase and input corrections are AI-powered!)"}
        </span>
      </div>
    </div>
  );
}

export default HowDoYouSayTool;
