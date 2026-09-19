import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "#064e3b", bgColor = "#e6f4ea" }) {
  return (
    <div
      className="barabari-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "1.25rem 1.5rem"
      }}
    >
      <div>
        <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginTop: "0.25rem" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
            {subtitle}
          </div>
        )}
      </div>
      {Icon && (
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            backgroundColor: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            flexShrink: 0
          }}
        >
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
