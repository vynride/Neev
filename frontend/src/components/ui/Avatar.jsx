import React, { useState } from 'react';
import { initials } from '../../services/format';

// Portraits for the seeded accounts live in public/avatars/<user id>.svg. To use a real photo,
// add the file there and list it here. Anyone without a portrait gets their initials.
const PORTRAITS = {
  s1: '/avatars/s1.svg',
  s2: '/avatars/s2.svg',
  s3: '/avatars/s3.svg',
  s4: '/avatars/s4.svg',
  s5: '/avatars/s5.svg',
  m1: '/avatars/m1.svg',
  m2: '/avatars/m2.svg',
  a1: '/avatars/a1.svg'
};

export const Avatar = ({ id, name, size = 36, tone = 'primary' }) => {
  const [failed, setFailed] = useState(false);
  const src = !failed && PORTRAITS[id];
  const accent = tone === 'orange' || tone === 'accent';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--color-border)',
          flexShrink: 0
        }}
      />
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: accent ? 'var(--color-accent-subtle)' : 'var(--color-primary-subtle)',
        color: accent ? 'var(--color-accent-strong)' : 'var(--color-primary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {initials(name)}
    </span>
  );
};
