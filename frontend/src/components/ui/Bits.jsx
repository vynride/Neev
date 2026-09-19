import React from 'react';

// Small building blocks shared by the student and mentor dashboards

export const PageHeader = ({ title, subtitle, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px' }}>
    <div>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</p>}
    </div>
    {children && <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>}
  </div>
);

// Every tile has the same skeleton (label, number, note), top-aligned, so a row of them lines up
// even when one label wraps.
export const StatTile = ({ icon: Icon, label, value, hint, tone = 'primary', onClick }) => {
  const accent = tone === 'accent';
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`card${onClick ? ' is-clickable' : ''}`}
      style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', height: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span>
        {Icon && (
          <span
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: accent ? 'var(--color-accent-subtle)' : 'var(--color-primary-subtle)',
              color: accent ? 'var(--color-accent-strong)' : 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-subtle)', minHeight: '1.2em' }}>{hint}</div>
    </Wrapper>
  );
};

export const ProgressBar = ({ value, tone = 'primary', height = 6 }) => (
  <div style={{ width: '100%', height, background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
    <div
      style={{
        width: `${Math.max(0, Math.min(100, value || 0))}%`,
        height: '100%',
        borderRadius: '999px',
        background: tone === 'accent' ? 'var(--color-accent)' : 'var(--color-primary)',
        transition: 'width 0.8s var(--ease)'
      }}
    />
  </div>
);

// `flush` lets rows inside run to the card's edge while the heading keeps the normal inset
export const SectionCard = ({ title, hint, action, children, style, flush = false }) => (
  <div className="card" style={{ padding: '20px 0 16px', display: 'flex', flexDirection: 'column', height: '100%', ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '0 22px', marginBottom: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h3>
        {hint && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', marginTop: '1px' }}>{hint}</div>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
    <div style={{ padding: flush ? '0 10px' : '0 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
  </div>
);

export const TextLink = ({ onClick, children }) => (
  <button onClick={onClick} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
    {children}
  </button>
);

export const EmptyState = ({ icon: Icon, children }) => (
  <div style={{ flex: 1, justifyContent: 'center', padding: '22px 12px', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    {Icon && <Icon size={24} strokeWidth={1.6} />}
    <div>{children}</div>
  </div>
);

export const Loading = ({ label = 'Loading…' }) => (
  <div style={{ display: 'grid', gap: '16px' }}>
    <div className="skeleton" style={{ height: '64px' }} />
    <div className="skeleton" style={{ height: '220px' }} aria-label={label} />
  </div>
);
