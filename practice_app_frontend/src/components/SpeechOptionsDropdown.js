/**
 * Stub SpeechOptionsDropdown. (Removed UI, always chooses the best Google or native voice
 * matching languageCode, rate=1, pitch=1.15. Not interactive.)
 * Notifies onChange({voiceURI, rate, pitch}) after mounting.
 */
import { useEffect } from "react";

// A utility: Find best Google-branded voice for the language, else a native voice fallback; always use rate=1, pitch=1.15
function findBestSpeechSynthesisVoice(languageCode) {
  if (!window.speechSynthesis) return { voice: null, voiceURI: "", lang: languageCode, fallback: true };
  const voices = window.speechSynthesis.getVoices() || [];
  // Try Google voice ideally
  const googleVoices = voices.filter(
    v =>
      v.lang &&
      v.lang.toLowerCase().startsWith(languageCode.toLowerCase()) &&
      v.name &&
      (/google/i.test(v.name) || /google/i.test(v.voiceURI))
  );
  if (googleVoices.length > 0)
    return { voice: googleVoices[0], voiceURI: googleVoices[0].voiceURI, lang: googleVoices[0].lang, fallback: false };
  // Try native voices matching language (by lang prefix)
  const langVoices = voices.filter(v =>
    v.lang && v.lang.toLowerCase().startsWith(languageCode.toLowerCase())
  );
  if (langVoices.length > 0)
    return { voice: langVoices[0], voiceURI: langVoices[0].voiceURI, lang: langVoices[0].lang, fallback: true };
  // Otherwise, just use the browser's default
  if (voices.length > 0)
    return { voice: voices[0], voiceURI: voices[0].voiceURI, lang: voices[0].lang, fallback: true };
  return { voice: null, voiceURI: "", lang: languageCode, fallback: true };
}

/**
 * Only purpose is to call onChange once on load with ({voiceURI, rate, pitch})
 */
function SpeechOptionsDropdown({ languageCode, onChange }) {
  useEffect(() => {
    // Wait for voices to load. Call onChange with the best Google or native voice, rate=1, pitch=1.15
    let timeout = setTimeout(() => {
      if (!window.speechSynthesis) {
        if (onChange) onChange({ voiceURI: "", rate: 1, pitch: 1.15 });
        return;
      }
      // Wait for voices, which may be async after page load
      function setNotify() {
        const chosen = findBestSpeechSynthesisVoice(languageCode);
        if (onChange) onChange({ voiceURI: chosen.voiceURI, rate: 1, pitch: 1.15 }); // always these settings
      }
      window.speechSynthesis.onvoiceschanged = setNotify;
      setNotify();
    }, 100);
    return () => {
      clearTimeout(timeout);
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [languageCode, onChange]);

  // Invisible stub; no UI.
  return null;
}

export default SpeechOptionsDropdown;
