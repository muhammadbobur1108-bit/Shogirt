import React from 'react';

interface TexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export default function TexLogo({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'light'
}: TexLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-sm font-black',
    md: 'text-lg font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black'
  };

  const badgeSizes = {
    sm: 'text-[8px] px-1 py-0.2',
    md: 'text-[9px] px-1.5 py-0.5',
    lg: 'text-[10px] px-2 py-0.5',
    xl: 'text-xs px-2.5 py-1'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Woven Loom Vector Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-lg shadow-indigo-950/50`}>
        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(79,70,229,0.5)]"
        >
          <defs>
            <linearGradient id="thread1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06b6d4" />
              <stop offset="0.5" stopColor="#6366f1" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="thread2" x1="44" y1="4" x2="4" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.7" stopColor="#4f46e5" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="goldAccent" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Textile Warp Weft Interlacing Geometric Pattern */}
          <rect x="6" y="6" width="36" height="36" rx="8" stroke="url(#thread1)" strokeWidth="2.5" strokeOpacity="0.4" />
          
          {/* Horizontal Fabric Strands */}
          <path d="M10 16H38" stroke="url(#thread1)" strokeWidth="3" strokeLinecap="round" />
          <path d="M10 24H38" stroke="url(#thread2)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M10 32H38" stroke="url(#thread1)" strokeWidth="3" strokeLinecap="round" />

          {/* Vertical Intersecting Loom Strands forming 'T' & 'F' */}
          <path d="M18 10V38" stroke="url(#thread2)" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 10V38" stroke="url(#goldAccent)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M30 10V38" stroke="url(#thread1)" strokeWidth="3" strokeLinecap="round" />

          {/* Modern Diamond Shuttle Center Piece */}
          <circle cx="24" cy="24" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="2" fill="#1e1b4b" />
        </svg>
      </div>

      {/* Brand Name Typography */}
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSizes[size]} tracking-tight uppercase ${
            variant === 'light' 
              ? 'text-white' 
              : 'text-slate-900'
          }`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-300 to-indigo-100 font-black">SHOGIRT</span>
          </span>
          
          <span className={`${badgeSizes[size]} font-black rounded-md tracking-wider uppercase bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-xs`}>
            ERP
          </span>
        </div>

        {showSubtitle && (
          <p className={`text-[10px] font-semibold tracking-wide ${
            variant === 'light' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Текстильная & Швейная ERP
          </p>
        )}
      </div>
    </div>
  );
}
