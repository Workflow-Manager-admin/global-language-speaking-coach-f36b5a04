import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * SkillTree component: Renders level progression as a skill tree layout.
 * Locked nodes are shown grayed out; unlocked nodes are clickable.
 * Prerequisite (must have score >=75% for previous) is enforced.
 * If a level is completed, 'Repeat Level' is offered to allow practice/test again.
 */
function SkillTree() {
  const { levels, nextAvailableLevel } = useProgress();
  const navigate = useNavigate();
  // Track which (if any) level is being repeated for visual feedback, per session.
  const [repeatState, setRepeatState] = useState({});

  // Calculate unlock status for each node
  // The first is always unlocked
  // Each next is unlocked only if previous testScore.score >= 75
  const nodeStates = levels.map((lvl, idx) => {
    if (idx === 0) return { ...lvl, unlocked: true, locked: false, nodeIdx: idx };
    const prev = levels[idx - 1];
    const passedPrior = prev.testScore && prev.testScore.passed;
    return {
      ...lvl,
      unlocked: passedPrior,
      locked: !passedPrior,
      nodeIdx: idx,
    };
  });

  // Handler to activate repeat mode on a completed level (for lesson & challenge)
  function handleRepeatLevel(levelNum) {
    // Option: add more logic here for analytics or trophy (this is just UI gating)
    setRepeatState((state) => ({ ...state, [levelNum]: Date.now() }));
    // When repeating, navigate to lesson for that level (can also offer test shortcut)
    navigate(`/lesson/${levelNum}?repeat=1`);
  }

  // Visually lay out as vertical or zig-zag tree for simplicity
  // (A more complex tree is possible but this gives a clear progression)
  return (
    <div className="skill-tree-page" style={{ maxWidth: 550, margin: "30px auto" }}>
      <h2>Skill Tree</h2>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26
      }}>
        {nodeStates.map((node, idx) => {
          const isCompleted = node.testScore && node.testScore.passed;
          return (
            <div
              key={node.level}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 18
              }}
            >
              {/* Draw branch line except first node */}
              {idx !== 0 && (
                <div style={{
                  width: 3,
                  height: 32,
                  background: nodeStates[idx-1].unlocked
                    ? "var(--accent-color)"
                    : "#ccc",
                  marginRight: 14
                }} />
              )}
              <SkillNode 
                node={node}
                highlight={node.unlocked && !node.locked}
                locked={node.locked}
                onClick={() => {
                  if (!node.locked) navigate(`/lesson/${node.level}`);
                }}
              />
              <span style={{
                marginLeft: 14,
                color: node.locked
                  ? "#bbb"
                  : (node.unlocked ? "var(--accent-color)" : "#222"),
                fontWeight: node.unlocked ? 700 : 500,
              }}>
                {node.locked ? "🔒" : "🟢"}
                {node.unlocked && !node.locked && !node.locked
                  ? " Unlocked" : " Locked"}
              </span>
              {/* Node test info */}
              <span style={{
                marginLeft: 10,
                fontSize: ".99em",
                color: node.testScore
                  ? (node.testScore.passed ? "var(--accent-color)" : "#cc4444")
                  : "#666"
              }}>
                {node.testScore
                  ? (node.testScore.passed
                      ? `✅ ${node.testScore.score}%`
                      : `❌ ${node.testScore.score}%`)
                  : "No test"}
              </span>
              {/* Add 'Repeat Level' button if completed */}
              {isCompleted && (
                <button
                  className="btn btn-primary"
                  style={{
                    marginLeft: 16,
                    fontSize: "0.96em",
                    padding: "6px 17px",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    boxShadow: repeatState[node.level] ? '0 0 7px 1px #aefc93' : undefined,
                  }}
                  aria-label={`Repeat Level ${node.level}`}
                  onClick={() => handleRepeatLevel(node.level)}
                >
                  🔁 Repeat Level
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 38, textAlign: "center", color: "#666", fontSize: ".99em" }}>
        <div>
          <span style={{ color: "var(--accent-color)", fontWeight: 600 }}>Green = Unlocked</span>,
          <span style={{ color: "#aaa", marginLeft: 10 }}> 🔒 Locked (pass prior test &gt;= 75%)</span>
        </div>
        <div style={{ marginTop: 12 }}>
          Click an unlocked node to enter its lesson.<br />
          <span style={{ color: "#198b42", fontWeight: 500 }}>
            Completed levels can be repeated for extra practice or to re-test, without erasing your progress.
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Node in the skill tree for a module/level.
 */
function SkillNode({ node, highlight, locked, onClick }) {
  return (
    <button
      className="skill-tree-node"
      style={{
        background: locked
          ? "#ebecf0"
          : highlight
            ? "var(--accent-color)"
            : "#eaf3fb",
        color: locked ? "#aaa" : "#fff",
        border: locked ? "2px dashed #bbb" : `3px solid var(--primary-color)`,
        fontWeight: 700,
        borderRadius: "50%",
        width: 66,
        height: 66,
        fontSize: "1.23rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background .2s",
        cursor: locked ? "not-allowed" : "pointer",
        boxShadow: highlight ? "0 0 10px 1px #aed581" : undefined,
        outline: "none",
      }}
      disabled={locked}
      onClick={locked ? undefined : onClick}
      tabIndex={locked ? -1 : 0}
      aria-label={
        locked
          ? `Level ${node.level} (locked)`
          : `Level ${node.level} lesson`
      }
    >
      <span>
        {locked ? "🔒" : "⭐"}
        <br />
        {`L${node.level}`}
      </span>
    </button>
  );
}

export default SkillTree;
