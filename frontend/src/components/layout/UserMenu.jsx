import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

// The avatar in the top right: profile and sign out
export const UserMenu = ({ showProfile = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.key === 'Escape' || (e.type === 'mousedown' && !ref.current?.contains(e.target))) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.86rem',
    fontWeight: 500,
    textAlign: 'left'
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        style={{
          borderRadius: '50%',
          padding: '2px',
          boxShadow: open ? '0 0 0 2px var(--color-primary)' : '0 0 0 1px var(--color-border)'
        }}
      >
        <Avatar name={user.name} size={34} tone={user.role === 'student' ? 'green' : 'orange'} />
      </button>

      {open && (
        <div
          className="pop-enter"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: '250px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px',
            zIndex: 60
          }}
        >
          <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '6px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', overflowWrap: 'anywhere' }}>{user.email}</div>
          </div>
          {showProfile && (
            <button className="hover-row" style={itemStyle} onClick={() => { setOpen(false); navigate('/student/profile'); }}>
              <User size={15} color="var(--color-text-muted)" /> Profile and scores
            </button>
          )}
          <button
            className="hover-row"
            style={{ ...itemStyle, color: 'var(--color-accent-strong)' }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};
