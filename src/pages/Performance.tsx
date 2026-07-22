import { useMemo } from 'react';
import { Award, ClipboardCheck, ListChecks, Sparkles, TrendingUp } from 'lucide-react';
import type { Dataset, SheetRow } from '../types';
import { DomainView } from '../components/DomainView';
import { ChartCard } from '../components/ChartCard';
import { KpiCard } from '../components/KpiCard';
import { DataTable, type Column } from '../components/DataTable';
import { BarList, Donut } from '../components/charts';
import { TextChip } from '../components/primitives';
import { useDomain } from '../data/DataProvider';
import { useI18n } from '../i18n/LangProvider';
import { countBy, keyOf, num, text, toSlices } from '../lib/rows';
import { appraisalAnalytics } from '../lib/analytics';
import { formatDecimal, formatNumber, formatPercent } from '../lib/format';
import { deptColor } from '../config/semantics';

const GRADE_COLOR: Record<string, string> = {
  'ممتاز': '#10B981',
  'جيد جدًا': '#0F72D8',
  'جيد': '#2AA7F0',
  'متوسط': '#F59E0B',
  'ضعيف': '#F43F5E',
};

const PLAN_COLOR: Record<string, string> = {
  'قيد التنفيذ': '#0F72D8',
  'لم تبدأ': '#8496AC',
  'متأخرة': '#F43F5E',
  'مكتملة': '#10B981',
};

export function Performance({ query }: { query: string }) {
  return (
    <DomainView domain="appraisals">
      {(ds) => <PerformanceBody ds={ds} query={query} />}
    </DomainView>
  );
}

function PerformanceBody({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();
  const a = useMemo(() => appraisalAnalytics(ds), [ds]);
  const criteria = useDomain('criteria');
  const plans = useDomain('plans');

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          hero
          icon={<ClipboardCheck size={20} />}
          label={t('perf.reviewed')}
          hint={t('perf.sub')}
          value={formatNumber(a.total)}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label={t('perf.avg')}
          value={a.avgPercent === null ? '—' : formatPercent(a.avgPercent)}
          tone="#0F72D8"
          delay={60}
        />
        <KpiCard
          icon={<ListChecks size={20} />}
          label={t('perf.criteria')}
          hint={t('perf.criteria.sub')}
          value={formatNumber(criteria.dataset?.rows.length ?? 0)}
          tone="#8B5CF6"
          delay={120}
        />
        <KpiCard
          icon={<Sparkles size={20} />}
          label={t('perf.plans')}
          hint={t('perf.plans.sub')}
          value={formatNumber(plans.dataset?.rows.length ?? 0)}
          tone="#F59E0B"
          delay={180}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('perf.grades')} subtitle={t('perf.sub')}>
          <Donut
            centerValue={formatNumber(a.total)}
            centerLabel={t('unit.person')}
            data={a.byGrade.map((s) => ({
              label: s.label,
              value: s.value,
              color: GRADE_COLOR[s.label] ?? deptColor(s.label),
            }))}
          />
        </ChartCard>

        <ChartCard title={t('perf.buckets')} subtitle={t('perf.buckets.sub')}>
          <ul className="space-y-3.5">
            {a.buckets.map((b) => (
              <li key={b.label}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                  <span className="font-medium text-ink-700">{b.label}</span>
                  <span className="font-bold text-ink-900 tnum">
                    {formatDecimal(b.avg)} / {b.max}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${Math.min((b.avg / b.max) * 100, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>

        {a.byDepartment.length > 0 && (
          <ChartCard title={t('perf.byDept')} subtitle={t('perf.sub')}>
            <BarList
              items={a.byDepartment.map((d) => ({ name: d.name, value: d.avg, color: d.color }))}
              format={(v) => formatPercent(v)}
            />
          </ChartCard>
        )}

        {a.ranked.length > 0 && (
          <ChartCard title={t('perf.ranking')} subtitle={t('perf.sub')}>
            <ol className="space-y-2">
              {a.ranked.map((r, i) => (
                <li
                  key={`${r.name}-${i}`}
                  className="flex items-center gap-2.5 rounded-lg bg-surface-muted/60 px-2.5 py-2"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white
                                   text-[11.5px] font-bold text-ink-500 tnum">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-900">
                      {r.name}
                    </span>
                    <span className="block truncate text-[11px] text-ink-400">{r.dept}</span>
                  </span>
                  <TextChip color={GRADE_COLOR[r.grade] ?? '#8496AC'}>
                    {formatPercent(r.percent)}
                  </TextChip>
                </li>
              ))}
            </ol>
          </ChartCard>
        )}
      </div>

      {criteria.dataset && criteria.dataset.rows.length > 0 && (
        <CriteriaCard ds={criteria.dataset} />
      )}

      {plans.dataset && <PlansCard ds={plans.dataset} />}

      <AppraisalTable ds={ds} query={query} />
    </div>
  );
}

/** The instrument itself — 8 groups, 40 criteria. This is the reusable asset. */
function CriteriaCard({ ds }: { ds: Dataset }) {
  const { t } = useI18n();

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; bucket: string; items: string[] }>();
    for (const r of ds.rows) {
      const g = text(ds, r, 'critGroup');
      if (!g) continue;
      const entry = map.get(g) ?? { name: g, bucket: text(ds, r, 'critBucket'), items: [] };
      entry.items.push(text(ds, r, 'critName'));
      map.set(g, entry);
    }
    return [...map.values()];
  }, [ds]);

  return (
    <ChartCard
      title={t('perf.criteria')}
      subtitle={t('perf.criteria.sub')}
      icon={<ListChecks size={17} />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <div key={g.name} className="rounded-xl border border-slate-100 bg-surface-muted/40 p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h4 className="text-[13px] font-bold leading-snug text-ink-900">{g.name}</h4>
              <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold
                               text-ink-500 tnum">
                {g.items.length}
              </span>
            </div>
            {g.bucket && (
              <TextChip color={deptColor(g.bucket)}>{g.bucket}</TextChip>
            )}
            <ul className="mt-2 space-y-1">
              {g.items.map((item, i) => (
                <li key={i} className="text-[11.5px] leading-relaxed text-ink-500">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

/** Improvement plans are the direct input to the training report. */
function PlansCard({ ds }: { ds: Dataset }) {
  const { t } = useI18n();

  if (!ds.rows.length) {
    return (
      <ChartCard title={t('perf.plans')} subtitle={t('perf.plans.sub')}>
        <p className="py-6 text-center text-[13px] text-ink-400">{t('perf.noPlans')}</p>
      </ChartCard>
    );
  }

  const byStatus = toSlices(countBy(ds.rows, (r) => text(ds, r, 'planStatus')));

  return (
    <ChartCard
      title={t('perf.plans')}
      subtitle={t('perf.plans.sub')}
      icon={<Award size={17} />}
      right={
        <div className="flex flex-wrap gap-1.5">
          {byStatus.map((s) => (
            <TextChip key={s.label} color={PLAN_COLOR[s.label] ?? '#8496AC'}>
              {s.label} · {s.value}
            </TextChip>
          ))}
        </div>
      }
    >
      <ul className="space-y-3">
        {ds.rows.map((r) => (
          <li key={keyOf(ds, r)} className="rounded-xl border border-slate-100 p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-bold text-ink-900">
                {text(ds, r, 'aprName')}
              </span>
              <TextChip color={PLAN_COLOR[text(ds, r, 'planStatus')] ?? '#8496AC'}>
                {text(ds, r, 'planStatus')}
              </TextChip>
              <span className="ms-auto text-[11.5px] text-ink-400 tnum">
                {text(ds, r, 'planStart')} → {text(ds, r, 'planEnd')}
              </span>
            </div>

            <dl className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
              {[
                { label: t('perf.ranking'), value: text(ds, r, 'planStrengths') },
                { label: t('kpis.weightWarn'), value: text(ds, r, 'planGaps') },
                { label: t('train.title'), value: text(ds, r, 'planAction') },
              ]
                .filter((f) => f.value)
                .map((f) => (
                  <div key={f.label}>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 text-[12.5px] leading-relaxed text-ink-700">{f.value}</dd>
                  </div>
                ))}
            </dl>

            {text(ds, r, 'planRecommendation') && (
              <p className="mt-2.5 text-[12px] text-ink-500">
                {text(ds, r, 'planOwner')} · {text(ds, r, 'planRecommendation')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

function AppraisalTable({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();

  const columns: Column<SheetRow>[] = [
    {
      key: 'name',
      label: t('nav.employees'),
      primary: true,
      value: (r) => text(ds, r, 'aprName'),
      render: (r) => <span className="font-semibold text-ink-900">{text(ds, r, 'aprName')}</span>,
    },
    { key: 'dept', label: t('filter.department'), value: (r) => text(ds, r, 'aprDept') },
    {
      key: 'total',
      label: t('perf.avg'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'aprTotal'),
    },
    {
      key: 'percent',
      label: t('perf.avg'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'aprPercent'),
      render: (r) => {
        const v = num(ds, r, 'aprPercent');
        return v === null ? '—' : formatPercent(v <= 1 ? v * 100 : v);
      },
    },
    {
      key: 'grade',
      label: t('perf.grades'),
      value: (r) => text(ds, r, 'aprGrade'),
      render: (r) => {
        const g = text(ds, r, 'aprGrade');
        return g ? <TextChip color={GRADE_COLOR[g] ?? '#8496AC'}>{g}</TextChip> : '—';
      },
    },
    { key: 'date', label: t('sal.period'), desktopOnly: true, value: (r) => text(ds, r, 'aprDate') },
  ];

  const rows = query.trim()
    ? ds.rows.filter((r) =>
        [text(ds, r, 'aprName'), text(ds, r, 'aprDept')]
          .some((v) => v.toLowerCase().includes(query.toLowerCase())))
    : ds.rows;

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getKey={(r) => keyOf(ds, r)}
      title={t('perf.title')}
    />
  );
}
