import React from "react";
import { Menu } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

export default function MentorNavbar({ onToggleSidebar }) {
  return (
    <header
      style={{
        height: "68px",
        backgroundColor: "var(--bg-nav)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-light)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.75rem",
        position: "sticky",
        top: 0,
        zIndex: 90
      }}
    >
      {/* Mobile Toggle Button */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            color: "#334155"
          }}
          className="mobile-toggle-btn"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right Side: ONLY Avatar Dropdown */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <ProfileDropdown />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
