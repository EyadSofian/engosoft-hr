import { useMemo } from 'react';
import {
  CalendarRange, FileCheck2, LogOut, TimerReset, TrendingDown, Users,
} from 'lucide-react';
import type { Dataset, SheetRow } from '../types';
import { DomainView } from '../components/DomainView';
import { ChartCard } from '../components/ChartCard';
import { KpiCard } from '../components/KpiCard';
import { DataTable, type Column, type Facet } from '../components/DataTable';
import { BarList, Donut, StackedBarList } from '../components/charts';
import { TextChip } from '../components/primitives';
import { useI18n } from '../i18n/LangProvider';
import { date, keyOf, num, text } from '../lib/rows';
import { employeeAnalytics } from '../lib/analytics';
import { formatDate, formatDecimal, formatNumber, formatPercent } from '../lib/format';
import { deptColor } from '../config/semantics';

const GENDER_COLORS: Record<string, string> = { Male: '#0F72D8', Female: '#EC4899' };

export function Employees({ query }: { query: string }) {
  return (
    <DomainView domain="employees">
      {(ds) => <EmployeesBody ds={ds} query={query} />}
    </DomainView>
  );
}

function EmployeesBody({ ds, query }: { ds: Dataset; query: string }) {
  const { t, lang } = useI18n();
  const a = useMemo(() => employeeAnalytics(ds), [ds]);

  const yearSeries = useMemo(() => {
    const years = [...new Set([
      ...a.hiresByYear.map((s) => s.label),
      ...a.exitsByYear.map((s) => s.label),
    ])].sort();
    const hires = new Map(a.hiresByYear.map((s) => [s.label, s.value]));
    const exits = new Map(a.exitsByYear.map((s) => [s.label, s.value]));
    return years.map((y) => ({
      name: y,
      total: (hires.get(y) ?? 0) + (exits.get(y) ?? 0),
      segments: [
        { label: t('emp.active'), value: hires.get(y) ?? 0, color: '#10B981' },
        { label: t('emp.inactive'), value: exits.get(y) ?? 0, color: '#F43F5E' },
      ],
    }));
  }, [a, t]);

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          hero
          icon={<Users size={20} />}
          label={t('ov.headcount')}
          hint={t('ov.headcount.hint')}
          value={formatNumber(a.active)}
        />
        <KpiCard
          icon={<TrendingDown size={20} />}
          label={t('ov.turnover')}
          hint={t('ov.turnover.hint')}
          value={a.turnover === null ? '—' : formatPercent(a.turnover)}
          tone="#F43F5E"
          delay={60}
        />
        <KpiCard
          icon={<CalendarRange size={20} />}
          label={t('ov.newHires')}
          hint={t('ov.newHires.hint')}
          value={formatNumber(a.newThisYear)}
          tone="#10B981"
          delay={120}
        />
        <KpiCard
          icon={<LogOut size={20} />}
          label={t('emp.inactive')}
          hint={t('ov.turnover.hint')}
          value={formatNumber(a.leftThisYear)}
          tone="#F59E0B"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          icon={<TimerReset size={18} />}
          label={t('emp.avgTenure')}
          value={a.avgTenureYears === null ? '—' : `${formatDecimal(a.avgTenureYears)} ${t('emp.years')}`}
          tone="#0F72D8"
        />
        <KpiCard
          icon={<Users size={18} />}
          label={t('emp.avgAge')}
          value={a.avgAge === null ? '—' : formatDecimal(a.avgAge)}
          tone="#2AA7F0"
        />
        <KpiCard
          icon={<FileCheck2 size={18} />}
          label={t('ov.probation')}
          hint={t('ov.probation.hint')}
          value={formatNumber(a.underProbation.length)}
          tone="#F59E0B"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('emp.byDept')} subtitle={t('emp.byDept.sub')} className="lg:col-span-2">
          <StackedBarList
            legend={[
              { label: t('emp.active'), value: 0, color: '#10B981' },
              { label: t('emp.inactive'), value: 0, color: '#CBD5E1' },
            ]}
            items={a.byDepartment.map((d) => ({
              name: d.name,
              total: d.total,
              segments: [
                { label: t('emp.active'), value: d.active, color: '#10B981' },
                { label: t('emp.inactive'), value: d.total - d.active, color: '#CBD5E1' },
              ],
            }))}
          />
        </ChartCard>

        <ChartCard title={t('emp.hiresByYear')} subtitle={t('emp.byDept.sub')}>
          <StackedBarList
            legend={[
              { label: t('ov.newHires'), value: 0, color: '#10B981' },
              { label: t('emp.inactive'), value: 0, color: '#F43F5E' },
            ]}
            items={yearSeries}
          />
        </ChartCard>

        <ChartCard title={t('emp.docs')} subtitle={t('emp.docs.sub')}>
          <Donut
            centerValue={formatPercent(a.docCompletion.rate)}
            centerLabel={t('emp.docs')}
            data={[
              { label: t('emp.docs.complete'), value: a.docCompletion.complete, color: '#10B981' },
              { label: t('emp.docs.partial'), value: a.docCompletion.partial, color: '#F59E0B' },
              { label: t('emp.docs.missing'), value: a.docCompletion.missing, color: '#F43F5E' },
            ]}
          />
        </ChartCard>

        <ChartCard title={t('emp.gender')} subtitle={t('ov.headcount.hint')}>
          <Donut
            size={148}
            centerValue={formatNumber(a.active)}
            data={a.byGender.map((s) => ({
              label: s.label,
              value: s.value,
              color: GENDER_COLORS[s.label] ?? deptColor(s.label),
            }))}
          />
        </ChartCard>

        <ChartCard title={t('emp.sector')} subtitle={t('ov.headcount.hint')}>
          <BarList
            items={a.bySector.slice(0, 9).map((s) => ({
              name: s.label,
              value: s.value,
              color: deptColor(s.label),
            }))}
          />
        </ChartCard>

        <ChartCard title={t('emp.workType')} subtitle={t('ov.headcount.hint')}>
          <BarList
            items={a.byWorkType.map((s) => ({
              name: s.label,
              value: s.value,
              color: deptColor(s.label),
            }))}
          />
        </ChartCard>

        <ChartCard title={t('emp.hiresThisYear')} subtitle={t('emp.byDept.sub')}>
          <BarList items={a.hiresByMonth.map((s) => ({ name: s.label, value: s.value }))} />
        </ChartCard>
      </div>

      {a.underProbation.length > 0 && (
        <ChartCard title={t('emp.probationList')} subtitle={t('emp.probationList.sub')}>
          <ul className="divide-y divide-slate-100">
            {a.underProbation.map((r) => (
              <li key={keyOf(ds, r)} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="flex-1 text-[13.5px] font-semibold text-ink-900">
                  {text(ds, r, 'nameEn') || text(ds, r, 'nameAr')}
                </span>
                <TextChip color={deptColor(text(ds, r, 'department'))}>
                  {text(ds, r, 'department')}
                </TextChip>
                <span className="text-[12px] text-ink-500 tnum">
                  {formatDate(date(ds, r, 'lastProbation'), lang)}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      <EmployeeTable ds={ds} query={query} />
    </div>
  );
}

function EmployeeTable({ ds, query }: { ds: Dataset; query: string }) {
  const { t, lang } = useI18n();

  const columns: Column<SheetRow>[] = [
    {
      key: 'name',
      label: t('nav.employees'),
      primary: true,
      value: (r) => text(ds, r, 'nameEn') || text(ds, r, 'nameAr'),
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink-900">
            {text(ds, r, 'nameEn') || text(ds, r, 'nameAr')}
          </div>
          <div className="truncate text-[11.5px] text-ink-400">{text(ds, r, 'title')}</div>
        </div>
      ),
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
      key: 'status',
      label: t('filter.status'),
      value: (r) => text(ds, r, 'empStatus'),
      render: (r) => {
        const active = text(ds, r, 'empStatus').toLowerCase().startsWith('act');
        return (
          <TextChip color={active ? '#10B981' : '#8496AC'}>
            {active ? t('emp.active') : t('emp.inactive')}
          </TextChip>
        );
      },
    },
    {
      key: 'hired',
      label: t('ov.newHires'),
      numeric: true,
      value: (r) => date(ds, r, 'hiringDate')?.getTime() ?? null,
      render: (r) => formatDate(date(ds, r, 'hiringDate'), lang),
    },
    {
      key: 'manager',
      label: t('perf.plans'),
      desktopOnly: true,
      value: (r) => text(ds, r, 'manager'),
    },
    {
      key: 'workType',
      label: t('emp.workType'),
      desktopOnly: true,
      value: (r) => text(ds, r, 'workType'),
    },
    {
      key: 'docs',
      label: t('emp.docs'),
      desktopOnly: true,
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'docRate'),
      render: (r) => {
        const v = num(ds, r, 'docRate');
        return v === null ? '—' : formatPercent(v * 100);
      },
    },
  ];

  const facets: Facet<SheetRow>[] = [
    {
      key: 'status',
      label: t('filter.status'),
      options: [
        { key: 'active', label: t('emp.active') },
        { key: 'inactive', label: t('emp.inactive') },
      ],
      match: (r, k) =>
        (text(ds, r, 'empStatus').toLowerCase().startsWith('act') ? 'active' : 'inactive') === k,
    },
    {
      key: 'department',
      label: t('filter.department'),
      options: [...new Set(ds.rows.map((r) => text(ds, r, 'department')).filter(Boolean))]
        .sort()
        .map((d) => ({ key: d, label: d })),
      match: (r, k) => text(ds, r, 'department') === k,
    },
  ];

  const rows = query.trim()
    ? ds.rows.filter((r) => {
        const q = query.toLowerCase();
        return [
          text(ds, r, 'nameEn'), text(ds, r, 'nameAr'),
          text(ds, r, 'title'), text(ds, r, 'department'),
        ].some((v) => v.toLowerCase().includes(q));
      })
    : ds.rows;

  return (
    <DataTable
      rows={rows}
      columns={columns}
      facets={facets}
      getKey={(r) => keyOf(ds, r) || text(ds, r, 'nameEn')}
      title={t('emp.title')}
      expand={(r) => (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
          {[
            { label: t('emp.sector'), value: text(ds, r, 'sector') },
            { label: t('emp.avgAge'), value: text(ds, r, 'age').split('.')[0] },
            { label: t('emp.gender'), value: text(ds, r, 'gender') },
            { label: t('emp.workType'), value: text(ds, r, 'workType') },
            { label: t('nav.training'), value: text(ds, r, 'education') },
            { label: t('ov.probation'), value: text(ds, r, 'probation') },
            { label: t('emp.inactive'), value: formatDate(date(ds, r, 'resignDate'), lang) },
            { label: t('emp.docs'), value: text(ds, r, 'docCollection') },
          ]
            .filter((f) => f.value && f.value !== '—')
            .map((f) => (
              <div key={f.label}>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                  {f.label}
                </dt>
                <dd className="text-[13px] text-ink-700">{f.value}</dd>
              </div>
            ))}
        </dl>
      )}
    />
  );
}
