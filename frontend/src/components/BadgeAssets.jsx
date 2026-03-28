import React from 'react';

const MATERIAL_DEFS = (
  <defs>
    <linearGradient id="mat-wood" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#A1887F" />
      <stop offset="100%" stopColor="#5D4037" />
    </linearGradient>

    <linearGradient id="mat-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ED8936" />
      <stop offset="50%" stopColor="#C05621" />
      <stop offset="100%" stopColor="#7B341E" />
    </linearGradient>

    <linearGradient id="mat-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#9AE6B4" />
      <stop offset="50%" stopColor="#38A169" />
      <stop offset="100%" stopColor="#22543D" />
    </linearGradient>

    <linearGradient id="mat-sapphire" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#90CDF4" />
      <stop offset="50%" stopColor="#3182CE" />
      <stop offset="100%" stopColor="#2A4365" />
    </linearGradient>

    <linearGradient id="mat-amethyst" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#D6BCFA" />
      <stop offset="50%" stopColor="#805AD5" />
      <stop offset="100%" stopColor="#44337A" />
    </linearGradient>

    <linearGradient id="mat-ruby" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FBB6CE" />
      <stop offset="50%" stopColor="#D53F8C" />
      <stop offset="100%" stopColor="#702459" />
    </linearGradient>

    <linearGradient id="mat-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FEFCBF" />
      <stop offset="30%" stopColor="#F6E05E" />
      <stop offset="70%" stopColor="#D69E2E" />
      <stop offset="100%" stopColor="#744210" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5" />
    </filter>
  </defs>
);

export const UtensilsIcon = ({ materialId, size = 24, glow = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" filter={glow ? "url(#glow)" : "none"}>
    {MATERIAL_DEFS}
    <path 
      fill={`url(#${materialId})`} 
      d="M 7 2 C 3 2 3 9 6.2 10 L 6.2 21 A 0.8 0.8 0 0 0 7.8 21 L 7.8 10 C 11 9 11 2 7 2 Z" 
    />
    <path 
      fill={`url(#${materialId})`} 
      d="M 14 2 L 14 6 C 14 8 15 9 16.2 9.5 L 16.2 21 A 0.8 0.8 0 0 0 17.8 21 L 17.8 9.5 C 19 9 20 8 20 6 L 20 2 L 18.5 2 L 18.5 6 C 18.5 6.5 17.5 6.5 17.5 6 L 17.5 2 L 16.5 2 L 16.5 6 C 16.5 6.5 15.5 6.5 15.5 6 L 15.5 2 Z" 
    />
  </svg>
);

export const ChefKnifeIcon = ({ materialId, size = 24, glow = false, extraSparkle = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={`url(#${materialId})`} filter={glow ? "url(#glow)" : "none"}>
    {MATERIAL_DEFS}
    
    <path 
      d="M 8 12 L 22 2 C 22 10 17 16 10 17 L 10 14 L 6 18 A 1.41 1.41 0 0 1 4 16 L 8 12 Z" 
    />
    
    <circle cx="8" cy="14" r="0.8" fill="#ffffff" opacity="0.35" />
    <circle cx="6" cy="16" r="0.8" fill="#ffffff" opacity="0.35" />

    {extraSparkle && (
      <path 
        fill="#ffffff" 
        opacity="0.7" 
        d="M 19 3 L 19.5 5.5 L 22 6 L 19.5 6.5 L 19 9 L 18.5 6.5 L 16 6 L 18.5 5.5 Z" 
      />
    )}
  </svg>
);