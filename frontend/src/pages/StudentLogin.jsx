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
                        border: '1.5px solid var(--color-border)',
                        background: signingIn === u.id ? '#F0FDF4' : '#FFFFFF',
                        textAlign: 'left',
                        opacity: signingIn && signingIn !== u.id ? 0.5 : 1
                      }}
                    >
                      <Avatar name={u.name} size={34} tone={group.role === 'student' ? 'green' : 'orange'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                      </div>
                      {signingIn === u.id
                        ? <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />
                        : <ArrowRight size={16} color="#94A3B8" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Side Visual Banner */}
      <div
        style={{
          flex: '1 1 540px',
          position: 'relative',
          background: 'linear-gradient(135deg, #1E5E3A 0%, #164E2E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          overflow: 'hidden'
        }}
        className="hidden lg:flex"
      >
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80"
          alt="Students learning together"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.35
          }}
        />

        {/* Floating Handwritten Quote Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px',
            maxWidth: '440px',
            boxShadow: 'var(--shadow-lg)',
            border: '2px solid rgba(255, 255, 255, 0.5)'
          }}
        >
          <div className="handwriting" style={{ fontSize: '1.9rem', color: 'var(--color-text-main)', lineHeight: 1.3, marginBottom: '16px' }}>
            “Education gives you the power to choose your own path.”
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            — Barabari Collective
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <ShieldCheck size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Encrypted, student-isolated workspace
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
