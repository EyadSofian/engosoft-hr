import { useMemo } from 'react';
import {
  AlertTriangle, ArrowRight, Briefcase, CalendarClock, FileWarning, Network,
  Target, TimerReset, TrendingDown, Users,
} from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { KpiCard } from '../components/KpiCard';
import { BarList, Donut, StackedBarList } from '../components/charts';
import { LoadingView } from '../components/StateViews';
import { useDomain } from '../data/DataProvider';
import { useI18n } from '../i18n/LangProvider';
import {
  employeeAnalytics, jobAnalytics, kpiAnalytics, recruitmentAnalytics,
} from '../lib/analytics';
import { formatDecimal, formatNumber, formatPercent } from '../lib/format';
import { STATUS, deptColor } from '../config/semantics';
import type { View } from '../nav';

/**
 * The one screen a manager opens first: headline numbers from every domain, and
 * a single list of what is actually waiting on someone.
 */
export function Overview({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { t } = useI18n();
  const employees = useDomain('employees');
  const recruitment = useDomain('recruitment');
  const jobs = useDomain('jobs');
  const kpis = useDomain('kpis');

  const emp = useMemo(
    () => (employees.dataset ? employeeAnalytics(employees.dataset) : null),
    [employees.dataset],
  );
  const rec = useMemo(
    () => (recruitment.dataset ? recruitmentAnalytics(recruitment.dataset) : null),
    [recruitment.dataset],
  );
  const job = useMemo(
    () => (jobs.dataset ? jobAnalytics(jobs.dataset) : null),
    [jobs.dataset],
  );
  const kpi = useMemo(
    () => (kpis.dataset ? kpiAnalytics(kpis.dataset) : null),
    [kpis.dataset],
  );

  // Show the page as soon as anything has landed; the rest fills in.
  if (!emp && !rec && !job && !kpi) return <LoadingView text={t('state.loading')} />;

  const attention = [
    rec && {
      icon: CalendarClock, label: t('kpi.overdue'), count: rec.overdue,
      tone: '#F43F5E', view: 'recruitment' as View,
    },
    emp && {
      icon: TimerReset, label: t('ov.probation'), count: emp.underProbation.length,
      tone: '#F59E0B', view: 'employees' as View,
    },
    emp && {
      icon: FileWarning, label: t('emp.docs.missing'), count: emp.docCompletion.missing,
      tone: '#F43F5E', view: 'employees' as View,
    },
    job && {
      icon: Network, label: t('job.under'), count: job.under,
      tone: '#F43F5E', view: 'jobs' as View,
    },
    job && {
      icon: Target, label: `${t('job.kpiCoverage')} — ${t('job.under')}`,
      count: job.totalJobs - job.withKpis, tone: '#8B5CF6', view: 'jobs' as View,
    },
    kpi && {
      icon: AlertTriangle, label: t('kpis.weightWarn'), count: kpi.weightIssues.length,
      tone: '#F59E0B', view: 'kpis' as View,
    },
  ].filter((x): x is NonNullable<typeof x> => Boolean(x) && x!.count > 0);

  const yearSeries = emp
    ? (() => {
        const years = [...new Set([
          ...emp.hiresByYear.map((s) => s.label),
          ...emp.exitsByYear.map((s) => s.label),
        ])].sort();
        const hires = new Map(emp.hiresByYear.map((s) => [s.label, s.value]));
        const exits = new Map(emp.exitsByYear.map((s) => [s.label, s.value]));
        return years.map((y) => ({
          name: y,
          total: (hires.get(y) ?? 0) + (exits.get(y) ?? 0),
          segments: [
            { label: t('ov.newHires'), value: hires.get(y) ?? 0, color: '#10B981' },
            { label: t('emp.inactive'), value: exits.get(y) ?? 0, color: '#F43F5E' },
          ],
        }));
      })()
    : [];

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          hero
          icon={<Users size={20} />}
          label={t('ov.headcount')}
          hint={t('ov.headcount.hint')}
          value={emp ? formatNumber(emp.active) : '—'}
          onClick={() => onNavigate('employees')}
        />
        <KpiCard
          icon={<Briefcase size={20} />}
          label={t('ov.openRoles')}
          hint={t('ov.openRoles.hint')}
          value={rec ? formatNumber(rec.active) : '—'}
          tone="#0F72D8"
          delay={60}
          onClick={() => onNavigate('recruitment')}
        />
        <KpiCard
          icon={<TrendingDown size={20} />}
          label={t('ov.turnover')}
          hint={t('ov.turnover.hint')}
          value={emp?.turnover == null ? '—' : formatPercent(emp.turnover)}
          tone="#F43F5E"
          delay={120}
          onClick={() => onNavigate('employees')}
        />
        <KpiCard
          icon={<Network size={20} />}
          label={t('ov.coverage')}
          hint={t('ov.coverage.hint')}
          value={job ? formatPercent(job.coverage) : '—'}
          tone="#2AA7F0"
          delay={180}
          onClick={() => onNavigate('jobs')}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          icon={<Users size={18} />}
          label={t('ov.newHires')}
          value={emp ? formatNumber(emp.newThisYear) : '—'}
          tone="#10B981"
        />
        <KpiCard
          icon={<TimerReset size={18} />}
          label={t('emp.avgTenure')}
          value={emp?.avgTenureYears == null
            ? '—'
            : `${formatDecimal(emp.avgTenureYears)} ${t('emp.years')}`}
          tone="#0F72D8"
        />
        <KpiCard
          icon={<Target size={18} />}
          label={t('kpis.count')}
          value={kpi ? formatNumber(kpi.total) : '—'}
          tone="#8B5CF6"
          onClick={() => onNavigate('kpis')}
        />
      </div>

      {attention.length > 0 && (
        <ChartCard
          title={t('ov.attention')}
          subtitle={t('ov.attention.sub')}
          icon={<AlertTriangle size={17} />}
        >
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {attention.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.view)}
                  className="focus-ring flex min-h-[56px] w-full items-center gap-3 rounded-xl border
                             border-slate-100 bg-surface-muted/50 px-3 text-start transition
                             hover:border-slate-200 hover:bg-white"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${item.tone}1a`, color: item.tone }}
                  >
                    <item.icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink-700">
                    {item.label}
                  </span>
                  <span
                    className="shrink-0 text-[17px] font-extrabold tnum"
                    style={{ color: item.tone }}
                  >
                    {item.count}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-ink-400 rtl:rotate-180" />
                </button>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {emp && (
          <ChartCard title={t('ov.headcountTrend')} subtitle={t('ov.headcountTrend.sub')}>
            <StackedBarList
              legend={[
                { label: t('ov.newHires'), value: 0, color: '#10B981' },
                { label: t('emp.inactive'), value: 0, color: '#F43F5E' },
              ]}
              items={yearSeries}
            />
          </ChartCard>
        )}

        {rec && (
          <ChartCard title={t('chart.status')} subtitle={t('chart.status.sub')}>
            <Donut
              centerValue={formatNumber(rec.total)}
              centerLabel={t('unit.role')}
              data={rec.byStatus.map((s) => ({
                label: t(`kpi.${s.key}` as 'kpi.active'),
                value: s.value,
                color: STATUS[s.key].color,
              }))}
            />
          </ChartCard>
        )}

        {emp && (
          <ChartCard title={t('emp.byDept')} subtitle={t('ov.headcount.hint')}>
            <BarList
              items={emp.byDepartment.slice(0, 10).map((d) => ({
                name: d.name, value: d.active, color: d.color,
              }))}
            />
          </ChartCard>
        )}

        {job && (
          <ChartCard title={t('job.byDept')} subtitle={t('job.sub')}>
            <BarList
              items={job.byDepartment.slice(0, 10).map((d) => ({
                name: d.name, value: d.forecast, color: deptColor(d.name),
              }))}
            />
          </ChartCard>
        )}

        {rec?.flags.department && (
          <ChartCard
            title={t('chart.department')}
            subtitle={t('chart.department.sub')}
            className="lg:col-span-2"
          >
            <StackedBarList
              legend={[
                { label: t('kpi.active'), value: 0, color: STATUS.active.color },
                { label: t('kpi.hold'), value: 0, color: STATUS.hold.color },
                { label: t('kpi.done'), value: 0, color: STATUS.done.color },
              ]}
              items={rec.byDepartment.map((d) => ({
                name: d.name,
                total: d.total,
                segments: [
                  { label: 'active', value: d.active, color: STATUS.active.color },
                  { label: 'hold', value: d.hold, color: STATUS.hold.color },
                  { label: 'done', value: d.done, color: STATUS.done.color },
                ],
              }))}
            />
          </ChartCard>
        )}
      </div>
    </div>
  );
}
