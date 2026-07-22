import { useMemo } from 'react';
import { Coins, PieChart, Scale, TrendingUp, Users, Wallet } from 'lucide-react';
import type { Dataset, SheetRow } from '../types';
import { SalaryGate } from '../auth/SalaryGate';
import { DomainView } from '../components/DomainView';
import { ChartCard } from '../components/ChartCard';
import { KpiCard } from '../components/KpiCard';
import { DataTable, type Column, type Facet } from '../components/DataTable';
import { BarList, Donut } from '../components/charts';
import { TextChip } from '../components/primitives';
import { useI18n } from '../i18n/LangProvider';
import { keyOf, num, text } from '../lib/rows';
import { salaryAnalytics } from '../lib/analytics';
import { formatMoney, formatNumber, formatPercent } from '../lib/format';
import { deptColor } from '../config/semantics';

/**
 * Payroll. Everything here sits behind <SalaryGate>, which also means the
 * Salaries tab is never fetched from Google Sheets until the passcode opens it.
 */
export function Salaries({ query }: { query: string }) {
  return (
    <SalaryGate>
      <DomainView domain="salaries">
        {(ds) => <SalariesBody ds={ds} query={query} />}
      </DomainView>
    </SalaryGate>
  );
}

function SalariesBody({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();
  const a = useMemo(() => salaryAnalytics(ds), [ds]);

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          hero
          icon={<Wallet size={20} />}
          label={t('sal.totalCost')}
          hint={`${t('sal.period')} ${a.period || '—'}`}
          value={formatMoney(a.totalCost)}
        />
        <KpiCard
          icon={<Coins size={20} />}
          label={t('sal.basic')}
          hint={t('unit.egpMo')}
          value={formatMoney(a.basicCost)}
          tone="#0F72D8"
          delay={60}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label={t('sal.kpiCost')}
          hint={`${t('sal.kpiShare')} ${formatPercent(a.kpiShare)}`}
          value={formatMoney(a.kpiCost)}
          tone="#10B981"
          delay={120}
        />
        <KpiCard
          icon={<Users size={20} />}
          label={t('sal.paid')}
          hint={`${formatNumber(a.headcount)} ${t('unit.person')}`}
          value={formatNumber(a.paidCount)}
          tone="#2AA7F0"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          icon={<Scale size={18} />}
          label={t('sal.median')}
          value={formatMoney(a.medianSalary)}
          tone="#0F72D8"
        />
        <KpiCard
          icon={<Scale size={18} />}
          label={t('sal.avg')}
          value={formatMoney(a.avg)}
          tone="#2AA7F0"
        />
        <KpiCard
          icon={<PieChart size={18} />}
          label={t('sal.concentration')}
          hint={t('sal.concentration.sub')}
          value={formatPercent(a.topEarnersShare)}
          tone="#F59E0B"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('sal.byDept')} subtitle={t('sal.byDept.sub')} className="lg:col-span-2">
          <BarList
            items={a.byDepartment.map((d) => ({ name: d.name, value: d.total, color: d.color }))}
            format={formatMoney}
          />
        </ChartCard>

        <ChartCard title={t('sal.bands')} subtitle={t('sal.bands.sub')}>
          <BarList items={a.bands.map((b) => ({ name: b.label, value: b.value }))} />
        </ChartCard>

        <ChartCard title={t('sal.kpiShare')} subtitle={t('sal.totalCost')}>
          <Donut
            centerValue={formatPercent(a.kpiShare)}
            centerLabel={t('sal.kpiCost')}
            data={[
              { label: t('sal.basic'), value: a.basicCost, color: '#0F72D8' },
              { label: t('sal.kpiCost'), value: a.kpiCost, color: '#10B981' },
            ]}
          />
        </ChartCard>
      </div>

      <SalaryTable ds={ds} query={query} />
    </div>
  );
}

function SalaryTable({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();

  const columns: Column<SheetRow>[] = [
    {
      key: 'name',
      label: t('nav.employees'),
      primary: true,
      value: (r) => text(ds, r, 'nameEn'),
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink-900">{text(ds, r, 'nameEn')}</div>
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
      key: 'basic',
      label: t('sal.basic'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'basic'),
      render: (r) => {
        const v = num(ds, r, 'basic');
        return v ? formatMoney(v) : '—';
      },
    },
    {
      key: 'kpi',
      label: t('sal.kpiCost'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'kpiAmount'),
      render: (r) => {
        const v = num(ds, r, 'kpiAmount');
        return v ? formatMoney(v) : '—';
      },
    },
    {
      key: 'total',
      label: t('sal.totalCost'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'totalSalary'),
      render: (r) => {
        const v = num(ds, r, 'totalSalary');
        return v ? (
          <span className="font-bold text-ink-900">{formatMoney(v)}</span>
        ) : (
          <span className="text-ink-400">—</span>
        );
      },
    },
    {
      key: 'status',
      label: t('filter.status'),
      desktopOnly: true,
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
        return [text(ds, r, 'nameEn'), text(ds, r, 'title'), text(ds, r, 'department')]
          .some((v) => v.toLowerCase().includes(q));
      })
    : ds.rows;

  return (
    <DataTable
      rows={rows}
      columns={columns}
      facets={facets}
      getKey={(r) => keyOf(ds, r) || text(ds, r, 'nameEn')}
      title={t('sal.roster')}
    />
  );
}
