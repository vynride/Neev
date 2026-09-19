import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, Clock, User, ShieldCheck } from "lucide-react";
import StatusBadge from "../../components/mentor/StatusBadge";
import ProgressBar from "../../components/mentor/ProgressBar";
import ChatHistory from "../../components/mentor/ChatHistory";
import { initialEscalations } from "../../data/mentorData";

export default function EscalationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find escalation from mock data
  const initialTicket =
    initialEscalations.find((e) => e.id === id) || initialEscalations[0];

  const [escalation, setEscalation] = useState(initialTicket);
  const [responseText, setResponseText] = useState("");

  if (!escalation) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Escalation Ticket Not Found</h2>
        <Link to="/mentor/escalations" className="btn-brand" style={{ marginTop: "1rem" }}>
          Back to Escalations
        </Link>
      </div>
    );
  }

  // Handle adding response to chat history
  const handleSendResponse = (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "Mentor",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: responseText.trim()
    };

    setEscalation((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, newMessage]
    }));

    setResponseText("");
  };

  // Handle status updates
  const handleUpdateStatus = (newStatus) => {
    setEscalation((prev) => ({
      ...prev,
      status: newStatus
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Back Button & Top Action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => navigate("/mentor/escalations")}
          className="btn-outline"
          style={{ padding: "0.5rem 1rem" }}
        >
          <ArrowLeft size={16} />
          Back to Escalations
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <StatusBadge priority={escalation.priority} />
          <StatusBadge status={escalation.status} />
        </div>
      </div>

      {/* Main Grid: Left Student & Problem Details, Right Chat History & Response */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "1.5rem"
        }}
        className="escalation-detail-grid"
      >
        {/* Left Column: Student Context & Problem Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Student Context Card */}
          <div className="barabari-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid #eaecf0" }}>
              Student Context
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Student Name</span>
                <span style={{ fontWeight: 700, color: "#064e3b" }}>{escalation.studentName}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Student ID</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{escalation.studentCode}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Email</span>
                <span style={{ fontWeight: 500, color: "#0f172a" }}>{escalation.studentEmail}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Current Semester</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>Semester {escalation.semester}</span>
              </div>

              <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "0.25rem 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Project</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{escalation.projectName}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Project Status</span>
                <StatusBadge status={escalation.projectStatus} />
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <ProgressBar progress={escalation.projectCompletion} showText={true} />
              </div>

              {/* Tech Stack Badges */}
              {escalation.techStack && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, marginBottom: "0.35rem" }}>
                    Tech Stack
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {escalation.techStack.map((tech) => (
                      <span
                        key={tech}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: "#e6f4ea",
                          color: "#064e3b",
                          padding: "0.2rem 0.6rem",
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
          </div>

          {/* Problem Details Card */}
          <div className="barabari-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
              Problem Details
            </h3>

            <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#064e3b", marginBottom: "0.5rem" }}>
              {escalation.title}
            </h4>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={14} /> Created: {escalation.created}
              </span>
            </div>

            <div style={{ backgroundColor: "#f8faf9", padding: "1rem", borderRadius: "12px", border: "1px solid #eaecf0" }}>
              <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: "1.6" }}>
                {escalation.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Chat History & Mentor Response */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Chat History Section */}
          <div className="barabari-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Student Chat History
            </h3>

            <ChatHistory messages={escalation.chatHistory || []} />
          </div>

          {/* Mentor Response & Status Actions */}
          <div className="barabari-card">
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
              Mentor Action & Response
            </h3>

            {/* Response Form */}
            <form onSubmit={handleSendResponse} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Add mentor response..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  border: "1px solid #eaecf0",
                  fontSize: "0.875rem",
                  outline: "none",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
                id="mentor-response-textarea"
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <button type="submit" className="btn-brand">
                  <Send size={16} />
                  Send Response
                </button>

                {/* Status Toggle Buttons */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {escalation.status !== "IN PROGRESS" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("IN PROGRESS")}
                      className="btn-outline"
                      style={{ padding: "0.5rem 0.85rem", fontSize: "0.8rem", color: "#0369a1" }}
                    >
                      Mark as In Progress
                    </button>
                  )}

                  {escalation.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="btn-outline"
                      style={{ padding: "0.5rem 0.85rem", fontSize: "0.8rem", color: "#064e3b", backgroundColor: "#e6f4ea", borderColor: "#a7f3d0" }}
                    >
                      <CheckCircle size={14} />
                      Resolve Escalation
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .escalation-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
