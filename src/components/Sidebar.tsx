import { ExternalLink, Lock, X } from 'lucide-react';
import { Logo } from './Logo';
import { NavIcon } from './NavIcon';
import { useI18n } from '../i18n/LangProvider';
import { NAV_SECTIONS, type View } from '../nav';
import { SHEET_URL } from '../config/domains';
import { useSalaryGate } from '../auth/SalaryGate';

export function Sidebar({
  active,
  onNavigate,
  onClose,
}: {
  active: View;
  onNavigate: (v: View) => void;
  onClose?: () => void;
}) {
  const { t } = useI18n();
  const { unlocked } = useSalaryGate();

  return (
    <nav className="flex h-full flex-col bg-navy-gradient" aria-label={t('header.menu')}>
      <div className="flex items-center gap-2 px-4 pb-4 pt-5">
        <Logo size={38} tone="dark" subtitle={t('app.suite')} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring ms-auto grid h-9 w-9 place-items-center rounded-lg text-white/60
                       hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.titleKey} className="mb-5">
            <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              {t(section.titleKey)}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.view}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.view);
                      onClose?.();
                    }}
                    aria-current={active === item.view ? 'page' : undefined}
                    className={`nav-item min-h-[44px] w-full ${
                      active === item.view ? 'nav-item-active' : ''
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    <span className="flex-1 text-start">{t(item.labelKey)}</span>
                    {item.locked && (
                      <Lock
                        size={13}
                        className={unlocked ? 'text-emerald-300/70' : 'text-white/40'}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-3">
        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item min-h-[44px] w-full"
        >
          <ExternalLink size={17} />
          <span className="flex-1 text-start">{t('header.openSheet')}</span>
        </a>
      </div>
    </nav>
  );
}
