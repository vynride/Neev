import React from 'react';
import { initials } from '../../services/format';

export const Avatar = ({ name, size = 36, tone = 'green' }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: tone === 'orange' ? '#FFEDD5' : '#DCFCE7',
      color: tone === 'orange' ? '#C2410C' : '#166534',
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
