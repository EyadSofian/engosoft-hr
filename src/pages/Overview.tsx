import {
  Activity, AlertTriangle, Briefcase, CheckCircle2, GitBranch, Layers, MapPin,
  PauseCircle, Repeat, Target, TrendingUp, UserCheck, Users, Wallet,
} from 'lucide-react';
import type { Analytics } from '../lib/analytics';
import { useI18n } from '../i18n/LangProvider';
import { LOCATION, PRIORITY, SENIORITY, STATUS, VACANCY } from '../config/semantics';
import { formatMoney, formatNumber, formatPercent } from '../lib/format';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { BarList, Donut, Funnel, StackedBarList, type Segment } from '../components/charts';
import { withAlpha } from '../components/primitives';

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: withAlpha(color, 0.12), color }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xl font-extrabold leading-none text-ink-900 tnum">{value}</div>
        <div className="mt-1 truncate text-[12px] font-medium text-ink-500">{label}</div>
      </div>
    </div>
  );
}

export function Overview({ a }: { a: Analytics }) {
  const { t, lang } = useI18n();

  const toSegs = (slices: { key: string; value: number }[], dict: Record<string, { ar: string; en: string; color: string }>): Segment[] =>
    slices.map((s) => ({ label: dict[s.key][lang], value: s.value, color: dict[s.key].color }));

  const statusSegs = toSegs(a.byStatus, STATUS);
  const prioritySegs = toSegs(a.byPriority, PRIORITY);
  const senioritySegs = toSegs(a.bySeniority, SENIORITY);
  const locationSegs = toSegs(a.byLocation, LOCATION);
  const vacancySegs = toSegs(a.byVacancy, VACANCY);

  const statusLegend: Segment[] = [
    { label: STATUS.active[lang], value: 0, color: STATUS.active.color },
    { label: STATUS.hold[lang], value: 0, color: STATUS.hold.color },
    { label: STATUS.done[lang], value: 0, color: STATUS.done.color },
  ];
  const stackFrom = (rows: { name: string; active: number; hold: number; done: number; total: number }[]) =>
    rows.map((d) => ({
      name: d.name,
      total: d.total,
      segments: [
        { label: STATUS.active[lang], value: d.active, color: STATUS.active.color },
        { label: STATUS.hold[lang], value: d.hold, color: STATUS.hold.color },
        { label: STATUS.done[lang], value: d.done, color: STATUS.done.color },
      ],
    }));

  const pipelineColors: Record<string, string> = {
    reqReceived: '#4f93f7', published: '#2a7df0', candidateReceived: '#1366e6', accepted: '#10b981',
  };
  const pipeline: Segment[] = a.pipeline.map((p) => ({
    label: t(`pipe.${p.key}` as 'pipe.accepted'), value: p.value, color: pipelineColors[p.key] || '#2a7df0',
  }));

  return (
    <div className="space-y-4">
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard hero icon={<Briefcase size={22} />} label={t('kpi.total')} hint={t('kpi.total.hint')} value={formatNumber(a.total)} delay={0} />
        <KpiCard icon={<Target size={22} />} tone="#1366e6" label={t('kpi.needed')} hint={t('kpi.needed.hint')} value={formatNumber(a.needed)} delay={40} />
        <KpiCard icon={<UserCheck size={22} />} tone="#10b981" label={t('kpi.accepted')} hint={t('kpi.accepted.hint')} value={formatNumber(a.accepted)} delay={80} />
        <KpiCard icon={<TrendingUp size={22} />} tone="#8b5cf6" label={t('kpi.fillRate')} hint={t('kpi.fillRate.hint')} value={a.fillRate == null ? '—' : formatPercent(a.fillRate)} delay={120} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatPill icon={<Activity size={20} />} color={STATUS.active.color} label={t('kpi.active')} value={formatNumber(a.active)} />
        <StatPill icon={<PauseCircle size={20} />} color={STATUS.hold.color} label={t('kpi.hold')} value={formatNumber(a.hold)} />
        <StatPill icon={<CheckCircle2 size={20} />} color={STATUS.done.color} label={t('kpi.done')} value={formatNumber(a.done)} />
        <StatPill icon={<AlertTriangle size={20} />} color="#f43f5e" label={t('kpi.overdue')} value={formatNumber(a.overdue)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ChartCard className="lg:col-span-4" title={t('chart.status')} subtitle={t('chart.status.sub')} icon={<Layers size={17} />}>
          <Donut data={statusSegs} centerValue={formatNumber(a.total)} centerLabel={t('unit.role')} />
        </ChartCard>

        {a.flags.priority && (
          <ChartCard className="lg:col-span-4" title={t('chart.priority')} subtitle={t('chart.priority.sub')} icon={<Target size={17} />}>
            <Donut data={prioritySegs} centerValue={formatNumber(a.total)} centerLabel={t('unit.role')} />
          </ChartCard>
        )}

        {a.flags.seniority && (
          <ChartCard className="lg:col-span-4" title={t('chart.seniority')} subtitle={t('chart.seniority.sub')} icon={<Users size={17} />}>
            <Donut data={senioritySegs} centerValue={formatNumber(a.total)} centerLabel={t('unit.role')} />
          </ChartCard>
        )}

        {a.flags.department && (
          <ChartCard className="lg:col-span-6" title={t('chart.department')} subtitle={t('chart.department.sub')} icon={<Layers size={17} />}>
            <StackedBarList items={stackFrom(a.byDepartment)} legend={statusLegend} />
          </ChartCard>
        )}

        {a.flags.recruiter && (
          <ChartCard className="lg:col-span-6" title={t('chart.recruiter')} subtitle={t('chart.recruiter.sub')} icon={<Users size={17} />}>
            <StackedBarList items={stackFrom(a.byRecruiter)} legend={statusLegend} />
          </ChartCard>
        )}

        {a.flags.pipeline && (
          <ChartCard className="lg:col-span-5" title={t('chart.pipeline')} subtitle={t('chart.pipeline.sub')} icon={<GitBranch size={17} />}>
            <Funnel stages={pipeline} />
          </ChartCard>
        )}

        {a.flags.location && (
          <ChartCard className="lg:col-span-3" title={t('chart.location')} subtitle={t('chart.location.sub')} icon={<MapPin size={17} />}>
            <Donut data={locationSegs} size={140} thickness={20} centerValue={formatNumber(a.total)} />
          </ChartCard>
        )}

        {a.flags.vacancy && (
          <ChartCard className="lg:col-span-4" title={t('chart.vacancy')} subtitle={t('chart.vacancy.sub')} icon={<Repeat size={17} />}>
            <Donut data={vacancySegs} size={140} thickness={20} centerValue={formatNumber(vacancySegs.reduce((s, x) => s + x.value, 0))} />
          </ChartCard>
        )}

        {a.flags.interviewer && (
          <ChartCard className="lg:col-span-6" title={t('chart.interviewer')} subtitle={t('chart.interviewer.sub')} icon={<Users size={17} />}>
            <BarList items={a.byInterviewer.slice(0, 8)} accent="#1366e6" />
          </ChartCard>
        )}

        {a.flags.salary && (
          <ChartCard className="lg:col-span-6" title={t('chart.comp')} subtitle={t('chart.comp.sub')} icon={<Wallet size={17} />}>
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="rounded-xl bg-brand-50 px-4 py-2.5">
                <div className="text-[11px] font-semibold text-brand-700">{t('stat.median')}</div>
                <div className="text-lg font-extrabold text-ink-900 tnum">
                  {formatMoney(a.comp.median)} <span className="text-[11px] font-medium text-ink-400">{t('unit.egpMo')}</span>
                </div>
              </div>
              <div className="rounded-xl bg-surface-muted px-4 py-2.5">
                <div className="text-[11px] font-semibold text-ink-500">{t('stat.avg')}</div>
                <div className="text-lg font-extrabold text-ink-900 tnum">{formatMoney(a.comp.mean)}</div>
              </div>
              {a.planWindowAvg != null && (
                <div className="rounded-xl bg-surface-muted px-4 py-2.5">
                  <div className="text-[11px] font-semibold text-ink-500">{t('stat.planWindow')}</div>
                  <div className="text-lg font-extrabold text-ink-900 tnum">
                    {Math.round(a.planWindowAvg)} <span className="text-[11px] font-medium text-ink-400">{t('unit.days')}</span>
                  </div>
                </div>
              )}
            </div>
            <BarList items={a.comp.byDept.map((d) => ({ name: d.name, value: d.median, color: d.color }))} format={(v) => formatMoney(v)} />
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">{t('comp.caveat')} · {t('comp.based', { n: a.comp.count })}</p>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
