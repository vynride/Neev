import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';
import { apiClient, errorMessage } from '../services/apiClient';
import { Avatar } from '../components/ui/Avatar';
import { ChevronRight, Loader2 } from 'lucide-react';

const ROLE_GROUPS = [
  { role: 'student', title: 'Students', hint: 'Ask the AI mentor, and see your project, tasks and client calls.' },
  { role: 'mentor', title: 'Mentors', hint: 'Answer what the AI mentor could not, and see how your students are doing.' },
  { role: 'admin', title: 'Programme team', hint: 'See every ticket and the mentor load across projects.' }
];

// The logo's two leaves, in white, for use on the green panel
const Leaves = ({ style }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true" style={style}>
    <path d="M50 92 C50 78 49 68 51 56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M51 62 C24 64 9 44 9 12 C38 12 55 32 51 62 Z" fill="currentColor" />
    <path d="M51 56 C49 34 64 20 92 20 C92 44 76 58 51 56 Z" fill="currentColor" />
  </svg>
);

export const StudentLogin = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('student');
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

  const group = ROLE_GROUPS.find((g) => g.role === role);
  const members = users.filter((u) => u.role === role);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(360px, 5fr) 7fr', background: 'var(--bg-app)' }}>
      {/* Left: the brand panel */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-primary)',
          color: '#FFFFFF',
          padding: '44px 52px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Leaves style={{ position: 'absolute', right: '-34%', bottom: '-30%', width: '110%', color: '#FFFFFF', opacity: 0.055, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Leaves style={{ width: '30px', height: '30px', color: '#FFFFFF' }} />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Barabari</span>
        </div>

        <div className="page-enter" style={{ position: 'relative', maxWidth: '440px' }}>
          <div className="handwriting" style={{ fontSize: 'clamp(2.1rem, 3vw, 2.9rem)', lineHeight: 1.18, textWrap: 'balance' }}>
            “Education gives you the power to choose your own path.”
          </div>
          <div style={{ width: '36px', height: '2px', background: 'var(--color-accent)', margin: '22px 0 12px' }} />
          <div style={{ fontSize: '0.84rem', opacity: 0.75 }}>Barabari Collective</div>
        </div>

        <div style={{ position: 'relative', fontSize: '0.78rem', opacity: 0.6, lineHeight: 1.6, maxWidth: '400px', textWrap: 'balance' }}>
          Project Saathi is the AI mentor for Barabari freelancers. It answers from your own project, and brings in a
          mentor when it cannot help.
        </div>
      </div>

      {/* Right: choose an account */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div className="page-enter" style={{ width: '100%', maxWidth: '460px' }}>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.035em' }}>Welcome back</h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Choose your account to continue.</p>

          {/* Role switch */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)', margin: '26px 0 10px' }}>
            {ROLE_GROUPS.map((g) => (
              <button
                key={g.role}
                onClick={() => setRole(g.role)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '7px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: role === g.role ? 'var(--bg-surface)' : 'transparent',
                  color: role === g.role ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                  boxShadow: role === g.role ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {g.title}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', minHeight: '2.4em' }}>{group.hint}</p>

          {error && <div className="notice-error" style={{ margin: '10px 0' }}>{error}</div>}

          {/* Accounts: one card, one row each */}
          <div key={role} className="card tab-enter" style={{ marginTop: '10px', overflow: 'hidden' }}>
            {!users.length && !error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '18px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                <Loader2 size={16} className="animate-spin" /> Loading accounts…
              </div>
            )}
            {members.map((u, idx) => (
              <button
                key={u.id}
                type="button"
                className="hover-row"
                disabled={!!signingIn}
                onClick={() => handleSignIn(u.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  borderTop: idx ? '1px solid var(--color-border-subtle)' : 'none',
                  opacity: signingIn && signingIn !== u.id ? 0.45 : 1
                }}
              >
                <Avatar id={u.id} name={u.name} size={40} tone={role === 'student' ? 'primary' : 'accent'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                {signingIn === u.id
                  ? <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />
                  : <ChevronRight size={16} color="var(--color-text-subtle)" />}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)', marginTop: '16px', textAlign: 'center', textWrap: 'balance' }}>
            Accounts come from the Barabari programme records. No password is needed for this demo.
          </p>
        </div>
      </div>
    </div>
  );
};
