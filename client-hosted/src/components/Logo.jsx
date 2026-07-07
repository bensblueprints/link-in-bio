import React from 'react';

// Approximation of the LinkLeaf mark: teal->green leaf with circuit nodes.
export default function Logo({ size = 28, withWordmark = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ll-grad" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0d9488" />
            <stop offset="1" stopColor="#84cc16" />
          </linearGradient>
        </defs>
        <path
          d="M50 90 C50 55 60 30 85 12 C90 45 78 72 50 90 Z"
          fill="url(#ll-grad)"
        />
        <path d="M50 88 C46 65 40 48 22 34" stroke="url(#ll-grad)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="22" cy="34" r="4.5" fill="url(#ll-grad)" />
        <circle cx="34" cy="50" r="3.5" fill="url(#ll-grad)" />
        <circle cx="30" cy="66" r="3" fill="url(#ll-grad)" />
        <circle cx="50" cy="88" r="4" fill="url(#ll-grad)" />
      </svg>
      {withWordmark && (
        <span className="font-extrabold text-lg leading-none">
          <span style={{ color: '#0d9488' }}>Link</span>
          <span style={{ color: '#84cc16' }}>Leaf</span>
        </span>
      )}
    </div>
  );
}
