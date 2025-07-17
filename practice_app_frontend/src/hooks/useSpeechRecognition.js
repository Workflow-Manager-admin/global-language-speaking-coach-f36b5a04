import { useState, useRef } from "react";

/**
 * Hook for browser speech recognition (voice-to-text), supporting a selectable language code.
 * @param {string} languageCode - The BCP47 language code to use, e.g., "en-US", "es-ES".
 * @returns {Object} { transcript, listening, startListening, stopListening, supported }
 */
// PUBLIC_INTERFACE
function useSpeechRecognition(languageCode = "en-US") {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  // Feature detection
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  /**
   * Start listening for voice using the specified language code.
   */
  const startListening = () => {
    if (!supported) return;
    setTranscript("");
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        setTranscript(event.results[0][0].transcript);
      };
      recognitionRef.current.onend = () => setListening(false);
    }
    // Always update language (speechRecognition.lang can be changed on the fly)
    recognitionRef.current.lang = languageCode || "en-US";
    recognitionRef.current.start();
    setListening(true);
  };

  /**
   * Stop listening.
   */
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return { transcript, listening, startListening, stopListening, supported };
}

export default useSpeechRecognition;
