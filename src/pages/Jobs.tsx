import { useMemo } from 'react';
import { ExternalLink, FileText, Layers, Network, Target, TrendingUp } from 'lucide-react';
import type { Dataset, SheetRow } from '../types';
import { DomainView } from '../components/DomainView';
import { ChartCard } from '../components/ChartCard';
import { KpiCard } from '../components/KpiCard';
import { DataTable, type Column, type Facet } from '../components/DataTable';
import { Donut, StackedBarList } from '../components/charts';
import { TextChip } from '../components/primitives';
import { useI18n } from '../i18n/LangProvider';
import { keyOf, num, text } from '../lib/rows';
import { jobAnalytics } from '../lib/analytics';
import { formatNumber, formatPercent } from '../lib/format';
import { deptColor } from '../config/semantics';

const FIT_COLOR: Record<string, string> = {
  Under: '#F43F5E',
  Match: '#10B981',
  Over: '#F59E0B',
};

export function Jobs({ query }: { query: string }) {
  return (
    <DomainView domain="jobs">
      {(ds) => <JobsBody ds={ds} query={query} />}
    </DomainView>
  );
}

function JobsBody({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();
  const a = useMemo(() => jobAnalytics(ds), [ds]);

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          hero
          icon={<Network size={20} />}
          label={t('job.jobs')}
          hint={t('job.sub')}
          value={formatNumber(a.totalJobs)}
        />
        <KpiCard
          icon={<Layers size={20} />}
          label={t('job.forecast')}
          value={formatNumber(a.forecast)}
          tone="#0F72D8"
          delay={60}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label={t('job.hired')}
          value={formatNumber(a.hired)}
          tone="#10B981"
          delay={120}
        />
        <KpiCard
          icon={<Target size={20} />}
          label={t('job.coverage')}
          hint={t('ov.coverage.hint')}
          value={formatPercent(a.coverage)}
          tone="#2AA7F0"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <KpiCard
          icon={<FileText size={18} />}
          label={t('job.jdCoverage')}
          hint={`${a.withJd}/${a.totalJobs}`}
          value={formatPercent(a.jdCoverage)}
          tone="#0F72D8"
        />
        <KpiCard
          icon={<Target size={18} />}
          label={t('job.kpiCoverage')}
          hint={`${a.withKpis}/${a.totalJobs}`}
          value={formatPercent(a.kpiCoverage)}
          tone="#8B5CF6"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('job.byDept')} subtitle={t('job.sub')} className="lg:col-span-2">
          <StackedBarList
            legend={[
              { label: t('job.hired'), value: 0, color: '#10B981' },
              { label: t('job.under'), value: 0, color: '#E2E8F0' },
            ]}
            items={a.byDepartment.map((d) => ({
              name: d.name,
              total: Math.max(d.forecast, d.hired),
              segments: [
                { label: t('job.hired'), value: Math.min(d.hired, d.forecast), color: '#10B981' },
                {
                  label: d.gap >= 0 ? t('job.over') : t('job.under'),
                  value: Math.abs(d.gap),
                  color: d.gap > 0 ? '#F59E0B' : '#E2E8F0',
                },
              ],
            }))}
          />
        </ChartCard>

        <ChartCard title={t('job.gaps')} subtitle={t('job.gaps.sub')}>
          <Donut
            centerValue={formatNumber(a.totalJobs)}
            centerLabel={t('job.jobs')}
            data={[
              { label: t('job.under'), value: a.under, color: FIT_COLOR.Under },
              { label: t('job.match'), value: a.match, color: FIT_COLOR.Match },
              { label: t('job.over'), value: a.over, color: FIT_COLOR.Over },
            ]}
          />
        </ChartCard>

        <ChartCard title={t('job.gaps')} subtitle={t('job.gaps.sub')}>
          <ul className="max-h-[280px] space-y-2 overflow-y-auto pe-1">
            {a.gaps.slice(0, 24).map((g, i) => (
              <li
                key={i}
                className="flex items-center gap-2.5 rounded-lg bg-surface-muted/60 px-2.5 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink-900">
                    {g.title}
                  </span>
                  <span className="block truncate text-[11px] text-ink-400">{g.dept}</span>
                </span>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-[12px] font-bold tnum"
                  style={{
                    backgroundColor: g.gap < 0 ? '#FEE2E2' : '#FEF3C7',
                    color: g.gap < 0 ? '#B91C1C' : '#B45309',
                  }}
                >
                  {g.gap > 0 ? `+${g.gap}` : g.gap}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <JobTable ds={ds} query={query} />
    </div>
  );
}

function JobTable({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();

  const yesNo = (v: string) => v.trim().toLowerCase() === 'yes';

  const columns: Column<SheetRow>[] = [
    {
      key: 'title',
      label: t('nav.jobs'),
      primary: true,
      value: (r) => text(ds, r, 'title'),
      render: (r) => <span className="font-semibold text-ink-900">{text(ds, r, 'title')}</span>,
    },
    {
      key: 'department',
      label: t('filter.department'),
      value: (r) => text(ds, r, 'department'),
      render: (r) => {
        const d = text(ds, r, 'department');
        return d ? <TextChip color={deptColor(d)}>{d}</TextChip> : '—';
      },
    },
    {
      key: 'forecast',
      label: t('job.forecast'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'forecast'),
    },
    {
      key: 'hired',
      label: t('job.hired'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'hired'),
    },
    {
      key: 'gap',
      label: t('job.gaps'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'gap'),
      render: (r) => {
        const g = num(ds, r, 'gap') ?? 0;
        if (g === 0) return <TextChip color={FIT_COLOR.Match}>{t('job.match')}</TextChip>;
        return (
          <TextChip color={g < 0 ? FIT_COLOR.Under : FIT_COLOR.Over}>
            {g > 0 ? `+${g}` : g}
          </TextChip>
        );
      },
    },
    {
      key: 'jd',
      label: t('job.jdCoverage'),
      desktopOnly: true,
      value: (r) => text(ds, r, 'hasJd'),
      render: (r) => {
        const link = text(ds, r, 'jdLink');
        const ok = yesNo(text(ds, r, 'hasJd'));
        if (!ok) return <span className="text-ink-400">—</span>;
        return link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
          >
            <FileText size={13} />
            <ExternalLink size={11} />
          </a>
        ) : (
          <TextChip color="#10B981">✓</TextChip>
        );
      },
    },
    {
      key: 'kpis',
      label: t('job.kpiCoverage'),
      desktopOnly: true,
      value: (r) => text(ds, r, 'hasKpis'),
      render: (r) => {
        const link = text(ds, r, 'kpiLink');
        const ok = yesNo(text(ds, r, 'hasKpis'));
        if (!ok) return <span className="text-ink-400">—</span>;
        return link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
          >
            <Target size={13} />
            <ExternalLink size={11} />
          </a>
        ) : (
          <TextChip color="#10B981">✓</TextChip>
        );
      },
    },
  ];

  const facets: Facet<SheetRow>[] = [
    {
      key: 'department',
      label: t('filter.department'),
      options: [...new Set(ds.rows.map((r) => text(ds, r, 'department')).filter(Boolean))]
        .sort()
        .map((d) => ({ key: d, label: d })),
      match: (r, k) => text(ds, r, 'department') === k,
    },
    {
      key: 'fit',
      label: t('job.gaps'),
      options: [
        { key: 'Under', label: t('job.under') },
        { key: 'Match', label: t('job.match') },
        { key: 'Over', label: t('job.over') },
      ],
      match: (r, k) => {
        const g = num(ds, r, 'gap') ?? 0;
        return (g < 0 ? 'Under' : g === 0 ? 'Match' : 'Over') === k;
      },
    },
  ];

  const rows = query.trim()
    ? ds.rows.filter((r) => {
        const q = query.toLowerCase();
        return [text(ds, r, 'title'), text(ds, r, 'department')]
          .some((v) => v.toLowerCase().includes(q));
      })
    : ds.rows;

  return (
    <DataTable
      rows={rows}
      columns={columns}
      facets={facets}
      getKey={(r) => keyOf(ds, r)}
      title={t('job.title')}
    />
  );
}
