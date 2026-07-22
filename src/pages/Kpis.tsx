import { useMemo } from 'react';
import { AlertTriangle, Building2, Gauge, Target, Users } from 'lucide-react';
import type { Dataset, SheetRow } from '../types';
import { DomainView } from '../components/DomainView';
import { ChartCard } from '../components/ChartCard';
import { KpiCard } from '../components/KpiCard';
import { DataTable, type Column, type Facet } from '../components/DataTable';
import { BarList, Donut } from '../components/charts';
import { TextChip } from '../components/primitives';
import { useI18n } from '../i18n/LangProvider';
import { keyOf, num, text } from '../lib/rows';
import { kpiAnalytics } from '../lib/analytics';
import { formatNumber } from '../lib/format';
import { deptColor } from '../config/semantics';

export function Kpis({ query }: { query: string }) {
  return (
    <DomainView domain="kpis">
      {(ds) => <KpisBody ds={ds} query={query} />}
    </DomainView>
  );
}

function KpisBody({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();
  const a = useMemo(() => kpiAnalytics(ds), [ds]);

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          hero
          icon={<Target size={20} />}
          label={t('kpis.count')}
          hint={t('kpis.sub')}
          value={formatNumber(a.total)}
        />
        <KpiCard
          icon={<Users size={20} />}
          label={t('kpis.roles')}
          value={formatNumber(a.roles)}
          tone="#0F72D8"
          delay={60}
        />
        <KpiCard
          icon={<Building2 size={20} />}
          label={t('kpis.depts')}
          value={formatNumber(a.departments)}
          tone="#8B5CF6"
          delay={120}
        />
      </div>

      {a.weightIssues.length > 0 && (
        <div className="card animate-fade-up border-amber-200 bg-amber-50/60 p-4">
          <div className="flex gap-3">
            <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-amber-900">
                {t('kpis.weightWarn')} · {a.weightIssues.length}
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-amber-800">
                {t('kpis.weightWarn.sub')}
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {a.weightIssues.map((r) => (
                  <li key={r.role}>
                    <span className="chip bg-white text-amber-800">
                      {r.role}
                      <span className="tnum font-bold">{Math.round(r.weight)}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('kpis.byCategory')} subtitle={t('kpis.sub')}>
          <Donut
            centerValue={formatNumber(a.total)}
            centerLabel={t('kpis.count')}
            data={a.byCategory.map((s) => ({
              label: s.label,
              value: s.value,
              color: deptColor(s.label),
            }))}
          />
        </ChartCard>

        <ChartCard title={t('kpis.byDept')} subtitle={t('kpis.sub')}>
          <BarList
            items={a.byDepartment.map((s) => ({
              name: s.label,
              value: s.value,
              color: deptColor(s.label),
            }))}
          />
        </ChartCard>

        <ChartCard
          title={t('kpis.coverage')}
          subtitle={t('kpis.coverage.sub')}
          className="lg:col-span-2"
          icon={<Gauge size={17} />}
        >
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {a.roleCoverage.map((r) => {
              const off = Math.round(r.weight) !== 100;
              return (
                <li
                  key={r.role}
                  className="flex items-center gap-2.5 rounded-lg bg-surface-muted/60 px-2.5 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-ink-900">
                      {r.role}
                    </span>
                    <span className="block truncate text-[11px] text-ink-400">{r.dept}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-bold text-ink-500 tnum">
                    {r.count}
                  </span>
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tnum"
                    style={{
                      backgroundColor: off ? '#FEF3C7' : '#D1FAE5',
                      color: off ? '#B45309' : '#047857',
                    }}
                  >
                    {Math.round(r.weight)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </ChartCard>
      </div>

      <KpiTable ds={ds} query={query} />
    </div>
  );
}

function KpiTable({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();

  const columns: Column<SheetRow>[] = [
    {
      key: 'code',
      label: t('kpis.count'),
      value: (r) => text(ds, r, 'kpiCode'),
      render: (r) => (
        <span className="font-mono text-[12px] font-bold text-brand-600">
          {text(ds, r, 'kpiCode')}
        </span>
      ),
    },
    {
      key: 'name',
      label: t('kpis.title'),
      primary: true,
      value: (r) => text(ds, r, 'kpiName'),
      render: (r) => <span className="font-semibold text-ink-900">{text(ds, r, 'kpiName')}</span>,
    },
    {
      key: 'role',
      label: t('kpis.roles'),
      value: (r) => text(ds, r, 'kpiRole'),
    },
    {
      key: 'category',
      label: t('kpis.byCategory'),
      value: (r) => text(ds, r, 'kpiCategory'),
      render: (r) => {
        const c = text(ds, r, 'kpiCategory');
        return c ? <TextChip color={deptColor(c)}>{c}</TextChip> : '—';
      },
    },
    {
      key: 'weight',
      label: t('kpis.weight'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'kpiWeight'),
      render: (r) => `${num(ds, r, 'kpiWeight') ?? 0}%`,
    },
    {
      key: 'target',
      label: t('job.forecast'),
      desktopOnly: true,
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'kpiTarget'),
    },
    {
      key: 'unit',
      label: t('set.state'),
      desktopOnly: true,
      value: (r) => text(ds, r, 'kpiUnit'),
    },
  ];

  const uniq = (key: 'kpiDept' | 'kpiCategory' | 'kpiRole') =>
    [...new Set(ds.rows.map((r) => text(ds, r, key)).filter(Boolean))].sort();

  const facets: Facet<SheetRow>[] = [
    {
      key: 'dept',
      label: t('filter.department'),
      options: uniq('kpiDept').map((d) => ({ key: d, label: d })),
      match: (r, k) => text(ds, r, 'kpiDept') === k,
    },
    {
      key: 'category',
      label: t('kpis.byCategory'),
      options: uniq('kpiCategory').map((d) => ({ key: d, label: d })),
      match: (r, k) => text(ds, r, 'kpiCategory') === k,
    },
    {
      key: 'role',
      label: t('kpis.roles'),
      options: uniq('kpiRole').map((d) => ({ key: d, label: d })),
      match: (r, k) => text(ds, r, 'kpiRole') === k,
    },
  ];

  const rows = query.trim()
    ? ds.rows.filter((r) =>
        [text(ds, r, 'kpiName'), text(ds, r, 'kpiRole'), text(ds, r, 'kpiDept')]
          .some((v) => v.toLowerCase().includes(query.toLowerCase())))
    : ds.rows;

  return (
    <DataTable
      rows={rows}
      columns={columns}
      facets={facets}
      getKey={(r) => keyOf(ds, r)}
      title={t('kpis.title')}
      expand={(r) => (
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            { label: t('kpis.title'), value: text(ds, r, 'kpiDefinition') },
            { label: t('set.source'), value: text(ds, r, 'kpiSource') },
            { label: t('job.forecast'), value: text(ds, r, 'kpiTarget') },
            { label: t('set.state'), value: text(ds, r, 'kpiDirection') },
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
      )}
    />
  );
}
