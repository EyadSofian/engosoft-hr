import { GraduationCap, Plus, Sparkles } from 'lucide-react';
import type { Dataset, SheetRow } from '../types';
import { ChartCard } from '../components/ChartCard';
import { DataTable, type Column } from '../components/DataTable';
import { KpiCard } from '../components/KpiCard';
import { TextChip } from '../components/primitives';
import { LoadingView } from '../components/StateViews';
import { useData, useDomain } from '../data/DataProvider';
import { useI18n } from '../i18n/LangProvider';
import { countBy, keyOf, text, toSlices } from '../lib/rows';
import { formatNumber } from '../lib/format';
import { deptColor } from '../config/semantics';

/**
 * The training register. Its source workbook was a signed form rather than a
 * table, so the register starts empty and is fed from improvement plans — which
 * is exactly the "تقرير تدريب من تقييمات الأداء" flow.
 */
export function Training({ query }: { query: string }) {
  const { t } = useI18n();
  const training = useDomain('training');
  const plans = useDomain('plans');

  if (training.loading && !training.dataset) return <LoadingView text={t('state.loading')} />;

  const rows = training.dataset?.rows ?? [];
  const byStatus = training.dataset
    ? toSlices(countBy(rows, (r) => text(training.dataset!, r, 'planStatus')))
    : [];

  return (
    <div className="space-y-5 pb-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          hero
          icon={<GraduationCap size={20} />}
          label={t('train.title')}
          hint={t('train.sub')}
          value={formatNumber(rows.length)}
        />
        <KpiCard
          icon={<Sparkles size={20} />}
          label={t('train.candidates')}
          hint={t('train.candidates.sub')}
          value={formatNumber(plans.dataset?.rows.length ?? 0)}
          tone="#F59E0B"
          delay={60}
        />
        {byStatus.slice(0, 2).map((s, i) => (
          <KpiCard
            key={s.label}
            icon={<GraduationCap size={20} />}
            label={s.label}
            value={formatNumber(s.value)}
            tone={deptColor(s.label)}
            delay={120 + i * 60}
          />
        ))}
      </div>

      {!rows.length ? (
        <div className="card p-6 text-center sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-muted
                           text-ink-400">
            <GraduationCap size={26} />
          </span>
          <h2 className="mt-4 text-[16px] font-bold text-ink-900">{t('train.empty')}</h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
            {t('train.emptyBody')}
          </p>
        </div>
      ) : (
        <TrainingTable ds={training.dataset!} query={query} />
      )}

      {plans.dataset && plans.dataset.rows.length > 0 && (
        <TrainingCandidates ds={plans.dataset} trainingDs={training.dataset} />
      )}
    </div>
  );
}

/**
 * Every open improvement plan is a training need waiting to be booked. One click
 * appends it to the Training tab.
 */
function TrainingCandidates({
  ds,
  trainingDs,
}: {
  ds: Dataset;
  trainingDs: Dataset | null;
}) {
  const { t } = useI18n();
  const { writable, append } = useData();

  // A plan already turned into a booking should not be offered twice.
  const booked = new Set(
    (trainingDs?.rows ?? []).map((r) => (r.cells['Employee Name']?.text ?? '').trim()),
  );

  const book = (r: SheetRow) => {
    void append('training', {
      'Employee Name': text(ds, r, 'aprName'),
      'Emp ID': text(ds, r, 'aprEmpId'),
      'Training Program': text(ds, r, 'planAction'),
      'Start Date': text(ds, r, 'planStart'),
      'End Date': text(ds, r, 'planEnd'),
      Trigger: `${ds.spec.tab} · ${keyOf(ds, r)}`,
      Status: 'Planned',
      'Approved By': text(ds, r, 'planOwner'),
      Notes: text(ds, r, 'planGaps'),
    }, text(ds, r, 'aprName'));
  };

  return (
    <ChartCard
      title={t('train.candidates')}
      subtitle={t('train.candidates.sub')}
      icon={<Sparkles size={17} />}
    >
      <ul className="space-y-2.5">
        {ds.rows.map((r) => {
          const name = text(ds, r, 'aprName');
          const already = booked.has(name);
          return (
            <li
              key={keyOf(ds, r)}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-100 p-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink-900">{name}</span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500">
                  {text(ds, r, 'planAction')}
                </span>
              </span>
              <TextChip color={deptColor(text(ds, r, 'planStatus'))}>
                {text(ds, r, 'planStatus')}
              </TextChip>
              {writable && !already && (
                <button
                  type="button"
                  onClick={() => book(r)}
                  className="focus-ring inline-flex min-h-[38px] items-center gap-1.5 rounded-lg
                             border border-brand-200 bg-brand-50 px-3 text-[12.5px] font-semibold
                             text-brand-700 transition hover:bg-brand-100"
                >
                  <Plus size={14} />
                  {t('train.addFromPlan')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

function TrainingTable({ ds, query }: { ds: Dataset; query: string }) {
  const { t } = useI18n();

  const col = (key: string, label: string, extra: Partial<Column<SheetRow>> = {}) => ({
    key,
    label,
    value: (r: SheetRow) => (r.cells[key]?.text ?? '').trim(),
    ...extra,
  });

  const columns: Column<SheetRow>[] = [
    col('Employee Name', t('nav.employees'), { primary: true }),
    col('Training Program', t('nav.training')),
    col('Department', t('filter.department'), {
      render: (r: SheetRow) => {
        const d = (r.cells.Department?.text ?? '').trim();
        return d ? <TextChip color={deptColor(d)}>{d}</TextChip> : '—';
      },
    }),
    col('Start Date', t('sal.period'), { numeric: true }),
    col('Status', t('filter.status')),
    col('Cost', t('sal.totalCost'), { numeric: true, align: 'end', desktopOnly: true }),
    col('Provider', t('set.source'), { desktopOnly: true }),
  ];

  const rows = query.trim()
    ? ds.rows.filter((r) =>
        columns.some((c) =>
          String(c.value(r) ?? '').toLowerCase().includes(query.toLowerCase())))
    : ds.rows;

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getKey={(r) => keyOf(ds, r)}
      title={t('train.title')}
    />
  );
}
