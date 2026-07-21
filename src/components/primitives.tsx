import type { ReactNode } from 'react';
import type { Meta } from '../config/semantics';
import type { Lang } from '../types';

/** hex (#rrggbb) → rgba string with alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 0 3px ${withAlpha(color, 0.15)}` }}
    />
  );
}

export function Badge({ meta, lang }: { meta: Meta; lang: Lang }) {
  const text = lang === 'ar' ? meta.ar : meta.en;
  return (
    <span
      className="chip"
      style={{ backgroundColor: withAlpha(meta.color, 0.12), color: meta.color }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {text}
    </span>
  );
}

export function TextChip({ children, color = '#5a6b85' }: { children: ReactNode; color?: string }) {
  return (
    <span className="chip" style={{ backgroundColor: withAlpha(color, 0.1), color }}>
      {children}
    </span>
  );
}

export function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      {icon && <span className="text-brand-600">{icon}</span>}
      <div>
        <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      </div>
    </div>
  );
}
