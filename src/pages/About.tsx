import { ExternalLink, Languages, RefreshCw, Sparkles, Table2 } from 'lucide-react';
import type { TabInfo } from '../types';
import type { Dataset } from '../lib/sheets';
import { useI18n } from '../i18n/LangProvider';
import { SHEET_URL } from '../config/sheet';
import { Logo } from '../components/Logo';

function Feature({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="card p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: color }}>
        {icon}
      </span>
      <h3 className="mt-4 font-bold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{desc}</p>
    </div>
  );
}

export function About({ ds, tabs }: { ds: Dataset; tabs: TabInfo[] }) {
  const { t, lang } = useI18n();
  const activeTab = tabs.find((x) => x.sheet === ds.table.sheet);

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fade-up">
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="bg-navy-gradient p-7 text-white">
          <Logo size={40} />
          <h1 className="mt-5 text-2xl font-extrabold">{t('about.title')}</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/70">{t('about.liveDesc')}</p>
          {ds.table.title && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium">
              <Table2 size={14} /> {ds.table.title}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Feature icon={<RefreshCw size={20} />} color="linear-gradient(135deg,#1366e6,#17b5e8)" title={t('about.live')} desc={t('about.liveDesc')} />
        <Feature icon={<Sparkles size={20} />} color="linear-gradient(135deg,#8b5cf6,#2a7df0)" title={t('about.adaptive')} desc={t('about.adaptiveDesc')} />
        <Feature icon={<Languages size={20} />} color="linear-gradient(135deg,#10b981,#17b5e8)" title={t('about.bilingual')} desc={t('about.bilingualDesc')} />
      </div>

      {/* Current data */}
      <div className="card p-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[11.5px] font-semibold text-ink-400">{t('about.tab')}</div>
            <div className="mt-1 text-lg font-extrabold text-ink-900">{activeTab ? (lang === 'ar' ? activeTab.labelAr : activeTab.labelEn) : ds.table.sheet}</div>
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-ink-400">{t('about.rows')}</div>
            <div className="mt-1 text-lg font-extrabold text-ink-900 tnum">{ds.records.length}</div>
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-ink-400">{t('about.columns')}</div>
            <div className="mt-1 text-lg font-extrabold text-ink-900 tnum">{ds.table.headers.length}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {ds.table.headers.map((h) => (
            <span key={h} className="rounded-lg bg-surface-muted px-2.5 py-1 text-[11.5px] font-medium text-ink-600">{h}</span>
          ))}
        </div>
      </div>

      <a
        href={SHEET_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        <ExternalLink size={16} /> {t('header.openSheet')}
      </a>

      <p className="pt-2 text-center text-[12px] text-ink-400">{t('foot.builtby')}</p>
    </div>
  );
}
