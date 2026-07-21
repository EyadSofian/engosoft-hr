import {
  CalendarDays, GitBranch, Info, LayoutDashboard, Table2, Users, X,
} from 'lucide-react';
import type { TabInfo } from '../types';
import { NAV, type View } from '../nav';
import { useI18n } from '../i18n/LangProvider';
import { Logo } from './Logo';

const ICONS: Record<View, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  positions: Table2,
  recruiters: Users,
  pipeline: GitBranch,
  about: Info,
};

interface Props {
  active: View;
  onNavigate: (v: View) => void;
  tabs: TabInfo[];
  activeSheet: string;
  onSelectTab: (s: string) => void;
  onClose?: () => void;
}

export function Sidebar({ active, onNavigate, tabs, activeSheet, onSelectTab, onClose }: Props) {
  const { t, lang } = useI18n();

  return (
    <aside className="flex h-full w-full flex-col bg-navy-gradient text-white">
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <Logo />
        {onClose && (
          <button
            onClick={onClose}
            className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="px-3">
        <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-white/35">
          {t('nav.section.main')}
        </p>
        <div className="space-y-1">
          {NAV.map(({ view, labelKey }) => {
            const Icon = ICONS[view];
            const isActive = active === view;
            return (
              <button
                key={view}
                onClick={() => {
                  onNavigate(view);
                  onClose?.();
                }}
                className={`nav-item w-full ${isActive ? 'nav-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={2.1} />
                <span>{t(labelKey)}</span>
                {isActive && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-brand-300" />}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-7 px-3">
        <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-white/35">
          {t('nav.section.data')}
        </p>
        <div className="space-y-1">
          {tabs.map((tab) => {
            const isActive = tab.sheet === activeSheet;
            return (
              <button
                key={tab.sheet}
                onClick={() => {
                  onSelectTab(tab.sheet);
                  onClose?.();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-[13px] transition-all ${
                  isActive ? 'bg-white/12 font-semibold text-white' : 'text-white/55 hover:bg-white/8 hover:text-white/80'
                }`}
              >
                <CalendarDays size={15} strokeWidth={2.1} />
                <span className="truncate">{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-white/90">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {t('about.live')}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50">{t('app.subtitle')}</p>
        </div>
      </div>
    </aside>
  );
}
