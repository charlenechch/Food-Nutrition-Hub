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
  <svg width={size} height={size} viewBox="0 0 24 24" fill={`url(#${materialId})`} filter={glow ? "url(#glow)" : "none"}>
    {MATERIAL_DEFS}
    <path d="M15.5 2C15.5 2 17 2 17 4V8.5C17 10 16 11.5 14.5 12L16 22H13L11.5 12C10 11.5 9 10 9 8.5V4C9 2 10.5 2 10.5 2V8H11.5V2H13.5V8H14.5V2H15.5Z" />
    <path d="M8.5 2C5.5 2 4 4.5 4 7C4 9.5 6 11.5 7 12L5 22H8L10 12C11 11.5 13 9.5 13 7C13 4.5 11.5 2 8.5 2Z" />
  </svg>
);

export const ChefKnifeIcon = ({ materialId, size = 24, glow = false, extraSparkle = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={`url(#${materialId})`} filter={glow ? "url(#glow)" : "none"}>
    {MATERIAL_DEFS}
    <path d="M21.7 4.3C21.3 3.9 20.7 3.9 20.3 4.3L18.9 5.7L18.9 5.7C17.1 7.5 11.3 11 4.5 12.3C3.5 12.5 3 13.5 3 14.5V19.5C3 20.3 3.7 21 4.5 21H7.5C8.1 21 8.7 20.6 8.9 20L10.3 16.3L19.7 6.9C20.1 6.5 20.1 5.9 19.7 5.5L21.7 4.3Z" />
    {extraSparkle && (
      <path fill="#ffffff" opacity="0.6" d="M16 6L17 4L18 6L20 7L18 8L17 10L16 8L14 7L16 6Z" />
    )}
  </svg>
);