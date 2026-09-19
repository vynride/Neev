import React from "react";

export default function StatusBadge({ status, priority, type }) {
  const value = (status || priority || type || "").toString();
  const lower = value.toLowerCase();

  let colorClass = "green";
  if (["high", "critical", "open", "rose"].includes(lower)) {
    colorClass = "rose";
  } else if (["medium", "needs attention", "amber", "low"].includes(lower)) {
    colorClass = "amber";
  } else if (["in progress", "planning", "blue"].includes(lower)) {
    colorClass = "blue";
  } else if (["on track", "resolved", "completed", "in development", "active"].includes(lower)) {
    colorClass = "green";
  }

  return (
    <span className={`status-badge ${colorClass}`}>
      {value.toUpperCase()}
    </span>
  );
}
