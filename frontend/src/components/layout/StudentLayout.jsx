import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, PieChart, PhoneCall, BookOpen, SquarePen, MessageSquare } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { mentorService } from '../../services/mentorService';
import { relativeDay } from '../../services/format';
import { useAuth } from '../../context/AuthContext';

// Fired by the chat page when a chat is created, so the list here stays current
export const SESSIONS_CHANGED = 'saathi:sessions-changed';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', path: '/student/project?tab=tasks', icon: ListChecks },
  { label: 'Progress', path: '/student/project?tab=overview', icon: PieChart },
  { label: 'Client calls', path: '/student/project?tab=calls', icon: PhoneCall },
  { label: 'Knowledge', path: '/student/knowledge', icon: BookOpen }
];

const PAGE_TITLES = {
  '/student/dashboard': 'Dashboard',
  '/student/project': 'Project',
  '/student/mentor': 'AI Mentor',
  '/student/knowledge': 'Knowledge',
  '/student/profile': 'Profile'
};

const rowStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.87rem',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
  background: active ? 'var(--color-primary-subtle)' : undefined
});

export const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { project, projectId } = useAuth();
  const [sessions, setSessions] = useState([]);
  const here = location.pathname + location.search;
  const activeSession = location.pathname === '/student/mentor' ? new URLSearchParams(location.search).get('s') : null;

  const loadSessions = useCallback(() => {
    if (projectId) mentorService.listSessions(projectId).then(setSessions).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    loadSessions();
    window.addEventListener(SESSIONS_CHANGED, loadSessions);
    return () => window.removeEventListener(SESSIONS_CHANGED, loadSessions);
  }, [loadSessions]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)' }}>
      <aside
        style={{
          width: '264px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        {/* Brand */}
        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.svg" alt="Barabari" style={{ width: '32px', height: '32px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              Barabari
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-subtle)' }}>Project Saathi</div>
          </div>
        </div>

        <div style={{ padding: '4px 12px 12px' }}>
          <button
            onClick={() => navigate('/student/mentor')}
            className="btn-primary"
            style={{ width: '100%', padding: '9px 14px', fontSize: '0.86rem', borderRadius: 'var(--radius-md)' }}
          >
            <SquarePen size={15} /> New chat
          </button>
        </div>

        <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => {
            const active = item.path.includes('?') ? here === item.path : location.pathname === item.path;
            return (
              <NavLink key={item.label} to={item.path} className="hover-row" style={rowStyle(active)}>
                <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Chat history */}
        <div style={{ padding: '18px 24px 6px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-subtle)' }}>
          Your chats
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sessions.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              Your conversations with the AI mentor will be listed here.
            </div>
          )}
          {sessions.map((s) => {
            const active = s.id === activeSession;
            return (
              <NavLink
                key={s.id}
                to={`/student/mentor?s=${s.id}`}
                className="hover-row"
                title={s.first_message}
                style={{ ...rowStyle(active), alignItems: 'flex-start', padding: '7px 12px' }}
              >
                <MessageSquare size={14} style={{ flexShrink: 0, marginTop: '3px' }} strokeWidth={1.8} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.83rem', color: active ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                    {s.first_message || 'New chat'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-subtle)', fontWeight: 400 }}>{relativeDay(s.updated_at)}</div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        {/* Top bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 28px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--bg-surface)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{PAGE_TITLES[location.pathname] || ''}</span>
            {project && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {project.name}
              </span>
            )}
          </div>
          <UserMenu />
        </header>

        <main style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Keyed by path, so each page eases in when you switch */}
          <div key={location.pathname} className="page-enter" style={{ flex: 1, padding: '24px 28px', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
