import type { ReactNode } from 'react';
import { withAlpha } from './primitives';

interface KpiProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: string; // accent hex
  hero?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function KpiCard({
  icon, label, value, hint, tone = '#0F72D8', hero = false, delay = 0, onClick,
}: KpiProps) {
  const interactive = onClick
    ? 'focus-ring cursor-pointer text-start w-full'
    : '';
  const Tag = onClick ? 'button' : 'div';

  if (hero) {
    return (
      <Tag
        {...(onClick ? { type: 'button' as const, onClick } : {})}
        className={`relative overflow-hidden rounded-2xl bg-hero-gradient p-4 text-white shadow-cardhover
                    animate-fade-up sm:p-5 ${interactive}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="absolute -end-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-md" />
        <div className="absolute -bottom-10 -start-4 h-24 w-24 rounded-full bg-white/10 blur-md" />
        <div className="relative">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur sm:h-11 sm:w-11">
            {icon}
          </span>
          <div className="mt-3 text-[26px] font-extrabold tracking-tight tnum sm:mt-4 sm:text-3xl">
            {value}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-white/90 sm:text-sm">{label}</div>
          {hint && <div className="mt-0.5 text-[11px] text-white/70 sm:text-xs">{hint}</div>}
        </div>
      </Tag>
    );
  }

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`card card-hover relative overflow-hidden p-4 animate-fade-up sm:p-5 ${interactive}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute -end-8 -top-10 h-24 w-24 rounded-full blur-md"
        style={{ backgroundColor: withAlpha(tone, 0.1) }}
      />
      <span
        className="relative grid h-10 w-10 place-items-center rounded-xl sm:h-11 sm:w-11"
        style={{ backgroundColor: withAlpha(tone, 0.12), color: tone }}
      >
        {icon}
      </span>
      <div className="relative mt-3 text-[22px] font-extrabold leading-none tracking-tight text-ink-900
                      tnum sm:mt-4 sm:text-[26px]">
        {value}
      </div>
      <div className="relative mt-1.5 text-[12.5px] font-semibold text-ink-700 sm:text-[13px]">{label}</div>
      {hint && <div className="relative mt-0.5 text-[11px] text-ink-400 sm:text-[11.5px]">{hint}</div>}
    </Tag>
  );
}
