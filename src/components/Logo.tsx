import { useId } from 'react';

export function Mark({ size = 36, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0b2547" />
          <stop offset="1" stopColor="#071a33" />
        </linearGradient>
        <linearGradient id={`e-${id}`} x1="16" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#17b5e8" />
          <stop offset="0.5" stopColor="#2a7df0" />
          <stop offset="1" stopColor="#1366e6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#bg-${id})`} />
      <path
        d="M45.5 39.5 A14 14 0 1 1 46 26.5"
        stroke={`url(#e-${id})`}
        strokeWidth="6.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M19 31.6 H45.2" stroke={`url(#e-${id})`} strokeWidth="6.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ size = 34, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={size} />
      {showWord && (
        <div className="leading-none">
          <div className="text-[17px] font-extrabold tracking-tight text-white">
            ENGO<span className="text-brand-300">SOFT</span>
          </div>
          <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
            HR&nbsp;Suite
          </div>
        </div>
      )}
    </div>
  );
}
