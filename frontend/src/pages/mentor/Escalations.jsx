import React, { useState } from "react";
import EscalationFilters from "../../components/mentor/EscalationFilters";
import EscalationCard from "../../components/mentor/EscalationCard";
import { initialEscalations } from "../../data/mentorData";
import { AlertCircle } from "lucide-react";

export default function Escalations() {
  const [escalations] = useState(initialEscalations);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");

  // Filtering logic
  const filteredEscalations = escalations.filter((esc) => {
    // Search match
    const matchesSearch =
      esc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      esc.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      esc.title.toLowerCase().includes(searchTerm.toLowerCase());

    // Status match
    const matchesStatus =
      statusFilter === "All" ||
      esc.status.toLowerCase() === statusFilter.toLowerCase();

    // Priority match
    const matchesPriority =
      priorityFilter === "All Priority" ||
      esc.priority.toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Escalations
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#64748b", marginTop: "4px" }}>
          Review and resolve issues raised by your students.
        </p>
      </div>

      {/* Search & Filters */}
      <EscalationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      {/* Escalation List */}
      <div>
        {filteredEscalations.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredEscalations.map((esc) => (
              <EscalationCard key={esc.id} escalation={esc} />
            ))}
          </div>
        ) : (
          <div
            className="barabari-card"
            style={{
              textAlign: "center",
              padding: "3rem 1.5rem",
              color: "#64748b"
            }}
          >
            <AlertCircle size={40} color="#94a3b8" style={{ marginBottom: "0.75rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155" }}>
              No escalations found
            </h3>
            <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Try adjusting your search query or filter settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
