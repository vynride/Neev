import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FolderGit2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import StatCard from "../../components/mentor/StatCard";
import StudentTable from "../../components/mentor/StudentTable";
import EscalationCard from "../../components/mentor/EscalationCard";
import ProgressBar from "../../components/mentor/ProgressBar";
import {
  mentorStats,
  initialStudents,
  initialEscalations
} from "../../data/mentorData";

export default function MentorDashboard() {
  const navigate = useNavigate();

  // Highlight recent escalations (up to 2)
  const recentEscalations = initialEscalations.slice(0, 2);

  // Top project progress items
  const projectProgressList = [
    { name: "AI Resume Analyzer", student: "Rahul Sharma", progress: 85, status: "On Track" },
    { name: "Medical AI Assistant", student: "Priya Reddy", progress: 65, status: "Needs Attention" },
    { name: "Smart Campus System", student: "Arjun Kumar", progress: 40, status: "On Track" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Top Banner / Greeting Header matching Barabari theme */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Good evening, Dr. Arun Kumar! 👋
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#64748b", marginTop: "4px" }}>
            Monitor student progress, projects, and escalations. Small steps make big progress.
          </p>
        </div>

        <button
          onClick={() => navigate("/mentor/escalations")}
          className="btn-brand"
        >
          <Sparkles size={16} />
          View Escalations
        </button>
      </div>

      {/* 5 Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem"
        }}
      >
        <StatCard
          title="Total Students"
          value={mentorStats.totalStudents}
          subtitle="Assigned to you"
          icon={Users}
          color="#064e3b"
          bgColor="#e6f4ea"
        />
        <StatCard
          title="Active Projects"
          value={mentorStats.activeProjects}
          subtitle="In progress"
          icon={FolderGit2}
          color="#0369a1"
          bgColor="#e0f2fe"
        />
        <StatCard
          title="Completed Projects"
          value={mentorStats.completedProjects}
          subtitle="Successfully delivered"
          icon={CheckCircle2}
          color="#15803d"
          bgColor="#dcfce7"
        />
        <StatCard
          title="Completion Rate"
          value={mentorStats.completionRate}
          subtitle="Average progress"
          icon={TrendingUp}
          color="#7c3aed"
          bgColor="#f3e8ff"
        />
        <StatCard
          title="Pending Escalations"
          value={mentorStats.pendingEscalations}
          subtitle="Action required"
          icon={AlertTriangle}
          color="#b91c1c"
          bgColor="#fee2e2"
        />
      </div>

      {/* Main Grid: Project Progress & Recent Escalations */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem"
        }}
        className="dashboard-main-grid"
      >
        {/* Left Column: Project Progress & Student Overview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Project Progress Section */}
          <div className="barabari-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #eaecf0"
              }}
            >
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                Project Progress
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                Active Sprints
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {projectProgressList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f8faf9",
                    borderRadius: "12px",
                    border: "1px solid #eaecf0"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem"
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "8px" }}>
                        Student: <strong style={{ color: "#064e3b" }}>{item.student}</strong>
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        backgroundColor: item.status === "On Track" ? "#e6f4ea" : "#fef3c7",
                        color: item.status === "On Track" ? "#064e3b" : "#9a3412"
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <ProgressBar progress={item.progress} showText={true} height={8} />
                </div>
              ))}
            </div>
          </div>

          {/* Student Overview Section */}
          <div className="barabari-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem"
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                  Student Overview
                </h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Click a student to view full details
                </p>
              </div>
              <button
                onClick={() => navigate("/mentor/students")}
                className="btn-outline"
                style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
              >
                View All
                <ArrowRight size={14} />
              </button>
            </div>

            <StudentTable students={initialStudents} />
          </div>
        </div>

        {/* Right Column: Recent Escalations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="barabari-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #eaecf0"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={18} color="#b91c1c" />
                Recent Escalations
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentEscalations.map((esc) => (
                <EscalationCard key={esc.id} escalation={esc} />
              ))}
            </div>

            <button
              onClick={() => navigate("/mentor/escalations")}
              className="btn-outline"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: "1rem",
                padding: "0.65rem",
                fontSize: "0.85rem"
              }}
            >
              View all escalations
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
