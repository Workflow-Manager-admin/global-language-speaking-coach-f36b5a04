import React, { useState } from "react";
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
  const {
    baseLanguage,
    setBaseLanguage,
    selectedLanguage,
    setSelectedLanguage,
  } = useProgress();

  // For instant selection UI (before confirmation)
  const [tempBase, setTempBase] = useState(baseLanguage || { code: "en", label: "English" });
  const [tempTarget, setTempTarget] = useState(selectedLanguage || { code: "es", label: "Spanish" });

  function handleSave() {
    setBaseLanguage(tempBase);
    setSelectedLanguage(tempTarget);
  }

  // Disallow picking same language for both
  const showWarning = tempBase.code === tempTarget.code;

  return (
    <div className="language-selector-page">
      <h2>Select Your Languages</h2>
      <div style={{ marginBottom: 18 }}>
        <div>
          <b>Language I speak:</b>
        </div>
        <div className="language-list" style={{ marginBottom: 8 }}>
          {AVAILABLE_LANGUAGES.map((lang) => (
            <button
              key={"base-" + lang.code}
              className={`btn ${lang.code === tempBase.code ? "selected" : ""}`}
              style={{ minWidth: 85 }}
              onClick={() => setTempBase(lang)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div>
          <b>Language I want to learn:</b>
        </div>
        <div className="language-list">
          {AVAILABLE_LANGUAGES
            .filter((lang) => lang.code !== tempBase.code) // cannot pick same
            .map((lang) => (
              <button
                key={"target-" + lang.code}
                className={`btn ${lang.code === tempTarget.code ? "selected" : ""}`}
                style={{ minWidth: 85 }}
                onClick={() => setTempTarget(lang)}
              >
                {lang.label}
              </button>
            ))}
        </div>
      </div>
      {showWarning && (
        <div style={{ color: "#e87a41", margin: "9px 0", fontWeight: 600 }}>
          Please select two distinct languages.
        </div>
      )}
      <button
        className="btn btn-accent"
        style={{ marginTop: 10 }}
        onClick={handleSave}
        disabled={showWarning}
      >
        Save Languages
      </button>
      <div style={{ marginTop: 18, fontSize: "1rem", color: "var(--primary-color)" }}>
        <b>Selected:</b> {tempBase.label} → {tempTarget.label}
      </div>
      <div style={{ marginTop: 5, color: "var(--text-secondary)", fontSize: "0.98rem" }}>
        Words will be shown in <b>{tempTarget.label}</b> with their meaning in <b>{tempBase.label}</b>.
      </div>
    </div>
  );
}
export default LanguageSelector;
