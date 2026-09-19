import React from "react";

export default function ProgressBar({ progress = 0, showText = true, height = 8 }) {
  const percentage = Math.min(100, Math.max(0, Number(progress) || 0));

  return (
    <div style={{ width: "100%" }}>
      {showText && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            marginBottom: "0.35rem",
            color: "#475569",
            fontWeight: 500
          }}
        >
          <span>Progress</span>
          <span style={{ fontWeight: 700, color: "#064e3b" }}>{percentage}%</span>
        </div>
      )}
      <div
        className="progress-bar-container"
        style={{ height: `${height}px` }}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
