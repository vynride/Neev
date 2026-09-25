import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, HeartHandshake, Award, Users, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header
        style={{
          height: '76px',
          borderBottom: '1px solid var(--color-border)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.svg" alt="Neev" style={{ width: '38px', height: '38px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Neev <span style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 600 }}>| Barabari Collective</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              Skills today. Equal tomorrow.
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
          <a href="#about" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Home</a>
          <a href="#about" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>About</a>
          <a href="#impact" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Impact</a>
          <Link to="/login" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-primary)' }}>Student Login</Link>
          <Link to="/login" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-accent)' }}>Mentor Portal</Link>
          <Button onClick={() => navigate('/login')} variant="primary" size="md">
            Get Started <ArrowRight size={16} />
          </Button>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', padding: '56px 32px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* Hero Left Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.8rem',
                fontWeight: 700,
                width: 'fit-content'
              }}
            >
              <Sparkles size={14} color="#D97706" />
              <span>Empower · Learn · Build · Grow</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.12,
                color: 'var(--color-text-main)',
                letterSpacing: '-0.03em'
              }}
            >
              Real Projects. <br />
              <span style={{ color: 'var(--color-primary)' }}>Real Support.</span> <br />
              A Brighter Tomorrow.
            </h1>

            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: '540px' }}>
              An AI-powered mentorship platform helping young women build skills, take real-world freelance projects and create independent futures.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px' }}>
              <Button onClick={() => navigate('/login')} variant="primary" size="lg">
                Get Started <ArrowRight size={18} />
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" size="lg">
                Explore Demo
              </Button>
            </div>

            {/* Impact Statistics */}
            <div
              id="impact"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                paddingTop: '32px',
                borderTop: '1px solid var(--color-border)',
                marginTop: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>600+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Students</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)' }}>100+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Mentors</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', paddingTop: '4px' }}>Real</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Client Projects</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', paddingTop: '4px' }}>Lasting</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Impact</div>
              </div>
            </div>
          </div>

          {/* Hero Right Visual with Botanical Accents */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Background Botanical Decorative Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '10px',
                background: 'var(--bg-accent-soft)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-primary-subtle)',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 10
              }}
            >
              <div className="handwriting" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                Guidance, Confidence, Independence
              </div>
            </div>

            {/* Main Portrait Card */}
            <div
              style={{
                position: 'relative',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 20px 35px -10px rgba(31, 77, 58, 0.15)',
                border: '4px solid #FFFFFF',
                maxWidth: '460px',
                width: '100%'
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80"
                alt="Student developer in tech"
                style={{ width: '100%', height: '520px', objectFit: 'cover', display: 'block' }}
              />

              {/* Floating Sticker Card on image */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  right: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ background: 'var(--color-primary-subtle)', padding: '10px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                  <Award size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                    From learners to leaders ✨
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Empowered with project-aware AI mentorship
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Banner */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '24px 48px',
          background: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.svg" alt="Barabari" style={{ width: '24px', height: '24px' }} />
          <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.9rem' }}>Neev</span>
          <span style={{ color: 'var(--color-text-subtle)' }}>|</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Barabari Collective</span>
        </div>

        <div className="handwriting" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 700 }}>
          “Support today. A more equal tomorrow.”
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          JPMorgan Chase Code for Good 2026
        </div>
      </footer>
    </div>
  );
};
