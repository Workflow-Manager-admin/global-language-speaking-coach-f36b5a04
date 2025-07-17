import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
/**
 * SpeechOptionsDropdown
 * Allows the user to preview/select a speech synthesis voice, rate, and pitch for the current language.
 * Remembers choice in localStorage. Works for any context where speech synthesis is used.
 * 
 * Props:
 *   languageCode: (string) BCP-47 language code (e.g., "en", "es", "fr").
 *   onChange: (function) called with {voiceURI, rate, pitch} when changed.
 *   contextLabel: (string) for UI, e.g., "Lesson" or "Conversation"
 */
function SpeechOptionsDropdown({ languageCode, onChange, contextLabel = "" }) {
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [loading, setLoading] = useState(true);

  // Load voices (async on some browsers)
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    function load() {
      const allVoices = window.speechSynthesis?.getVoices() || [];
      // Prioritize: 1. Exact language, 2. Same language prefix, 3. Any
      let filtered = allVoices.filter(v =>
        v.lang.toLowerCase().startsWith(languageCode.toLowerCase())
      );
      if (filtered.length === 0) filtered = allVoices;
      if (mounted) {
        setVoices(filtered);
        setLoading(false);
        // Auto-select current from localStorage, else best match
        const saved = localStorage.getItem("speechOptions_" + languageCode);
        if (saved) {
          const opts = JSON.parse(saved);
          setVoiceURI(opts.voiceURI);
          setRate(opts.rate || 1);
          setPitch(opts.pitch || 1);
        } else if (filtered.length > 0) {
          setVoiceURI(filtered[0].voiceURI);
        }
      }
    }
    if (window.speechSynthesis?.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
    load();
    return () => { mounted = false; };
  }, [languageCode]);

  useEffect(() => {
    // Save settings and notify parent
    const opts = {voiceURI, rate, pitch};
    localStorage.setItem("speechOptions_" + languageCode, JSON.stringify(opts));
    if (onChange) onChange(opts);
    // Also track in global (for all contexts)
    localStorage.setItem("speechOptions_last", JSON.stringify({
      ...opts, languageCode
    }));
  }, [voiceURI, rate, pitch, languageCode, onChange]);

  function preview() {
    if (!voiceURI) return;
    const v = voices.find(v => v.voiceURI === voiceURI);
    const utt = new window.SpeechSynthesisUtterance(
      `This is a preview. ${contextLabel ? `(${contextLabel})` : ""}`
    );
    utt.lang = v?.lang || languageCode;
    utt.rate = rate;
    utt.pitch = pitch;
    if (v) utt.voice = v;
    window.speechSynthesis.speak(utt);
  }

  return (
    <div style={{margin: "10px 0 20px 0"}}>
      <div style={{fontWeight: 600, marginBottom: 6}}>
        Voice & Pronunciation Options {contextLabel && <span>({contextLabel})</span>}
      </div>
      {loading ? <div>Loading voices...</div> : (
        <div style={{display:"flex", flexDirection:"column", gap: "9px"}}>
          <div>
            <label>
              <span style={{minWidth: 70, display:"inline-block"}}>Voice: </span>
              <select
                value={voiceURI}
                onChange={e => setVoiceURI(e.target.value)}
                style={{ minWidth: 180, fontSize: "1.06rem" }}
              >
                {voices.map(v => (
                  <option
                    value={v.voiceURI}
                    key={v.voiceURI}
                  >{v.name} ({v.lang}){v.default ? " [default]" : ""}</option>
                ))}
              </select>
              <button
                className="btn btn-accent"
                onClick={preview}
                style={{marginLeft:8, fontSize:"0.9rem", padding:"3px 15px"}}
                type="button"
              >Preview</button>
            </label>
          </div>
          <div>
            <label>
              <span style={{minWidth: 70, display:"inline-block"}}>Rate: </span>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.01"
                value={rate}
                onChange={e => setRate(parseFloat(e.target.value))}
                style={{verticalAlign:"middle"}}
              />{" "}{rate}
            </label>
          </div>
          <div>
            <label>
              <span style={{minWidth: 70, display:"inline-block"}}>Pitch: </span>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.01"
                value={pitch}
                onChange={e => setPitch(parseFloat(e.target.value))}
                style={{verticalAlign:"middle"}}
              />{" "}{pitch}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeechOptionsDropdown;
