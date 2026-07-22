import { useEffect, useState } from 'react';
import {
  CheckCircle2, Database, ExternalLink, Lock, PenLine, RefreshCw, Unlock, UserCircle2, XCircle,
} from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { useData } from '../data/DataProvider';
import { useI18n } from '../i18n/LangProvider';
import { useSalaryGate } from '../auth/SalaryGate';
import {
  DOMAIN_LIST, REFRESH_SECONDS, SHEET_ID, SHEET_URL, WRITE_API_URL,
} from '../config/domains';
import { ping } from '../lib/writeApi';

export function Settings() {
  const { t, lang } = useI18n();
  const { get, request, refresh, writable, actor, setActor } = useData();
  const { unlocked, lock, configured } = useSalaryGate();
  const [name, setName] = useState(actor);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!WRITE_API_URL) return;
    let alive = true;
    void ping().then((ok) => alive && setApiOk(ok));
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-5 pb-4">
      <ChartCard title={t('set.source')} subtitle={t('set.sub')} icon={<Database size={17} />}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-muted/60 p-3">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
              Sheet ID
            </dt>
            <dd className="mt-1 break-all font-mono text-[12px] text-ink-700">{SHEET_ID}</dd>
          </div>
          <div className="rounded-xl bg-surface-muted/60 p-3">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
              {t('header.refresh')}
            </dt>
            <dd className="mt-1 text-[13px] text-ink-700">
              {t('set.refreshEvery', { n: REFRESH_SECONDS })}
            </dd>
          </div>
        </dl>

        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-xl border
                     border-slate-200 px-4 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted"
        >
          <ExternalLink size={15} />
          {t('header.openSheet')}
        </a>
      </ChartCard>

      <ChartCard title={t('set.tabs')} subtitle={t('set.sub')} icon={<Database size={17} />}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-start">
                {[t('set.tab'), t('set.rows'), t('set.columns'), t('set.state')].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2 font-bold text-ink-500 ${i === 0 ? 'text-start' : 'text-end'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOMAIN_LIST.map((spec) => {
                const state = get(spec.id);
                const loaded = Boolean(state.dataset);
                return (
                  <tr key={spec.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5">
                      <span className="font-semibold text-ink-900">
                        {lang === 'ar' ? spec.ar : spec.en}
                      </span>
                      <span className="ms-2 font-mono text-[11.5px] text-ink-400">{spec.tab}</span>
                      {spec.restricted && (
                        <Lock size={11} className="ms-1.5 inline text-amber-500" />
                      )}
                    </td>
                    <td className="py-2.5 text-end tnum">
                      {loaded ? state.dataset!.rows.length : '—'}
                    </td>
                    <td className="py-2.5 text-end tnum">
                      {loaded ? state.dataset!.headers.length : '—'}
                    </td>
                    <td className="py-2.5 text-end">
                      {state.error ? (
                        <span className="chip bg-rose-50 text-rose-700">
                          <XCircle size={12} />
                          {t('state.error')}
                        </span>
                      ) : loaded ? (
                        <span className="chip bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} />
                          {t('set.ok')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => request(spec.id)}
                          className="focus-ring chip bg-slate-100 text-ink-500 hover:bg-slate-200"
                        >
                          <RefreshCw size={12} />
                          {t('set.notLoaded')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {DOMAIN_LIST.some((s) => get(s.id).error) && (
          <ul className="mt-3 space-y-1.5">
            {DOMAIN_LIST.filter((s) => get(s.id).error).map((s) => (
              <li key={s.id} className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
                <span className="font-bold">{s.tab}</span> — {get(s.id).error}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => refresh()}
          className="focus-ring mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-brand-600
                     px-4 text-[13px] font-semibold text-white transition hover:bg-brand-700"
        >
          <RefreshCw size={15} />
          {t('header.refresh')}
        </button>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('set.writeApi')} subtitle={t('board.dragHint')} icon={<PenLine size={17} />}>
          <div
            className={`flex items-start gap-3 rounded-xl p-3.5 ${
              writable ? 'bg-emerald-50' : 'bg-slate-100'
            }`}
          >
            {writable ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle size={19} className="mt-0.5 shrink-0 text-ink-400" />
            )}
            <div className="min-w-0">
              <p className={`text-[13px] font-bold ${writable ? 'text-emerald-900' : 'text-ink-700'}`}>
                {t(writable ? 'set.writeOn' : 'set.writeOff')}
              </p>
              {!writable && (
                <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                  {t('edit.readonlyBody')}
                </p>
              )}
              {writable && apiOk === false && (
                <p className="mt-1 text-[12px] text-rose-700">
                  {t('state.error')} — /exec
                </p>
              )}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-700">
              <UserCircle2 size={15} />
              {t('edit.whoAreYou')}
            </span>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Yasmin"
                className="focus-ring min-h-[42px] flex-1 rounded-xl border border-slate-200
                           bg-surface-muted px-3.5 text-[13.5px]"
              />
              <button
                type="button"
                onClick={() => setActor(name.trim())}
                disabled={name.trim() === actor}
                className="focus-ring min-h-[42px] rounded-xl bg-brand-600 px-4 text-[13px] font-bold
                           text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                {t('edit.save')}
              </button>
            </div>
            <span className="mt-1.5 block text-[11.5px] text-ink-400">{t('edit.whoHint')}</span>
          </label>
        </ChartCard>

        <ChartCard title={t('nav.salaries')} subtitle={t('sal.lockedBody')} icon={<Lock size={17} />}>
          <div
            className={`flex items-start gap-3 rounded-xl p-3.5 ${
              unlocked ? 'bg-emerald-50' : 'bg-slate-100'
            }`}
          >
            {unlocked ? (
              <Unlock size={19} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <Lock size={19} className="mt-0.5 shrink-0 text-ink-400" />
            )}
            <p className={`text-[13px] font-bold ${unlocked ? 'text-emerald-900' : 'text-ink-700'}`}>
              {unlocked ? t('sal.unlock') : t('sal.locked')}
            </p>
          </div>

          {!configured && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-900">
              {t('sal.notConfigured')}
            </p>
          )}

          {unlocked && (
            <button
              type="button"
              onClick={lock}
              className="focus-ring mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-xl border
                         border-slate-200 px-4 text-[13px] font-semibold text-ink-700
                         hover:bg-surface-muted"
            >
              <Lock size={15} />
              {t('sal.lock')}
            </button>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
