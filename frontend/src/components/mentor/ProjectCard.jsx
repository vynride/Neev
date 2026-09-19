import React from "react";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";
import { Calendar, CheckCircle2, Flag, Layers } from "lucide-react";

export default function ProjectCard({ project, showStepper = true }) {
  const stages = ["Planning", "Development", "Testing", "Deployment"];
  const currentStageIndex = stages.findIndex(
    (s) => s.toLowerCase() === (project.stage || "development").toLowerCase()
  );

  return (
    <div className="barabari-card" style={{ marginBottom: "1.25rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "0.85rem"
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
            {project.name}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "4px" }}>
            {project.description}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Progress */}
      <div style={{ margin: "1rem 0" }}>
        <ProgressBar progress={project.progress} showText={true} height={10} />
      </div>

      {/* Dates & Milestones */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          padding: "0.85rem 1rem",
          backgroundColor: "#f8faf9",
          borderRadius: "12px",
          border: "1px solid #eaecf0",
          marginBottom: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={16} color="#064e3b" />
          <div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>
              Timeline
            </div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>
              {project.startDate} — {project.expectedCompletion}
            </div>
          </div>
        </div>

        {project.tasksCompleted && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} color="#064e3b" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>
                Tasks Completed
              </div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#064e3b" }}>
                {project.tasksCompleted}
              </div>
            </div>
          </div>
        )}

        {project.currentMilestone && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Flag size={16} color="#064e3b" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>
                Current Milestone
              </div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>
                {project.currentMilestone}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage Stepper Visual */}
      {showStepper && (
        <div style={{ margin: "1.25rem 0" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.6rem" }}>
            Current Stage
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative"
            }}
          >
            {stages.map((stage, idx) => {
              const isPassed = idx <= (currentStageIndex >= 0 ? currentStageIndex : 1);
              const isCurrent = idx === (currentStageIndex >= 0 ? currentStageIndex : 1);

              return (
                <div
                  key={stage}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: isPassed ? "#064e3b" : "#e2e8f0",
                      color: isPassed ? "#ffffff" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      border: isCurrent ? "3px solid #e6f4ea" : "none",
                      boxShadow: isCurrent ? "0 0 0 2px #064e3b" : "none"
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "#064e3b" : isPassed ? "#334155" : "#94a3b8",
                      marginTop: "4px"
                    }}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tech Stack Badges */}
      {project.techStack && project.techStack.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.35rem" }}>
            Tech Stack
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {project.techStack.map((tech) => (
              <span
                key={tech}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "#e6f4ea",
                  color: "#064e3b",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px"
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
