import React from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

export default function StudentTable({ students }) {
  const navigate = useNavigate();

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #eaecf0" }}>
            <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Student
            </th>
            <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Projects
            </th>
            <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Current Project
            </th>
            <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", width: "220px" }}>
              Progress
            </th>
            <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              onClick={() => navigate(`/mentor/students/${student.id}`)}
              style={{
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
                transition: "background-color 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8faf9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {/* Student Avatar + Name */}
              <td style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: student.avatarBg || "#064e3b",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      flexShrink: 0
                    }}
                  >
                    {student.avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.925rem",
                        color: "#064e3b",
                        textDecoration: "none"
                      }}
                    >
                      {student.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {student.studentId}
                    </div>
                  </div>
                </div>
              </td>

              {/* Projects count */}
              <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>
                {student.projectsCount} {student.projectsCount === 1 ? "project" : "projects"}
              </td>

              {/* Current Project */}
              <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#0f172a", fontWeight: 600 }}>
                {student.currentProject}
              </td>

              {/* Progress Bar */}
              <td style={{ padding: "1rem" }}>
                <ProgressBar progress={student.currentProgress} showText={true} />
              </td>

              {/* Status */}
              <td style={{ padding: "1rem" }}>
                <StatusBadge status={student.projectStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
