import { AlertTriangle, GitBranch } from 'lucide-react';
import type { CanonicalKey } from '../types';
import type { Analytics } from '../lib/analytics';
import { dateOf, has, textOf, type Dataset } from '../lib/sheets';
import { STAGE_COLORS, stageState, statusKey, STATUS } from '../config/semantics';
import { daysBetween, formatDate, startOfToday } from '../lib/format';
import { useI18n } from '../i18n/LangProvider';
import { ChartCard } from '../components/ChartCard';
import { Donut, Funnel, type Segment } from '../components/charts';
import { Badge, SectionTitle } from '../components/primitives';
import { EmptyView } from '../components/StateViews';

const STAGES: { key: CanonicalKey; labelKey: 'pipe.reqReceived' | 'pipe.published' | 'pipe.candidateReceived' }[] = [
  { key: 'reqReceived', labelKey: 'pipe.reqReceived' },
  { key: 'published', labelKey: 'pipe.published' },
  { key: 'candidateReceived', labelKey: 'pipe.candidateReceived' },
];

const STATE_LABEL: Record<string, { ar: string; en: string }> = {
  done: { ar: 'تم', en: 'Done' },
  wait: { ar: 'في الانتظار', en: 'Waiting' },
  hold: { ar: 'معلّق', en: 'On hold' },
  none: { ar: 'لم يبدأ', en: 'Not started' },
};

export function Pipeline({ ds, a }: { ds: Dataset; a: Analytics }) {
  const { t, lang } = useI18n();
  const today = startOfToday();

  if (!a.flags.pipeline && !a.flags.dates) return <EmptyView text={t('state.empty')} />;

  const pipelineColors: Record<string, string> = {
    reqReceived: '#4f93f7', published: '#2a7df0', candidateReceived: '#1366e6', accepted: '#10b981',
  };
  const funnel: Segment[] = a.pipeline.map((p) => ({
    label: t(`pipe.${p.key}` as 'pipe.accepted'), value: p.value, color: pipelineColors[p.key] || '#2a7df0',
  }));

  const stageBreakdown = STAGES.filter((s) => has(ds, s.key)).map((s) => {
    const counts = { done: 0, wait: 0, hold: 0, none: 0 };
    ds.records.forEach((r) => { counts[stageState(textOf(ds, r, s.key))] += 1; });
    const segs: Segment[] = (['done', 'wait', 'hold', 'none'] as const)
      .map((k) => ({ label: STATE_LABEL[k][lang], value: counts[k], color: STAGE_COLORS[k] }))
      .filter((x) => x.value > 0);
    return { label: t(s.labelKey), done: counts.done, segs };
  });

  const overdue = a.overdueRows
    .map((r) => {
      const due = dateOf(ds, r, 'dueDate');
      return {
        r,
        pos: textOf(ds, r, 'position'),
        due,
        days: due ? daysBetween(due, today) : 0,
        recruiter: textOf(ds, r, 'recruiter1'),
        status: statusKey(textOf(ds, r, 'status')),
      };
    })
    .sort((x, y) => y.days - x.days);

  return (
    <div className="space-y-4 animate-fade-up">
      <SectionTitle title={t('chart.pipeline')} subtitle={t('chart.pipeline.sub')} icon={<GitBranch size={18} />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ChartCard className="lg:col-span-5" title={t('chart.pipeline')} subtitle={t('chart.pipeline.sub')} icon={<GitBranch size={17} />}>
          <Funnel stages={funnel} />
        </ChartCard>

        {stageBreakdown.map((s, i) => (
          <ChartCard key={i} className="lg:col-span-4" title={s.label}>
            <Donut data={s.segs} size={140} thickness={20} centerValue={String(s.done)} centerLabel={STATE_LABEL.done[lang]} />
          </ChartCard>
        ))}
      </div>

      {overdue.length > 0 && (
        <section className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 p-4 text-[14px] font-bold text-ink-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-500"><AlertTriangle size={16} /></span>
            {t('kpi.overdue')}
            <span className="ms-auto rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 tnum">{overdue.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-start text-[13px]">
              <tbody>
                {overdue.map((o, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-rose-50/30">
                    <td className="px-4 py-3 font-semibold text-ink-900">{o.pos}</td>
                    <td className="px-4 py-3"><Badge meta={STATUS[o.status]} lang={lang} /></td>
                    <td className="px-4 py-3 text-ink-500">{o.recruiter || '—'}</td>
                    <td className="px-4 py-3 tnum text-ink-600">{formatDate(o.due, lang)}</td>
                    <td className="px-4 py-3 text-end">
                      <span className="rounded-lg bg-rose-50 px-2 py-1 text-[11.5px] font-bold text-rose-600 tnum">
                        +{o.days} {t('unit.days')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
