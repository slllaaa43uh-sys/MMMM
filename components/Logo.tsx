
import React, { useId } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-24 h-24" }) => {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `logoGradient-${safeId}`;
  const glowId = `glow-${safeId}`;

  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" /> {/* Blue-600 */}
          <stop offset="50%" stopColor="#06B6D4" /> {/* Cyan-500 */}
          <stop offset="100%" stopColor="#22C55E" /> {/* Green-500 */}
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background Shape (Hexagon-ish) */}
      <path 
        d="M100 20L170 60V140L100 180L30 140V60L100 20Z" 
        fill={`url(#${gradientId})`} 
        stroke="white" 
        strokeWidth="0"
      />
      
      {/* Abstract 'M' / Briefcase Handle Interlock */}
      <path 
        d="M65 85V135H85V105L100 120L115 105V135H135V85H115L100 100L85 85H65Z" 
        fill="white"
      />
      
      {/* Top Accent Dot */}
      <circle cx="100" cy="55" r="8" fill="white" fillOpacity="0.9" />
    </svg>
  );
};

export default Logo;
