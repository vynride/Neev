import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, BookOpen, Layers, Award, AlertTriangle, ArrowRight } from "lucide-react";
import StatusBadge from "../../components/mentor/StatusBadge";
import ProgressBar from "../../components/mentor/ProgressBar";
import ProjectCard from "../../components/mentor/ProjectCard";
import ActivityTimeline from "../../components/mentor/ActivityTimeline";
import { initialStudents } from "../../data/mentorData";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Load student by ID
  const student = initialStudents.find((s) => s.id === id) || initialStudents[0];

  if (!student) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Student Not Found</h2>
        <Link to="/mentor/students" className="btn-brand" style={{ marginTop: "1rem" }}>
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Top Header & Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <button onClick={() => navigate("/mentor/students")} className="btn-outline">
          <ArrowLeft size={16} />
          Back to Students
        </button>

        <StatusBadge status={student.status} />
      </div>

      {/* Student Banner Header */}
      <div
        className="barabari-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          padding: "1.5rem",
          background: "linear-gradient(135deg, #ffffff 0%, #f8faf9 100%)"
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: student.avatarBg || "#064e3b",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "1.4rem",
            flexShrink: 0
          }}
        >
          {student.avatar}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
              {student.name}
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#064e3b",
                backgroundColor: "#e6f4ea",
                padding: "2px 10px",
                borderRadius: "9999px"
              }}
            >
              {student.studentId}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              marginTop: "6px",
              flexWrap: "wrap",
              fontSize: "0.85rem",
              color: "#64748b"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Mail size={14} /> {student.email}
            </span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <BookOpen size={14} /> {student.department} ({student.semester})
            </span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={14} /> Joined {student.joined}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "1.5rem"
        }}
        className="student-detail-grid"
      >
        {/* Left Column: Student Information & Technology Stack & Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Student Info Card */}
          <div className="barabari-card">
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #eaecf0"
              }}
            >
              Student Information
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Name</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{student.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Student ID</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{student.studentId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Email</span>
                <span style={{ fontWeight: 500, color: "#0f172a" }}>{student.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Semester</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{student.semester}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Department</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{student.department}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Joined</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{student.joined}</span>
              </div>

              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Current Overall Progress
                </div>
                <ProgressBar progress={student.overallProgress} showText={true} height={10} />
              </div>
            </div>
          </div>

          {/* Technology Stack Card */}
          <div className="barabari-card">
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Layers size={18} color="#064e3b" />
              Technology Stack
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {student.techStack.map((tech) => (
                <span
                  key={tech}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    backgroundColor: "#e6f4ea",
                    color: "#064e3b",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "9999px"
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="barabari-card">
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #eaecf0"
              }}
            >
              Recent Activity
            </h3>

            <ActivityTimeline items={student.activityTimeline || []} />
          </div>
        </div>

        {/* Right Column: Projects & Escalations History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Projects Section */}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Projects ({student.projects.length})
            </h2>

            {student.projects.map((proj) => (
              <ProjectCard key={proj.id} project={proj} showStepper={true} />
            ))}
          </div>

          {/* Escalations History Section */}
          <div className="barabari-card">
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <AlertTriangle size={18} color="#b91c1c" />
              Escalation History
            </h3>

            {student.escalationsHistory && student.escalationsHistory.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {student.escalationsHistory.map((esc) => (
                  <div
                    key={esc.id}
                    onClick={() => navigate(`/mentor/escalations/${esc.id}`)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.85rem 1rem",
                      backgroundColor: "#f8faf9",
                      borderRadius: "12px",
                      border: "1px solid #eaecf0",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e6f4ea")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8faf9")}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#064e3b" }}>
                        #{esc.id}
                      </div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
                        {esc.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                        {esc.date}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <StatusBadge priority={esc.priority} />
                      <StatusBadge status={esc.status} />
                      <ArrowRight size={16} color="#64748b" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "#64748b", fontStyle: "italic" }}>
                No escalations recorded for this student.
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .student-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
