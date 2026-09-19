import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function ActivityTimeline({ items = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#e6f4ea",
              color: "#064e3b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px"
            }}
          >
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
              {item.text}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
              {item.date}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
