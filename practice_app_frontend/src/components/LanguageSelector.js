import React from "react";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
];

function LanguageSelector() {
  const { selectedLanguage, setSelectedLanguage } = useProgress();

  return (
    <div className="language-selector-page">
      <h2>Select a Language to Practice</h2>
      <div className="language-list">
        {AVAILABLE_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className={`btn ${lang.code === selectedLanguage?.code ? "selected" : ""}`}
            onClick={() => setSelectedLanguage(lang)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
export default LanguageSelector;
