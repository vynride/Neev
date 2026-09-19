import React, { useEffect, useState } from 'react';

const PHRASES = ['Thinking', 'Looking through your project', 'Checking the details', 'Putting it together'];

// Shown while the AI mentor works. The highlight sweeps across the words from left to right.
export const Thinking = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, PHRASES.length - 1)), 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="msg-enter" style={{ padding: '4px 2px' }}>
      <span key={index} className="shimmer-text fade-enter" style={{ fontSize: '0.92rem' }}>
        {PHRASES[index]}…
      </span>
    </div>
  );
};
