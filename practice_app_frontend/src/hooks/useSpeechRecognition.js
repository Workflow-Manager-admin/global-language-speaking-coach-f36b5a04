import { useState, useRef } from "react";

// PUBLIC_INTERFACE
// Hook for browser speech recognition (voice-to-text)
function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  // Feature detection
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  // Start listening for voice
  const startListening = () => {
    if (!supported) return;
    setTranscript("");
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US"; // Extend with per-language later
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        setTranscript(event.results[0][0].transcript);
      };
      recognitionRef.current.onend = () => setListening(false);
    }
    recognitionRef.current.start();
    setListening(true);
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return { transcript, listening, startListening, stopListening, supported };
}

export default useSpeechRecognition;
