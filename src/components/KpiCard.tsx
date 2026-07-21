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
}

export function KpiCard({ icon, label, value, hint, tone = '#2a7df0', hero = false, delay = 0 }: KpiProps) {
  if (hero) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl bg-hero-gradient p-5 text-white shadow-cardhover animate-fade-up"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="absolute -end-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-md" />
        <div className="absolute -bottom-10 -start-4 h-24 w-24 rounded-full bg-white/10 blur-md" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 backdrop-blur">{icon}</span>
          </div>
          <div className="mt-4 text-3xl font-extrabold tracking-tight tnum">{value}</div>
          <div className="mt-1 text-sm font-semibold text-white/90">{label}</div>
          {hint && <div className="mt-0.5 text-xs text-white/70">{hint}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card card-hover relative overflow-hidden p-5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute -end-8 -top-10 h-24 w-24 rounded-full blur-md"
        style={{ backgroundColor: withAlpha(tone, 0.1) }}
      />
      <div className="relative flex items-start justify-between">
        <span
          className="grid h-11 w-11 place-items-center rounded-xl"
          style={{ backgroundColor: withAlpha(tone, 0.12), color: tone }}
        >
          {icon}
        </span>
      </div>
      <div className="relative mt-4 text-[26px] font-extrabold leading-none tracking-tight text-ink-900 tnum">
        {value}
      </div>
      <div className="relative mt-1.5 text-[13px] font-semibold text-ink-700">{label}</div>
      {hint && <div className="relative mt-0.5 text-[11.5px] text-ink-400">{hint}</div>}
    </div>
  );
}
