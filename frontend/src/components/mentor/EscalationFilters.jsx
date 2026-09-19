import React from "react";
import { Search, Filter } from "lucide-react";

export default function EscalationFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange
}) {
  const statusOptions = ["All", "Open", "In Progress", "Resolved"];
  const priorityOptions = ["All Priority", "Critical", "High", "Medium", "Low"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        {/* Search Input */}
        <div
          style={{
            position: "relative",
            flex: "1 1 300px",
            maxWidth: "450px"
          }}
        >
          <Search
            size={18}
            color="#64748b"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)"
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search student or project..."
            style={{
              width: "100%",
              padding: "0.65rem 1rem 0.65rem 2.4rem",
              borderRadius: "9999px",
              border: "1px solid #eaecf0",
              backgroundColor: "#ffffff",
              fontSize: "0.875rem",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
            id="escalation-search-input"
          />
        </div>

        {/* Priority Filter Select */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={16} color="#64748b" />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "9999px",
              border: "1px solid #eaecf0",
              backgroundColor: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
              outline: "none"
            }}
            id="escalation-priority-filter"
          >
            {priorityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          overflowX: "auto",
          paddingBottom: "4px"
        }}
      >
        {statusOptions.map((status) => {
          const isActive = statusFilter.toLowerCase() === status.toLowerCase();
          return (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: isActive ? "#064e3b" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: isActive ? "0 2px 6px rgba(6, 78, 59, 0.2)" : "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
}
