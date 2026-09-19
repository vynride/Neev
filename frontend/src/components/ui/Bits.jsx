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

export const StatTile = ({ icon: Icon, label, value, hint, tone = 'primary' }) => {
  const accent = tone === 'accent';
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
      {Icon && (
        <span
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: accent ? 'var(--color-accent-subtle)' : 'var(--color-primary-subtle)',
            color: accent ? 'var(--color-accent-strong)' : 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={19} strokeWidth={1.9} />
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>{hint}</div>}
      </div>
    </div>
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

export const SectionCard = ({ title, hint, action, children, style }) => (
  <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
      <div>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{title}</h3>
        {hint && <div style={{ fontSize: '0.76rem', color: 'var(--color-text-subtle)' }}>{hint}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

export const TextLink = ({ onClick, children }) => (
  <button onClick={onClick} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
    {children}
  </button>
);

export const EmptyState = ({ icon: Icon, children }) => (
  <div style={{ padding: '26px 12px', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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
