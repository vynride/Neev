import React, { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown, Shield } from "lucide-react";
import { mentorProfile } from "../../data/mentorData";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "9999px"
        }}
        aria-label="User Profile Menu"
        id="mentor-profile-avatar-btn"
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            backgroundColor: "#064e3b",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "0.95rem",
            border: "2px solid #e6f4ea",
            boxShadow: "0 2px 5px rgba(0,0,0,0.08)"
          }}
        >
          AK
        </div>
        <ChevronDown size={16} color="#64748b" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "52px",
            width: "260px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #eaecf0",
            boxShadow: "var(--shadow-dropdown)",
            zIndex: 1000,
            overflow: "hidden",
            padding: "0.5rem"
          }}
        >
          {/* Header Info */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: "0.25rem"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
              {mentorProfile.name}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
              {mentorProfile.email}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "6px",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#064e3b",
                backgroundColor: "#e6f4ea",
                padding: "2px 8px",
                borderRadius: "9999px"
              }}
            >
              <Shield size={12} />
              Senior Mentor
            </div>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.85rem",
                border: "none",
                background: "transparent",
                borderRadius: "8px",
                color: "#334155",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <User size={16} color="#64748b" />
              Profile
            </button>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.85rem",
                border: "none",
                background: "transparent",
                borderRadius: "8px",
                color: "#334155",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Settings size={16} color="#64748b" />
              Settings
            </button>
          </div>

          <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "0.35rem 0" }} />

          {/* Logout Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              alert("Logged out successfully.");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.85rem",
              border: "none",
              background: "transparent",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              transition: "background-color 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LogOut size={16} color="#dc2626" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
