import { useMemo, useState } from 'react';
import {
  Briefcase, CalendarClock, CheckCircle2, LayoutGrid, PauseCircle, Table2,
  TrendingUp, UserCheck, Users,
} from 'lucide-react';
import type { Dataset, SheetRow } from '../types';
import { DomainView } from '../components/DomainView';
import { ChartCard } from '../components/ChartCard';
import { KpiCard } from '../components/KpiCard';
import { DataTable, type Column, type Facet } from '../components/DataTable';
import { Kanban, type KanbanCard } from '../components/Kanban';
import { Badge, Dot, TextChip, withAlpha } from '../components/primitives';
import { BarList, Donut, Funnel, StackedBarList } from '../components/charts';
import { useData } from '../data/DataProvider';
import { useI18n } from '../i18n/LangProvider';
import { date, keyOf, num, text } from '../lib/rows';
import { recruitmentAnalytics } from '../lib/analytics';
import { formatDate, formatMoney, formatNumber, formatPercent } from '../lib/format';
import {
  LOCATION, PRIORITY, STATUS, VACANCY,
  deptColor, locationKey, priorityKey, stageState, statusKey,
  STAGE_COLORS,
} from '../config/semantics';

// The board's columns are the three statuses HR actually works in.
const BOARD = [
  { key: 'active', label: STATUS.active, color: STATUS.active.color },
  { key: 'hold', label: STATUS.hold, color: STATUS.hold.color },
  { key: 'done', label: STATUS.done, color: STATUS.done.color },
];

/** The literal value written back to the sheet for each board column. */
const SHEET_STATUS: Record<string, string> = { active: 'Active', hold: 'Hold', done: 'Done' };

export function Recruitment({ query }: { query: string }) {
  return (
    <DomainView domain="recruitment">
      {(ds) => <RecruitmentBody ds={ds} query={query} />}
    </DomainView>
  );
}

function RecruitmentBody({ ds, query }: { ds: Dataset; query: string }) {
  const { t, lang } = useI18n();
  const { edit, writable } = useData();
  const [mode, setMode] = useState<'table' | 'board'>('board');

  const a = useMemo(() => recruitmentAnalytics(ds), [ds]);

  const move = (rid: string, column: string) => {
    const patch: Record<string, string> = { Status: SHEET_STATUS[column] };
    // Closing a role without a hire date leaves the report unable to measure
    // time-to-hire, so stamp today unless one is already set.
    if (column === 'done') {
      const row = ds.rows.find((r) => keyOf(ds, r) === rid);
      if (row && !date(ds, row, 'hireDate')) {
        patch['Actual Hiring Date'] = new Date().toISOString().slice(0, 10);
      }
    }
    void edit('recruitment', rid, patch);
  };

  const cards: KanbanCard[] = ds.rows.map((r) => ({
    id: keyOf(ds, r),
    column: (() => {
      const k = statusKey(text(ds, r, 'status'));
      return k === 'other' ? 'active' : k;
    })(),
    render: <CardBody ds={ds} row={r} />,
  }));

  return (
    <div className="space-y-5 pb-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          hero
          icon={<Briefcase size={20} />}
          label={t('kpi.total')}
          hint={t('kpi.total.hint')}
          value={formatNumber(a.total)}
        />
        <KpiCard
          icon={<Users size={20} />}
          label={t('kpi.needed')}
          hint={t('kpi.needed.hint')}
          value={formatNumber(a.needed)}
          tone="#0F72D8"
          delay={60}
        />
        <KpiCard
          icon={<UserCheck size={20} />}
          label={t('kpi.accepted')}
          hint={t('kpi.accepted.hint')}
          value={formatNumber(a.accepted)}
          tone="#10B981"
          delay={120}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label={t('kpi.fillRate')}
          hint={t('kpi.fillRate.hint')}
          value={a.fillRate === null ? '—' : formatPercent(a.fillRate)}
          tone="#2AA7F0"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          icon={<LayoutGrid size={18} />}
          label={t('kpi.active')}
          value={formatNumber(a.active)}
          tone={STATUS.active.color}
        />
        <KpiCard
          icon={<PauseCircle size={18} />}
          label={t('kpi.hold')}
          value={formatNumber(a.hold)}
          tone={STATUS.hold.color}
        />
        <KpiCard
          icon={<CalendarClock size={18} />}
          label={t('kpi.overdue')}
          hint={t('kpi.overdue.hint')}
          value={formatNumber(a.overdue)}
          tone={STATUS.done.color === '#10B981' && a.overdue > 0 ? '#F43F5E' : '#8496AC'}
        />
      </div>

      {/* View switch */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-slate-200 bg-surface-card p-1">
          {(['board', 'table'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`focus-ring flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 text-[13px]
                          font-bold transition ${
                            mode === m ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-900'
                          }`}
            >
              {m === 'board' ? <LayoutGrid size={15} /> : <Table2 size={15} />}
              {t(m === 'board' ? 'board.board' : 'board.table')}
            </button>
          ))}
        </div>

        {mode === 'board' && (
          <p className="text-[12px] text-ink-400">
            {writable ? t('board.dragHint') : t('edit.readonlyBody')}
          </p>
        )}
      </div>

      {mode === 'board' ? (
        <Kanban
          columns={BOARD.map((c) => ({
            key: c.key,
            label: lang === 'ar' ? c.label.ar : c.label.en,
            color: c.color,
          }))}
          cards={cards}
          onMove={move}
          disabled={!writable}
          emptyLabel={t('board.empty')}
          moveLabel={t('board.moveTo')}
        />
      ) : (
        <RecruitmentTable ds={ds} query={query} onMove={move} writable={writable} />
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('chart.status')} subtitle={t('chart.status.sub')}>
          <Donut
            centerValue={formatNumber(a.total)}
            centerLabel={t('unit.role')}
            data={a.byStatus.map((s) => ({
              label: lang === 'ar' ? STATUS[s.key].ar : STATUS[s.key].en,
              value: s.value,
              color: STATUS[s.key].color,
            }))}
          />
        </ChartCard>

        {a.flags.pipeline && (
          <ChartCard title={t('chart.pipeline')} subtitle={t('chart.pipeline.sub')}>
            <Funnel
              stages={a.pipeline.map((p, i) => ({
                label: t(`pipe.${p.key}` as 'pipe.reqReceived'),
                value: p.value,
                color: [STAGE_COLORS.done, '#0F72D8', '#2AA7F0', '#10B981'][i],
              }))}
            />
          </ChartCard>
        )}

        {a.flags.department && (
          <ChartCard title={t('chart.department')} subtitle={t('chart.department.sub')}>
            <StackedBarList
              legend={[
                { label: lang === 'ar' ? STATUS.active.ar : STATUS.active.en, value: 0, color: STATUS.active.color },
                { label: lang === 'ar' ? STATUS.hold.ar : STATUS.hold.en, value: 0, color: STATUS.hold.color },
                { label: lang === 'ar' ? STATUS.done.ar : STATUS.done.en, value: 0, color: STATUS.done.color },
              ]}
              items={a.byDepartment.map((d) => ({
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

        {a.flags.recruiter && (
          <ChartCard title={t('chart.recruiter')} subtitle={t('chart.recruiter.sub')}>
            <ul className="space-y-3.5">
              {a.byRecruiter.map((r) => (
                <li key={r.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                    <span className="flex items-center gap-2 font-semibold text-ink-900">
                      <Dot color={deptColor(r.name)} />
                      {r.name}
                    </span>
                    <span className="text-ink-500 tnum">
                      {r.done}/{r.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ChartCard>
        )}

        {a.flags.priority && (
          <ChartCard title={t('chart.priority')} subtitle={t('chart.priority.sub')}>
            <BarList
              items={a.byPriority.map((s) => ({
                name: lang === 'ar' ? PRIORITY[s.key].ar : PRIORITY[s.key].en,
                value: s.value,
                color: PRIORITY[s.key].color,
              }))}
            />
          </ChartCard>
        )}

        {a.flags.location && (
          <ChartCard title={t('chart.location')} subtitle={t('chart.location.sub')}>
            <Donut
              size={148}
              centerValue={formatNumber(a.total)}
              data={a.byLocation.map((s) => ({
                label: lang === 'ar' ? LOCATION[s.key].ar : LOCATION[s.key].en,
                value: s.value,
                color: LOCATION[s.key].color,
              }))}
            />
          </ChartCard>
        )}

        {a.flags.vacancy && (
          <ChartCard title={t('chart.vacancy')} subtitle={t('chart.vacancy.sub')}>
            <BarList
              items={a.byVacancy.map((s) => ({
                name: lang === 'ar' ? VACANCY[s.key].ar : VACANCY[s.key].en,
                value: s.value,
                color: VACANCY[s.key].color,
              }))}
            />
          </ChartCard>
        )}

        {a.flags.salary && (
          <ChartCard title={t('chart.comp')} subtitle={t('chart.comp.sub')}>
            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: t('stat.median'), value: a.comp.median },
                { label: t('stat.avg'), value: a.comp.mean },
                { label: t('stat.range'), value: null },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-surface-muted p-2.5">
                  <div className="text-[15px] font-extrabold text-ink-900 tnum">
                    {s.value !== null
                      ? formatMoney(s.value)
                      : `${formatMoney(a.comp.min)}–${formatMoney(a.comp.max)}`}
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-ink-400">{s.label}</div>
                </div>
              ))}
            </div>
            <BarList
              items={a.comp.byDept.map((d) => ({ name: d.name, value: d.median, color: d.color }))}
              format={formatMoney}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
              {t('comp.caveat')} · {t('comp.based', { n: a.comp.count })}
            </p>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

// ── Board card ────────────────────────────────────────────────

function CardBody({ ds, row }: { ds: Dataset; row: SheetRow }) {
  const { lang } = useI18n();
  const dept = text(ds, row, 'department');
  const needed = num(ds, row, 'needed');
  const accepted = num(ds, row, 'accepted');
  const due = date(ds, row, 'dueDate');
  const overdue = due && due < new Date() && statusKey(text(ds, row, 'status')) !== 'done';
  const priority = priorityKey(text(ds, row, 'priority'));

  return (
    <div className="pe-14">
      <h4 className="text-[13.5px] font-bold leading-snug text-ink-900">
        {text(ds, row, 'position') || '—'}
      </h4>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {dept && <TextChip color={deptColor(dept)}>{dept}</TextChip>}
        {priority !== 'other' && (
          <Badge meta={PRIORITY[priority]} lang={lang} />
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
        {needed !== null && needed > 0 && (
          <span className="tnum">
            {accepted ?? 0}/{needed}
          </span>
        )}
        {text(ds, row, 'recruiter1') && (
          <span className="truncate">{text(ds, row, 'recruiter1')}</span>
        )}
        {due && (
          <span className={`tnum ${overdue ? 'font-bold text-rose-600' : ''}`}>
            {formatDate(due, lang)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Table view ────────────────────────────────────────────────

function RecruitmentTable({
  ds, query, onMove, writable,
}: {
  ds: Dataset;
  query: string;
  onMove: (rid: string, column: string) => void;
  writable: boolean;
}) {
  const { t, lang } = useI18n();

  const columns: Column<SheetRow>[] = [
    {
      key: 'position',
      label: t('nav.jobs'),
      primary: true,
      value: (r) => text(ds, r, 'position'),
      render: (r) => (
        <span className="font-semibold text-ink-900">{text(ds, r, 'position') || '—'}</span>
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
      value: (r) => text(ds, r, 'status'),
      render: (r) => {
        const k = statusKey(text(ds, r, 'status'));
        return <Badge meta={STATUS[k]} lang={lang} />;
      },
    },
    {
      key: 'needed',
      label: t('kpi.needed'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'needed'),
    },
    {
      key: 'accepted',
      label: t('kpi.accepted'),
      numeric: true,
      align: 'end',
      value: (r) => num(ds, r, 'accepted'),
    },
    {
      key: 'priority',
      label: t('filter.priority'),
      desktopOnly: true,
      value: (r) => text(ds, r, 'priority'),
      render: (r) => <Badge meta={PRIORITY[priorityKey(text(ds, r, 'priority'))]} lang={lang} />,
    },
    {
      key: 'recruiter',
      label: t('filter.recruiter'),
      value: (r) => text(ds, r, 'recruiter1'),
    },
    {
      key: 'due',
      label: t('stat.planWindow'),
      desktopOnly: true,
      numeric: true,
      value: (r) => date(ds, r, 'dueDate')?.getTime() ?? null,
      render: (r) => {
        const d = date(ds, r, 'dueDate');
        const overdue = d && d < new Date() && statusKey(text(ds, r, 'status')) !== 'done';
        return (
          <span className={overdue ? 'font-bold text-rose-600' : ''}>{formatDate(d, lang)}</span>
        );
      },
    },
    {
      key: 'salary',
      label: t('chart.comp'),
      desktopOnly: true,
      align: 'end',
      value: (r) => text(ds, r, 'actualSalary'),
    },
  ];

  const facets: Facet<SheetRow>[] = [
    {
      key: 'status',
      label: t('filter.status'),
      options: Object.values(STATUS).map((m) => ({
        key: m.key,
        label: lang === 'ar' ? m.ar : m.en,
      })),
      match: (r, k) => statusKey(text(ds, r, 'status')) === k,
    },
    {
      key: 'department',
      label: t('filter.department'),
      options: [...new Set(ds.rows.map((r) => text(ds, r, 'department')).filter(Boolean))]
        .sort()
        .map((d) => ({ key: d, label: d })),
      match: (r, k) => text(ds, r, 'department') === k,
    },
    {
      key: 'location',
      label: t('filter.location'),
      options: Object.values(LOCATION).map((m) => ({
        key: m.key,
        label: lang === 'ar' ? m.ar : m.en,
      })),
      match: (r, k) => locationKey(text(ds, r, 'location')) === k,
    },
  ];

  // The header search box scopes the table too.
  const rows = query.trim()
    ? ds.rows.filter((r) => {
        const q = query.toLowerCase();
        return [
          text(ds, r, 'position'), text(ds, r, 'department'),
          text(ds, r, 'recruiter1'), text(ds, r, 'interviewer'),
        ].some((v) => v.toLowerCase().includes(q));
      })
    : ds.rows;

  return (
    <DataTable
      rows={rows}
      columns={columns}
      facets={facets}
      getKey={(r) => keyOf(ds, r)}
      title={t('nav.recruitment')}
      expand={(r) => <RowDetail ds={ds} row={r} onMove={onMove} writable={writable} />}
    />
  );
}

function RowDetail({
  ds, row, onMove, writable,
}: {
  ds: Dataset;
  row: SheetRow;
  onMove: (rid: string, column: string) => void;
  writable: boolean;
}) {
  const { t } = useI18n();
  const rid = keyOf(ds, row);
  const isDone = statusKey(text(ds, row, 'status')) === 'done';

  const stages = [
    { key: 'reqReceived' as const, label: t('pipe.reqReceived') },
    { key: 'published' as const, label: t('pipe.published') },
    { key: 'candidateReceived' as const, label: t('pipe.candidateReceived') },
  ];

  const facts: { label: string; value: string }[] = [
    { label: t('chart.seniority'), value: text(ds, row, 'seniority') },
    { label: t('chart.location'), value: text(ds, row, 'location') },
    { label: t('chart.vacancy'), value: text(ds, row, 'vacancyReason') },
    { label: t('chart.interviewer'), value: text(ds, row, 'interviewer') },
    { label: t('stat.range'), value: text(ds, row, 'salaryRange') },
    { label: t('chart.comp'), value: text(ds, row, 'actualSalary') },
  ].filter((f) => f.value);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {stages.map((s) => {
          const st = stageState(text(ds, row, s.key));
          const color = STAGE_COLORS[st];
          return (
            <span
              key={s.key}
              className="chip"
              style={{ backgroundColor: withAlpha(color, 0.12), color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {s.label}
            </span>
          );
        })}
      </div>

      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                {f.label}
              </dt>
              <dd className="text-[13px] text-ink-700">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {text(ds, row, 'feedback') && (
        <p className="rounded-xl bg-white p-3 text-[12.5px] leading-relaxed text-ink-700">
          {text(ds, row, 'feedback')}
        </p>
      )}

      {writable && (
        <button
          type="button"
          onClick={() => onMove(rid, isDone ? 'active' : 'done')}
          className={`focus-ring inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-[13px]
                      font-bold text-white transition ${
                        isDone ? 'bg-ink-500 hover:bg-ink-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
        >
          <CheckCircle2 size={16} />
          {t(isDone ? 'board.reopen' : 'board.close')}
        </button>
      )}

      <p className="text-[11px] text-ink-400">
        {ds.spec.keyColumn}: <span className="tnum">{rid}</span>
      </p>
    </div>
  );
}
