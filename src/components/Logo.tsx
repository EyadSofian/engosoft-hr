import { useId } from 'react';

/**
 * Engosoft brand marks.
 *
 * The symbol is the circular "e": a blue ring broken at the lower right with a
 * navy crossbar, trailed by three descending dots. The wordmark sets ENGO in
 * navy over SOFT in azure. On dark surfaces both words go white/azure — the
 * navy would disappear.
 */

export function Mark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role="img"
      aria-label="Engosoft"
    >
      <defs>
        <linearGradient id={`ring-${uid}`} x1="14" y1="12" x2="80" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AA7F0" />
          <stop offset="0.55" stopColor="#0F72D8" />
          <stop offset="1" stopColor="#0B4FA8" />
        </linearGradient>
      </defs>

      {/* Ring, open at the lower right */}
      <path
        d="M78 68 A32 32 0 1 1 82 44"
        stroke={`url(#ring-${uid})`}
        strokeWidth="15"
        strokeLinecap="round"
        fill="none"
      />
      {/* Navy crossbar — the stem of the "e" */}
      <path d="M40 50 H82" stroke="#0A2540" strokeWidth="15" strokeLinecap="round" fill="none" />

      {/* Trailing dots */}
      <circle cx="26" cy="83" r="5.2" fill="#0F72D8" />
      <circle cx="12" cy="88" r="3.4" fill="#2AA7F0" opacity="0.85" />
      <circle cx="2.5" cy="93" r="2.2" fill="#2AA7F0" opacity="0.6" />
    </svg>
  );
}

export function Wordmark({ tone = 'light', size = 20 }: { tone?: 'light' | 'dark'; size?: number }) {
  // `tone` describes the SURFACE: "light" surface → navy text.
  const engo = tone === 'light' ? 'text-navy-900' : 'text-white';
  return (
    <div className="leading-[0.92]" style={{ fontSize: size }}>
      <div className={`font-black tracking-[-0.02em] ${engo}`}>ENGO</div>
      <div className="font-black tracking-[-0.02em] text-brand-500">SOFT</div>
    </div>
  );
}

export function Logo({
  size = 38,
  tone = 'light',
  showWord = true,
  subtitle,
}: {
  size?: number;
  tone?: 'light' | 'dark';
  showWord?: boolean;
  subtitle?: string;
}) {
  const rule = tone === 'light' ? 'bg-navy-900/15' : 'bg-white/20';
  return (
    <div className="flex items-center gap-3">
      <Mark size={size} />
      {showWord && (
        <>
          <span className={`h-8 w-px shrink-0 ${rule}`} aria-hidden="true" />
          <div>
            <Wordmark tone={tone} size={size * 0.46} />
            {subtitle && (
              <div
                className={`mt-1 text-[9.5px] font-bold uppercase tracking-[0.2em] ${
                  tone === 'light' ? 'text-ink-400' : 'text-white/45'
                }`}
              >
                {subtitle}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
