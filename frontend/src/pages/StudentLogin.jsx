import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';
import { apiClient, errorMessage } from '../services/apiClient';
import { Avatar } from '../components/ui/Avatar';
import { ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

const ROLE_GROUPS = [
  { role: 'student', title: 'Students', hint: 'Ask the AI mentor, see your project and tasks' },
  { role: 'mentor', title: 'Mentors', hint: 'Answer escalated questions, see mentor load' },
  { role: 'admin', title: 'Programme team', hint: 'All tickets and metrics' }
];

export const StudentLogin = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get('/api/users')
      .then((res) => setUsers(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const handleSignIn = async (userId) => {
    setSigningIn(userId);
    setError('');
    try {
      const me = await login(userId);
      navigate(homeFor(me));
    } catch (err) {
      setError(errorMessage(err));
      setSigningIn(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-app)' }}>
      {/* Left: account picker */}
      <div
        style={{
          flex: '1 1 500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 64px',
          maxWidth: '620px',
          margin: '0 auto',
          background: '#FFFFFF'
        }}
      >
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.svg" alt="Barabari" style={{ width: '36px', height: '36px' }} />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            Barabari
          </span>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Choose an account to continue. Accounts come from the Barabari programme records.
          </p>
        </div>

        {error && <div className="notice-error" style={{ marginBottom: '16px' }}>{error}</div>}

        {!users.length && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            <Loader2 size={16} className="animate-spin" /> Loading accounts...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {ROLE_GROUPS.map((group) => {
            const members = users.filter((u) => u.role === group.role);
            if (!members.length) return null;
            return (
              <div key={group.role}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-main)' }}>
                  {group.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {group.hint}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={!!signingIn}
                      onClick={() => handleSignIn(u.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: signingIn === u.id ? 'var(--bg-accent-soft)' : '#FFFFFF',
                        textAlign: 'left',
                        opacity: signingIn && signingIn !== u.id ? 0.5 : 1
                      }}
                    >
                      <Avatar id={u.id} name={u.name} size={34} tone={group.role === 'student' ? 'green' : 'orange'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                      </div>
                      {signingIn === u.id
                        ? <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />
                        : <ArrowRight size={16} color="var(--color-text-subtle)" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side: drawn in the site's own language, no stock photo */}
      <div
        style={{
          flex: '1 1 540px',
          position: 'relative',
          background: 'var(--color-primary)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '36px',
          padding: '56px clamp(40px, 6vw, 96px)',
          overflow: 'hidden'
        }}
      >
        {/* The two leaves of the logo, large and faint */}
        <svg viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', right: '-12%', bottom: '-16%', width: '78%', opacity: 0.09, pointerEvents: 'none' }}>
          <path d="M50 92 C50 78 49 68 51 56" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M51 62 C24 64 9 44 9 12 C38 12 55 32 51 62 Z" fill="#FFFFFF" />
          <path d="M51 56 C49 34 64 20 92 20 C92 44 76 58 51 56 Z" fill="#FFFFFF" />
        </svg>

        <div className="page-enter" style={{ position: 'relative', maxWidth: '520px' }}>
          <div className="handwriting" style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>
            “Education gives you the power to choose your own path.”
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.75, marginTop: '10px' }}>Barabari Collective</div>
        </div>

        {/* A small picture of what happens inside */}
        <div className="stagger" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '520px' }}>
          <div style={{ alignSelf: 'flex-end', maxWidth: '82%', background: 'rgba(255, 255, 255, 0.14)', border: '1px solid rgba(255, 255, 255, 0.18)', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: '0.88rem', lineHeight: 1.5 }}>
            The client wants UPI added after we agreed the scope. What do I say?
          </div>
          <div style={{ maxWidth: '88%', background: '#FFFFFF', color: 'var(--color-text-main)', borderRadius: '16px 16px 16px 4px', padding: '12px 14px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <img src="/logo.svg" alt="" style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>AI Mentor</span>
            </div>
            <div style={{ fontSize: '0.86rem', lineHeight: 1.55 }}>
              Your Statement of Work covers cards only, so this is a change request. Here is a message you can send her…
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              {['Statement of Work', 'Kickoff call', 'checkout.js'].map((source) => (
                <span key={source} style={{ fontSize: '0.68rem', fontWeight: 600, background: 'var(--bg-subtle)', color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '999px' }}>
                  {source}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>
            <ShieldCheck size={14} /> Answers come from your own project. A mentor steps in when the AI cannot help.
          </div>
        </div>
      </div>
    </div>
  );
};
