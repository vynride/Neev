import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  type = 'text',
  id,
  error,
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
          {label} {required && <span style={{ color: 'var(--color-accent)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            width: '100%',
            padding: '11px 14px',
            paddingRight: isPassword ? '40px' : '14px',
            borderRadius: 'var(--radius-md)',
            border: `1.5px solid ${error ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: 'var(--bg-surface)',
            fontSize: '0.9rem',
            color: 'var(--color-text-main)',
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-muted)'
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{error}</span>}
    </div>
  );
};
