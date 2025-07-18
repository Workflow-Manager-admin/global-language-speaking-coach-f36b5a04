import React from "react";

/**
 * ExplainMyAnswer - renders an LLM-like or template-based explanation when a user gets an answer wrong.
 * For production, this could call a backend/LLM API. For now, generates some plausible error explanations from templates.
 * 
 * PUBLIC_INTERFACE
 * @param {string} correct - the correct answer
 * @param {string} userInput - the user's answer
 * @param {object} [options] - { type: "grammar" | "spelling" | "vocab" | "other", translation: string }
 */
function ExplainMyAnswer({ correct, userInput, options = {} }) {
  // Very basic difference finder (deterministic)
  function getMistakeType(correct, userInput) {
    if (!userInput) return "none";
    const c = (correct || "").trim().toLowerCase();
    const u = (userInput || "").trim().toLowerCase();
    if (c === u) return "none";
    if (c.replace(/[^a-zA-ZÀ-ÿ \-']/g, "") === u.replace(/[^a-zA-ZÀ-ÿ \-']/g, ""))
      return "spelling";
    if (c.split(" ").length > 1 && u.split(" ").length === 1)
      return "missing_words";
    if (u && c && u[0] === c[0] && u.length < c.length)
      return "incomplete";
    if (u && c && u.length === c.length && u !== c)
      return "spelling";
    return "vocab";
  }

  const type = getMistakeType(correct, userInput);

  // Explanations mapped to mistake type (can be expanded)
  const templates = {
    spelling: `It looks like you made a spelling mistake. Make sure to check the letters in "${correct}".`,
    missing_words: `Your answer is missing one or more words. The full phrase is: "${correct}".`,
    incomplete: `Almost there! Try giving a more complete answer: "${correct}".`,
    vocab: `The correct answer is "${correct}". Try to remember the vocabulary for this prompt.`,
    none: `Check your answer and try again!`,
    other: `That's not correct. The correct answer is "${correct}".`,
  };

  let explanation = templates[type] || templates.other;
  if (type === "none" && !userInput) {
    explanation = "No answer was given. Please enter your answer to receive feedback.";
  } else if (options.translation) {
    // Optionally give translation as extra help
    explanation += `\n\nHint: In your base language, this means "${options.translation}".`;
  }

  return (
    <div
      className="explain-my-answer-box"
      style={{
        marginTop: 13,
        padding: "13px 17px",
        border: "1.2px solid #f3cd58",
        background: "#fcfde7",
        borderRadius: 8,
        color: "#7c6808",
        fontStyle: "italic",
        fontSize: "1.08em",
        maxWidth: 420,
      }}
      aria-live="polite"
    >
      <b>Why is this wrong?</b>
      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{explanation}</div>
    </div>
  );
}

export default ExplainMyAnswer;
