import React from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { ArrowRight, Clock, FolderGit2, User } from "lucide-react";

export default function EscalationCard({ escalation }) {
  const navigate = useNavigate();

  return (
    <div
      className="barabari-card"
      style={{
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease"
      }}
      onClick={() => navigate(`/mentor/escalations/${escalation.id}`)}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Avatar */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: "#064e3b",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem"
            }}
          >
            {escalation.studentName
              ? escalation.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "ST"}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
              {escalation.studentName}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{escalation.studentCode}</span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <FolderGit2 size={12} /> {escalation.projectName}
              </span>
            </div>
          </div>
        </div>

        {/* Priority & Status Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <StatusBadge priority={escalation.priority} />
          <StatusBadge status={escalation.status} />
        </div>
      </div>

      {/* Problem Title & Description Preview */}
      <div>
        <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#064e3b", marginBottom: "0.35rem" }}>
          {escalation.title}
        </h4>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#475569",
            lineHeight: "1.5",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {escalation.description}
        </p>
      </div>

      {/* Footer Meta Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "0.75rem",
          borderTop: "1px solid #f1f5f9",
          fontSize: "0.75rem",
          color: "#94a3b8"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Clock size={14} color="#64748b" />
          <span>Created: {escalation.created || escalation.timeAgo}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/mentor/escalations/${escalation.id}`);
          }}
          className="btn-brand"
          style={{ padding: "0.35rem 0.85rem", fontSize: "0.775rem" }}
        >
          View Details
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
