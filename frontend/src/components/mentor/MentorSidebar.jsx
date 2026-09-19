import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, AlertTriangle, Users, Sparkles, X, Inbox } from "lucide-react";

export default function MentorSidebar({ mobileOpen, onCloseMobile }) {
  const location = useLocation();

  const menuItems = [
    {
      name: "Live Tickets",
      icon: Inbox,
      path: "/mentor/desk",
    },
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/mentor/dashboard",
    },
    {
      name: "Escalations",
      icon: AlertTriangle,
      path: "/mentor/escalations",
    },
    {
      name: "Students",
      icon: Users,
      path: "/mentor/students",
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 190
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`mentor-sidebar-container ${mobileOpen ? "mobile-open" : ""}`}
        style={{
          width: "260px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #eaecf0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.5rem 1rem",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 200,
          transition: "transform 0.3s ease"
        }}
      >
        <div>
          {/* Brand Logo & Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 0.5rem 1.75rem 0.5rem",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: "1.5rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Eight-pointed / Spark icon in coral/terracotta matching image */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#e05638",
                  boxShadow: "0 2px 6px rgba(224, 86, 56, 0.15)"
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    color: "#064e3b",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.1"
                  }}
                >
                  Barabari
                </h2>
                <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px", fontWeight: 500 }}>
                  Skills today. Equal tomorrow.
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              style={{
                display: "none",
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer"
              }}
              className="mobile-close-btn"
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Menu Navigation */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              // Check active status
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/mentor/dashboard" && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.75rem 1.1rem",
                    borderRadius: "9999px",
                    fontSize: "0.925rem",
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "#064e3b" : "#475569",
                    backgroundColor: isActive ? "#e6f4ea" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                  className={({ isActive: navActive }) =>
                    navActive ? "sidebar-link active" : "sidebar-link"
                  }
                >
                  <Icon
                    size={20}
                    color={isActive ? "#064e3b" : "#64748b"}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Brand Info matching image bottom left "Project Saathi" */}
        <div
          style={{
            padding: "0.85rem 1rem",
            backgroundColor: "#f8faf9",
            borderRadius: "12px",
            border: "1px solid #eaecf0"
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#064e3b" }}>
            Project Saathi
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
            Barabari Mentorship MVP
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .mentor-sidebar-container {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          }
          .mentor-sidebar-container.mobile-open {
            transform: translateX(0) !important;
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
