import React from 'react';
import { initials } from '../../services/format';

export const Avatar = ({ name, size = 36, tone = 'green' }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: tone === 'orange' ? 'var(--color-accent-subtle)' : 'var(--color-primary-subtle)',
      color: tone === 'orange' ? 'var(--color-accent-strong)' : 'var(--color-primary)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.36,
      fontWeight: 800,
      flexShrink: 0
    }}
  >
    {initials(name)}
  </span>
);
