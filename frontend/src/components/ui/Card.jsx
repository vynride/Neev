import React from 'react';

export const Card = ({ children, className = '', style = {}, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`card ${className}`}
      style={{
        padding: '24px',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'green', className = '', style = {} }) => {
  let badgeClass = 'badge-green';
  if (variant === 'orange') badgeClass = 'badge-orange';
  else if (variant === 'blue') badgeClass = 'badge-blue';
  else if (variant === 'gray') badgeClass = 'badge-gray';

  return (
    <span className={`badge ${badgeClass} ${className}`} style={style}>
      {children}
    </span>
  );
};
