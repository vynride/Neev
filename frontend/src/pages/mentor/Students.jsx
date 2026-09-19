import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentTable from "../../components/mentor/StudentTable";
import { initialStudents } from "../../data/mentorData";
import { Search, Users } from "lucide-react";

export default function Students() {
  const navigate = useNavigate();
  const [students] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.currentProject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Assigned Students
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#64748b", marginTop: "4px" }}>
            Overview of all students assigned to your mentorship.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: "280px" }}>
          <Search
            size={18}
            color="#64748b"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student or project..."
            style={{
              width: "100%",
              padding: "0.65rem 1rem 0.65rem 2.4rem",
              borderRadius: "9999px",
              border: "1px solid #eaecf0",
              backgroundColor: "#ffffff",
              fontSize: "0.875rem",
              outline: "none"
            }}
            id="students-search-input"
          />
        </div>
      </div>

      {/* Main Student Table Card */}
      <div className="barabari-card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #eaecf0" }}>
          <Users size={20} color="#064e3b" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            Student Roster ({filteredStudents.length})
          </h2>
        </div>

        <StudentTable students={filteredStudents} />
      </div>
    </div>
  );
}
