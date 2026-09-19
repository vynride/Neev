import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import MentorSidebar from "../../components/mentor/MentorSidebar";
import MentorNavbar from "../../components/mentor/MentorNavbar";

export default function MentorLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mentor-app-layout">
      {/* Sidebar Navigation */}
      <MentorSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Right Content Area */}
      <div className="mentor-main-container">
        <MentorNavbar onToggleSidebar={() => setMobileOpen(!mobileOpen)} />
        <main className="mentor-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
