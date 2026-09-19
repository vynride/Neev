import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const StudentLogin = () => {
  const [email, setEmail] = useState('student@barabari.org');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, password);
      setLoading(false);
      navigate('/student/dashboard');
    }, 400);
  };

  const handleDemoSignIn = () => {
    demoLogin();
    navigate('/student/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-app)' }}>
      {/* Left Form Area */}
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
        {/* Brand header */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.svg" alt="Barabari" style={{ width: '36px', height: '36px' }} />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            Barabari
          </span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Continue your journey. You've got this.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            id="student-email"
            label="Email or ID"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@barabari.org"
          />

          <Input
            id="student-password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Remember me
            </label>
            <a href="#forgot" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Forgot password?
            </a>
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Hackathon Quick Demo Auto-Fill Pill */}
          <div
            onClick={handleDemoSignIn}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#F0FDF4',
              border: '1.5px dashed #86EFAC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Judge / Demo Quick Login (Aditi)
              </span>
            </div>
            <ArrowRight size={15} color="var(--color-primary)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'lowercase' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Social Logins */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={handleDemoSignIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border)',
                background: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={handleDemoSignIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border)',
                background: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            New here?{' '}
            <a href="#coordinator" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Contact your program coordinator.
            </a>
          </div>
        </form>
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
