import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const StudentLayout = () => {
  const location = useLocation();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(true);

  // Primary top-level sidebar items
  const primaryNavItems = [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Ask Mentor', path: '/student/mentor' },
    { label: 'Knowledge', path: '/student/knowledge' },
  ];

  // Dropdown items under Project Workspace (Tasks, Progress)
  const workspaceDropdownItems = [
    { label: 'Tasks', path: '/student/project?tab=tasks' },
    { label: 'Progress', path: '/student/project?tab=overview' },
    { label: 'Client Calls', path: '/student/project?tab=calls' }
  ];

  const isWorkspaceActive = location.pathname === '/student/project';

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: 'var(--bg-app)' }}>
      {/* Sidebar Desktop */}
      <aside
        style={{
          width: '248px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          flexShrink: 0
        }}
        className="hidden md:flex"
      >
        {/* Brand Header */}
        <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <img src="/logo.svg" alt="Barabari" style={{ width: '36px', height: '36px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.18rem', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              Barabari
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Skills today. Equal tomorrow.
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {/* Primary Top-level Items */}
          {primaryNavItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  background: isActive ? 'var(--bg-accent-soft)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Collapsible Dropdown: Workspace (Tasks, Progress) */}
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: isWorkspaceActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isWorkspaceActive ? '#F0FDF4' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Project Hub</span>
              {workspaceDropdownOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>

            {/* Sub-items inside Dropdown */}
            {workspaceDropdownOpen && (
              <div style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {workspaceDropdownItems.map((subItem) => {
                  const isSubActive = location.pathname + location.search === subItem.path;

                  return (
                    <NavLink
                      key={subItem.label}
                      to={subItem.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        fontWeight: isSubActive ? 700 : 500,
                        color: isSubActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        background: isSubActive ? '#DCFCE7' : 'transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{subItem.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Profile Section in Sidebar */}
          <NavLink
            to="/student/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: location.pathname === '/student/profile' ? 700 : 500,
              color: location.pathname === '/student/profile' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: location.pathname === '/student/profile' ? 'var(--bg-accent-soft)' : 'transparent',
              borderLeft: location.pathname === '/student/profile' ? '3px solid var(--color-primary)' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer Tag */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-subtle)', background: '#FAFBF8' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Project Saathi
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Barabari Mentorship MVP
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Page Content Viewport */}
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
