import { useEffect, useState } from 'react';
import { ExternalLink, Globe, Loader2, Lock, Menu, RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n/LangProvider';
import { SHEET_URL } from '../config/domains';
import { useData } from '../data/DataProvider';
import { useSalaryGate } from '../auth/SalaryGate';
import { Mark } from './Logo';

function useRelativeTime(ts: number | null): string {
  const { t } = useI18n();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!ts) return;
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, [ts]);

  if (!ts) return '';
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 20) return t('time.now');
  if (secs < 60) return t('time.secAgo', { n: secs });
  const mins = Math.round(secs / 60);
  if (mins < 60) return t('time.minAgo', { n: mins });
  return t('time.hourAgo', { n: Math.round(mins / 60) });
}

export function Header({
  pageTitle,
  subtitle,
  lastSync,
  refreshing,
  onOpenNav,
}: {
  pageTitle: string;
  subtitle?: string;
  lastSync: number | null;
  refreshing: boolean;
  onOpenNav: () => void;
}) {
  const { t, lang, toggle } = useI18n();
  const { refresh, writable } = useData();
  const { unlocked, lock } = useSalaryGate();
  const synced = useRelativeTime(lastSync);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-surface-card/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1480px] items-center gap-2 px-3 py-2.5 sm:gap-3 lg:px-7 lg:py-3">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label={t('header.menu')}
          className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200
                     text-ink-700 hover:bg-surface-muted lg:hidden"
        >
          <Menu size={19} />
        </button>

        <span className="lg:hidden">
          <Mark size={30} />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold text-ink-900 sm:text-[17px]">{pageTitle}</h1>
          <p className="hidden truncate text-[12px] text-ink-400 sm:block">
            {subtitle || t('ov.sub')}
          </p>
        </div>

        {/* Live badge — desktop only; the phone gets the refresh button alone */}
        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold
                      md:inline-flex ${
                        refreshing
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
        >
          {refreshing ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-ring" />
          )}
          {refreshing ? t('header.syncing') : t('header.live')}
          {!refreshing && synced && <span className="text-emerald-600/70 tnum">· {synced}</span>}
        </span>

        {!writable && (
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold
                           text-ink-500 lg:inline-flex">
            {t('header.readonly')}
          </span>
        )}

        {unlocked && (
          <button
            type="button"
            onClick={lock}
            title={t('sal.lock')}
            className="focus-ring hidden h-10 w-10 place-items-center rounded-xl border border-emerald-200
                       bg-emerald-50 text-emerald-600 hover:bg-emerald-100 sm:grid"
          >
            <Lock size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => refresh()}
          aria-label={t('header.refresh')}
          className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200
                     text-ink-700 hover:bg-surface-muted"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={t('header.language')}
          className="focus-ring flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200
                     px-2.5 text-[12.5px] font-bold text-ink-700 hover:bg-surface-muted"
        >
          <Globe size={15} />
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>

        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('header.openSheet')}
          className="focus-ring hidden h-10 w-10 place-items-center rounded-xl border border-slate-200
                     text-ink-700 hover:bg-surface-muted lg:grid"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </header>
  );
}
