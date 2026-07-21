import { Target, UserCheck } from 'lucide-react';
import type { Analytics, RecruiterStat } from '../lib/analytics';
import { useI18n } from '../i18n/LangProvider';
import { STATUS, deptColor } from '../config/semantics';
import { formatNumber, formatPercent } from '../lib/format';
import { SectionTitle } from '../components/primitives';
import { EmptyView } from '../components/StateViews';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function RecruiterCard({ r }: { r: RecruiterStat }) {
  const { t, lang } = useI18n();
  const color = deptColor(r.name);
  const completion = r.total > 0 ? (r.done / r.total) * 100 : 0;
  const segs = [
    { v: r.active, c: STATUS.active.color },
    { v: r.hold, c: STATUS.hold.color },
    { v: r.done, c: STATUS.done.color },
  ];

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-extrabold uppercase text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          {initials(r.name)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-bold text-ink-900">{r.name}</div>
          <div className="text-[12px] text-ink-400">{r.total} {t('recruiters.roles')}</div>
        </div>
        <div className="ms-auto text-end">
          <div className="text-xl font-extrabold text-ink-900 tnum">{formatPercent(completion)}</div>
          <div className="text-[10.5px] text-ink-400">{t('recruiters.completion')}</div>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full">
          {segs.map((s, i) => s.v > 0 && (
            <div key={i} className="h-full" style={{ width: `${(s.v / r.total) * 100}%`, backgroundColor: s.c }} title={String(s.v)} />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: STATUS.active.color }} />{STATUS.active[lang]} {r.active}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: STATUS.hold.color }} />{STATUS.hold[lang]} {r.hold}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: STATUS.done.color }} />{STATUS.done[lang]} {r.done}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-muted px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500"><Target size={13} /> {t('kpi.needed')}</div>
          <div className="mt-0.5 text-base font-extrabold text-ink-900 tnum">{formatNumber(r.needed)}</div>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><UserCheck size={13} /> {t('kpi.accepted')}</div>
          <div className="mt-0.5 text-base font-extrabold text-ink-900 tnum">{formatNumber(r.accepted)}</div>
        </div>
      </div>
    </div>
  );
}

export function Recruiters({ a }: { a: Analytics }) {
  const { t } = useI18n();
  if (!a.byRecruiter.length) return <EmptyView text={t('state.empty')} />;

  return (
    <div className="space-y-4 animate-fade-up">
      <SectionTitle title={t('recruiters.title')} subtitle={t('recruiters.sub')} icon={<UserCheck size={18} />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {a.byRecruiter.map((r) => (
          <RecruiterCard key={r.name} r={r} />
        ))}
      </div>
    </div>
  );
}
