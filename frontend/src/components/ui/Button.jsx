import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  let variantClass = 'btn-primary';
  if (variant === 'outline') variantClass = 'btn-outline';
  else if (variant === 'terracotta') variantClass = 'btn-terracotta';
  else if (variant === 'ghost') variantClass = 'hover:bg-gray-100 text-gray-700';

  let sizeStyles = {
    sm: { padding: '6px 14px', fontSize: '0.8rem' },
    md: { padding: '10px 20px', fontSize: '0.9rem' },
    lg: { padding: '12px 24px', fontSize: '1rem' }
  }[size] || {};

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={sizeStyles}
      className={`${variantClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};
