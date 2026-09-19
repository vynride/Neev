import React from "react";
import { Bot, User, ShieldCheck } from "lucide-react";

export default function ChatHistory({ messages = [] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxHeight: "420px",
        overflowY: "auto",
        padding: "1rem",
        backgroundColor: "#f8faf9",
        borderRadius: "14px",
        border: "1px solid #eaecf0"
      }}
    >
      {messages.map((msg, index) => {
        const isAI = msg.sender.toLowerCase().includes("ai");
        const isMentor = msg.sender.toLowerCase().includes("mentor");
        const isStudent = msg.sender.toLowerCase().includes("student");

        return (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: isStudent ? "flex-start" : "flex-end",
              maxWidth: "85%",
              alignSelf: isStudent ? "flex-start" : "flex-end"
            }}
          >
            {/* Sender Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: isAI ? "#064e3b" : isMentor ? "#0369a1" : "#475569",
                marginBottom: "0.25rem"
              }}
            >
              {isAI && <Bot size={14} color="#064e3b" />}
              {isMentor && <ShieldCheck size={14} color="#0369a1" />}
              {isStudent && <User size={14} color="#475569" />}
              <span>{msg.sender}</span>
              <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: "4px" }}>
                • {msg.time}
              </span>
            </div>

            {/* Chat Bubble */}
            <div
              style={{
                padding: "0.85rem 1.1rem",
                borderRadius: isStudent
                  ? "16px 16px 16px 4px"
                  : "16px 16px 4px 16px",
                backgroundColor: isAI
                  ? "#e6f4ea"
                  : isMentor
                  ? "#e0f2fe"
                  : "#ffffff",
                color: isAI
                  ? "#064e3b"
                  : isMentor
                  ? "#0369a1"
                  : "#0f172a",
                border: isStudent ? "1px solid #e2e8f0" : "1px solid transparent",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                fontSize: "0.875rem",
                lineHeight: "1.5"
              }}
            >
              {msg.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
