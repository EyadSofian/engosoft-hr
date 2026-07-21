import { useState } from 'react';
import { useI18n } from './i18n/LangProvider';
import { useSheetData } from './hooks/useSheetData';
import { NAV, type View } from './nav';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoadingView, ErrorView } from './components/StateViews';
import { Overview } from './pages/Overview';
import { Positions } from './pages/Positions';
import { Recruiters } from './pages/Recruiters';
import { Pipeline } from './pages/Pipeline';
import { About } from './pages/About';

export default function App() {
  const { t } = useI18n();
  const data = useSheetData();
  const { dataset, analytics, loading, error, tabs, activeSheet, setActiveSheet } = data;

  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const pageTitle = t(NAV.find((n) => n.view === view)?.labelKey ?? 'nav.overview');

  const onQuery = (q: string) => {
    setQuery(q);
    if (q && view === 'overview') setView('positions');
  };

  const renderView = () => {
    if (!dataset || !analytics) return null;
    switch (view) {
      case 'overview':
        return <Overview a={analytics} />;
      case 'positions':
        return <Positions ds={dataset} query={query} />;
      case 'recruiters':
        return <Recruiters a={analytics} />;
      case 'pipeline':
        return <Pipeline ds={dataset} a={analytics} />;
      case 'about':
        return <About ds={dataset} tabs={tabs} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 lg:block">
        <Sidebar
          active={view}
          onNavigate={setView}
          tabs={tabs}
          activeSheet={activeSheet}
          onSelectTab={setActiveSheet}
        />
      </aside>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 start-0 w-[280px] shadow-2xl animate-fade-up">
            <Sidebar
              active={view}
              onNavigate={setView}
              tabs={tabs}
              activeSheet={activeSheet}
              onSelectTab={setActiveSheet}
              onClose={() => setNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          pageTitle={pageTitle}
          reportTitle={dataset?.table.title}
          tabs={tabs}
          activeSheet={activeSheet}
          onSelectTab={setActiveSheet}
          query={query}
          onQueryChange={onQuery}
          onRefresh={data.refresh}
          refreshing={data.refreshing}
          lastSync={data.lastSync}
          onOpenNav={() => setNavOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 lg:px-7">
          {loading ? (
            <LoadingView text={t('state.loading')} />
          ) : error && !dataset ? (
            <ErrorView
              title={t('state.error')}
              desc={t('state.errorDesc')}
              detail={error}
              retryLabel={t('state.retry')}
              onRetry={data.refresh}
            />
          ) : (
            renderView()
          )}
        </main>

        <footer className="border-t border-slate-200/70 px-4 py-4 text-center text-[11.5px] text-ink-400 lg:px-7">
          {t('foot.builtby')} · <span className="font-semibold text-ink-500">Engosoft</span>
        </footer>
      </div>
    </div>
  );
}
