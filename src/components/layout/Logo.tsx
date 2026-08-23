import React from 'react';

interface LogoProps {
  className?: string;
  isSymbolOnly?: boolean;
  variant?: 'light' | 'dark';
}

export function Logo({ className = '', isSymbolOnly = false, variant = 'dark' }: LogoProps) {
  // Emerald tech green matching the user's logo reference (balanced, non-fluorescent)
  const greenColor = '#10b981'; // Emerald 500
  const greenGlow = '#059669'; // Emerald 600

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Node Network 'N' Icon from Logo */}
      <svg
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 sm:w-9 sm:h-9 shrink-0"
      >
        {/* Node Connection Lines */}
        <path
          d="M25 70 L25 35 L75 35 L75 70"
          stroke={greenColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M25 35 L75 70"
          stroke={greenColor}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M75 35 L90 25"
          stroke={greenColor}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M25 70 L10 80"
          stroke={greenColor}
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Node Dots */}
        <circle cx="25" cy="35" r="8" fill={greenColor} />
        <circle cx="75" cy="35" r="9" fill={greenColor} />
        <circle cx="25" cy="70" r="9" fill={greenColor} />
        <circle cx="75" cy="70" r="8" fill={greenColor} />
        <circle cx="90" cy="25" r="10" fill={greenColor} />
        <circle cx="10" cy="80" r="10" fill={greenColor} />
      </svg>

      {!isSymbolOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span className={`text-xl sm:text-2xl font-black italic tracking-tighter ${
              variant === 'light' ? 'text-white' : 'text-slate-900'
            }`}>
              NEXORA
            </span>
            <span className="text-xs sm:text-sm font-extrabold italic text-emerald-600">
              Tech
            </span>
          </div>
          <span className="text-[9px] tracking-wider uppercase font-semibold text-slate-400">
            Store Perú
          </span>
        </div>
      )}
    </div>
  );
}
