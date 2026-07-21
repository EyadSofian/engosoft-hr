import { useEffect, useState } from 'react';
import { ChevronDown, ExternalLink, Globe, Loader2, Menu, RefreshCw, Search } from 'lucide-react';
import type { TabInfo } from '../types';
import { useI18n } from '../i18n/LangProvider';
import { SHEET_URL } from '../config/sheet';

interface Props {
  pageTitle: string;
  reportTitle?: string;
  tabs: TabInfo[];
  activeSheet: string;
  onSelectTab: (s: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  lastSync: number | null;
  onOpenNav: () => void;
}

function useRelativeTime(ts: number | null): number {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);
  return ts ?? 0;
}

export function Header(props: Props) {
  const { t, lang, toggle } = useI18n();
  const {
    pageTitle, reportTitle, tabs, activeSheet, onSelectTab,
    query, onQueryChange, onRefresh, refreshing, lastSync, onOpenNav,
  } = props;

  useRelativeTime(lastSync);

  const rel = (() => {
    if (!lastSync) return '';
    const s = Math.round((Date.now() - lastSync) / 1000);
    if (s < 10) return t('time.now');
    if (s < 60) return t('time.secAgo', { n: s });
    const m = Math.round(s / 60);
    if (m < 60) return t('time.minAgo', { n: m });
    return t('time.hourAgo', { n: Math.round(m / 60) });
  })();

  const SearchBox = (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute inset-y-0 my-auto h-4 w-4 text-ink-400" style={{ insetInlineStart: 12 }} />
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t('header.searchPlaceholder')}
        className="focus-ring w-full rounded-xl border border-slate-200 bg-surface-muted py-2.5 ps-9 pe-3 text-sm text-ink-900 placeholder:text-ink-400 focus:bg-white"
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-7">
        <button
          onClick={onOpenNav}
          className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-700 hover:bg-surface-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 shrink">
          <h1 className="truncate text-[15px] font-bold text-ink-900 lg:text-[17px]">{pageTitle}</h1>
          <p className="truncate text-[11.5px] text-ink-400">{reportTitle || t('app.subtitle')}</p>
        </div>

        <div className="ms-auto flex items-center gap-2">
          <div className="hidden w-64 xl:block">{SearchBox}</div>

          {/* Report / month selector */}
          <div className="relative hidden sm:block">
            <select
              value={activeSheet}
              onChange={(e) => onSelectTab(e.target.value)}
              className="focus-ring cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 ps-3.5 pe-9 text-sm font-semibold text-ink-800 hover:border-brand-300"
              aria-label={t('header.report')}
            >
              {tabs.map((tab) => (
                <option key={tab.sheet} value={tab.sheet}>
                  {lang === 'ar' ? tab.labelAr : tab.labelEn}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute inset-y-0 my-auto h-4 w-4 text-ink-400" style={{ insetInlineEnd: 10 }} />
          </div>

          {/* Live / refresh */}
          <button
            onClick={onRefresh}
            title={t('header.updated')}
            className="focus-ring flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12.5px] font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-700"
          >
            {refreshing ? (
              <Loader2 size={14} className="animate-spin text-brand-600" />
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            <span className="hidden md:inline">
              {refreshing ? t('header.syncing') : `${t('header.live')} · ${rel}`}
            </span>
            <RefreshCw size={13} className="text-ink-400 md:hidden" />
          </button>

          {/* Language */}
          <button
            onClick={toggle}
            className="focus-ring flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12.5px] font-bold text-ink-700 hover:border-brand-300 hover:text-brand-700"
            aria-label="Toggle language"
          >
            <Globe size={15} />
            <span>{t('header.language')}</span>
          </button>

          {/* Open sheet */}
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={t('header.openSheet')}
            className="focus-ring hidden h-[42px] w-[42px] place-items-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 sm:grid"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 xl:hidden">{SearchBox}</div>
    </header>
  );
}
