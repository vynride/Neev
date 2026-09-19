import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, LifeBuoy, Users } from 'lucide-react';
import { UserMenu } from '../../components/layout/UserMenu';
import { mentorDeskService } from '../../services/mentorDeskService';

// Fired when a ticket is resolved, so the count in the sidebar drops straight away
export const TICKETS_CHANGED = 'saathi:tickets-changed';
const POLL_MS = 20000;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
  { label: 'Escalations', path: '/mentor/escalations', icon: LifeBuoy, badge: true },
  { label: 'Students', path: '/mentor/students', icon: Users }
];

const titleFor = (pathname) => {
  if (pathname.startsWith('/mentor/escalations/')) return 'Escalation';
  if (pathname.startsWith('/mentor/students/')) return 'Student';
  return NAV_ITEMS.find((i) => i.path === pathname)?.label || '';
};

export default function MentorLayout() {
  const location = useLocation();
  const [openCount, setOpenCount] = useState(0);

  const loadCount = useCallback(() => {
    mentorDeskService
      .listTickets('open')
      .then((list) => setOpenCount(list.filter((t) => t.kind === 'ticket').length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCount();
    const timer = setInterval(loadCount, POLL_MS);
    window.addEventListener(TICKETS_CHANGED, loadCount);
    return () => {
      clearInterval(timer);
      window.removeEventListener(TICKETS_CHANGED, loadCount);
    };
  }, [loadCount]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)' }}>
      <aside style={{ width: '248px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 20px 22px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.svg" alt="Barabari" style={{ width: '32px', height: '32px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>Barabari</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-subtle)' }}>Mentor desk</div>
          </div>
        </div>

        <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="hover-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.87rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  background: active ? 'var(--color-primary-subtle)' : undefined
                }}
              >
                <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && openCount > 0 && (
                  <span className="fade-enter" style={{ fontSize: '0.68rem', fontWeight: 700, background: 'var(--color-accent)', color: '#FFFFFF', borderRadius: '999px', padding: '1px 7px' }}>
                    {openCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border-subtle)', fontSize: '0.72rem', color: 'var(--color-text-subtle)', lineHeight: 1.5 }}>
          Students ask the AI mentor first. Only what it cannot resolve reaches you.
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 28px', borderBottom: '1px solid var(--color-border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{titleFor(location.pathname)}</span>
          <UserMenu showProfile={false} />
        </header>
        <main style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div key={location.pathname} className="page-enter" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
