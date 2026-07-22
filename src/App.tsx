import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from './i18n/LangProvider';
import { useData } from './data/DataProvider';
import { navItem, type View } from './nav';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { SaveToasts } from './components/SaveToasts';
import { Overview } from './pages/Overview';
import { Recruitment } from './pages/Recruitment';
import { Employees } from './pages/Employees';
import { Jobs } from './pages/Jobs';
import { Salaries } from './pages/Salaries';
import { Performance } from './pages/Performance';
import { Kpis } from './pages/Kpis';
import { Training } from './pages/Training';
import { Settings } from './pages/Settings';

/** Which domain's sync clock the header shows for each page. */
const HEADER_DOMAIN = {
  overview: 'employees',
  recruitment: 'recruitment',
  employees: 'employees',
  jobs: 'jobs',
  salaries: 'salaries',
  performance: 'appraisals',
  kpis: 'kpis',
  training: 'training',
  settings: 'employees',
} as const;

/** Pages whose content the header search box filters. */
const SEARCHABLE: View[] = [
  'recruitment', 'employees', 'jobs', 'salaries', 'performance', 'kpis', 'training',
];

export default function App() {
  const { t } = useI18n();
  const { get } = useData();
  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const item = navItem(view);
  const domainState = get(HEADER_DOMAIN[view]);

  // A query typed on one page should not silently filter the next one.
  useEffect(() => { setQuery(''); }, [view]);

  // The drawer must not stay open behind a desktop layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const close = () => mq.matches && setNavOpen(false);
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  const page = useMemo(() => {
    switch (view) {
      case 'overview': return <Overview onNavigate={setView} />;
      case 'recruitment': return <Recruitment query={query} />;
      case 'employees': return <Employees query={query} />;
      case 'jobs': return <Jobs query={query} />;
      case 'salaries': return <Salaries query={query} />;
      case 'performance': return <Performance query={query} />;
      case 'kpis': return <Kpis query={query} />;
      case 'training': return <Training query={query} />;
      case 'settings': return <Settings />;
    }
  }, [view, query]);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 lg:block">
        <Sidebar active={view} onNavigate={setView} />
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 start-0 w-[280px] shadow-2xl animate-fade-up">
            <Sidebar active={view} onNavigate={setView} onClose={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          pageTitle={t(item.labelKey)}
          lastSync={domainState.lastSync}
          refreshing={domainState.refreshing}
          onOpenNav={() => setNavOpen(true)}
        />

        {SEARCHABLE.includes(view) && (
          <div className="mx-auto w-full max-w-[1480px] px-3 pt-3 lg:px-7">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                aria-label={t('header.searchPlaceholder')}
                className="focus-ring min-h-[46px] w-full rounded-xl border border-slate-200
                           bg-surface-card ps-10 pe-10 text-[14px] shadow-soft
                           placeholder:text-ink-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('table.clear')}
                  className="focus-ring absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2
                             place-items-center rounded-lg text-ink-400 hover:bg-surface-muted"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1480px] flex-1 px-3 py-4 lg:px-7 lg:py-5">
          {page}
        </main>

        <footer
          className="border-t border-slate-200/70 px-4 py-4 text-center text-[11.5px] text-ink-400
                     lg:px-7"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          {t('foot.builtby')} · <span className="font-semibold text-ink-500">Engosoft</span>
        </footer>

        {/* Clears the fixed bottom bar on phones */}
        <div className="h-[56px] lg:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }} />
      </div>

      <MobileNav active={view} onNavigate={setView} />
      <SaveToasts />
    </div>
  );
}
