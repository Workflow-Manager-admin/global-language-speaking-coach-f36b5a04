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

/**
 * LanguageSelector refactored for multi-language selection:
 * Users may select multiple base and target languages via checkboxes.
 */
function LanguageSelector() {
  const {
    baseLanguage,
    setBaseLanguage,
    selectedLanguage,
    setSelectedLanguage,
  } = useProgress();

  // Multi-select: store arrays of language objects
  const [tempBase, setTempBase] = useState(Array.isArray(baseLanguage) ? baseLanguage : baseLanguage ? [baseLanguage] : []);
  const [tempTarget, setTempTarget] = useState(Array.isArray(selectedLanguage) ? selectedLanguage : selectedLanguage ? [selectedLanguage] : []);

  function toggleLanguage(selected, arr, setArr) {
    const found = arr.find(l => l.code === selected.code);
    if (found) setArr(arr.filter(l => l.code !== selected.code));
    else setArr([...arr, selected]);
  }

  function handleSave() {
    setBaseLanguage(tempBase);
    setSelectedLanguage(tempTarget);
  }

  // Prevent any overlap between base and target languages
  const overlap = tempBase.some(b => tempTarget.some(t => t.code === b.code));
  // Disallow saving if any language is selected in both
  const showWarning = overlap || tempTarget.length === 0 || tempBase.length === 0;

  return (
    <div className="language-selector-page">
      <h2>Select Your Languages</h2>
      <div style={{ marginBottom: 18 }}>
        <div>
          <b>Language(s) I speak:</b>
        </div>
        <div className="language-list" style={{ marginBottom: 8 }}>
          {AVAILABLE_LANGUAGES.map((lang) => (
            <label key={"base-" + lang.code} style={{ minWidth: 90, display: "inline-flex", alignItems: "center", fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={!!tempBase.find(l => l.code === lang.code)}
                onChange={() => toggleLanguage(lang, tempBase, setTempBase)}
                style={{ marginRight: 5 }}
              />
              {lang.label}
            </label>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div>
          <b>Language(s) I want to learn:</b>
        </div>
        <div className="language-list">
          {AVAILABLE_LANGUAGES
            .map((lang) => (
              <label key={"target-" + lang.code} style={{ minWidth: 90, display: "inline-flex", alignItems: "center", fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={!!tempTarget.find(l => l.code === lang.code)}
                  onChange={() => toggleLanguage(lang, tempTarget, setTempTarget)}
                  disabled={!!tempBase.find(b => b.code === lang.code)}
                  style={{ marginRight: 5 }}
                />
                {lang.label}
              </label>
            ))}
        </div>
      </div>
      {showWarning && (
        <div style={{ color: "#e87a41", margin: "9px 0", fontWeight: 600 }}>
          Please select at least one language each for base and target, with no overlaps.
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
        <b>Selected Bases:</b> {tempBase.length ? tempBase.map(l => l.label).join(", ") : "(none)"}
        <br />
        <b>Selected Targets:</b> {tempTarget.length ? tempTarget.map(l => l.label).join(", ") : "(none)"}
      </div>
      <div style={{ marginTop: 5, color: "var(--text-secondary)", fontSize: "0.98rem" }}>
        Words will be shown in your selected <b>target</b> languages with meanings in your <b>base</b> languages.<br />
        (You may add or remove multiple languages at any time.)
      </div>
    </div>
  );
}
export default LanguageSelector;
