import { withAlpha } from './primitives';

export interface Segment { label: string; value: number; color: string }

// ── Donut with legend ─────────────────────────────────────────
export function Donut({
  data, size = 168, thickness = 22, centerValue, centerLabel,
}: {
  data: Segment[]; size?: number; thickness?: number; centerValue: string; centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const shown = data.filter((d) => d.value > 0);
  const gap = shown.length > 1 ? 2.5 : 0;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f9" strokeWidth={thickness} />
          {total > 0 &&
            shown.map((d, i) => {
              const frac = d.value / total;
              const dash = Math.max(frac * c - gap, 0.5);
              const offset = -acc * c;
              acc += frac;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={offset}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[26px] font-extrabold leading-none text-ink-900 tnum">{centerValue}</div>
            {centerLabel && <div className="mt-1 text-[11px] text-ink-400">{centerLabel}</div>}
          </div>
        </div>
      </div>

      <ul className="min-w-[150px] flex-1 space-y-2.5">
        {shown.map((d, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="truncate text-ink-700">{d.label}</span>
            <span className="ms-auto font-bold text-ink-900 tnum">{d.value}</span>
            <span className="w-9 text-end text-ink-400 tnum">{Math.round((d.value / (total || 1)) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Simple horizontal bar list ────────────────────────────────
export function BarList({
  items, accent = '#2a7df0', format,
}: {
  items: { name: string; value: number; color?: string }[];
  accent?: string;
  format?: (v: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={i}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
            <span className="truncate font-medium text-ink-700">{it.name}</span>
            <span className="font-bold text-ink-900 tnum">{format ? format(it.value) : it.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(it.value / max) * 100}%`, backgroundColor: it.color || accent }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Stacked bar list (magnitude = length, composition = colors) ─
export function StackedBarList({
  items, legend,
}: {
  items: { name: string; total: number; segments: Segment[] }[];
  legend?: Segment[];
}) {
  const max = Math.max(...items.map((i) => i.total), 1);
  return (
    <div>
      {legend && (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {legend.map((l, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      <ul className="space-y-3">
        {items.map((d, i) => (
          <li key={i}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
              <span className="truncate font-medium text-ink-700">{d.name}</span>
              <span className="font-bold text-ink-900 tnum">{d.total}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="flex h-full" style={{ width: `${(d.total / max) * 100}%` }}>
                {d.segments.map((s, j) => (
                  <div
                    key={j}
                    className="h-full first:rounded-s-full last:rounded-e-full"
                    style={{ width: `${(s.value / (d.total || 1)) * 100}%`, backgroundColor: s.color }}
                    title={`${s.label}: ${s.value}`}
                  />
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────
export function Funnel({ stages }: { stages: Segment[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => {
        const pct = Math.max((s.value / max) * 100, 7);
        const prev = i > 0 ? stages[i - 1].value : null;
        const conv = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={i}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
              <span className="font-medium text-ink-700">{s.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-ink-900 tnum">{s.value}</span>
                {conv != null && (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tnum"
                    style={{ backgroundColor: withAlpha(s.color, 0.12), color: s.color }}
                  >
                    {conv}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-slate-100">
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${s.color}, ${withAlpha(s.color, 0.75)})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
