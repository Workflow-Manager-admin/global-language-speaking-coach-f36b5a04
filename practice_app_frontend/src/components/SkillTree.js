import React from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import "../App.css";

// PUBLIC_INTERFACE
/**
 * SkillTree component: Renders level progression as a skill tree layout.
 * Locked nodes are shown grayed out; unlocked nodes are clickable.
 * Prerequisite (must have score >=75% for previous) is enforced.
 */
function SkillTree() {
  const { levels, nextAvailableLevel } = useProgress();
  const navigate = useNavigate();

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
        {nodeStates.map((node, idx) => (
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
            <SkillNode node={node}
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
          </div>
        ))}
      </div>
      <div style={{ marginTop: 38, textAlign: "center", color: "#666", fontSize: ".99em" }}>
        <div>
          <span style={{ color: "var(--accent-color)", fontWeight: 600 }}>Green = Unlocked</span>,
          <span style={{ color: "#aaa", marginLeft: 10 }}> 🔒 Locked (pass prior test &gt;= 75%)</span>
        </div>
        <div style={{ marginTop: 12 }}>
          Click an unlocked node to enter its lesson.
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
