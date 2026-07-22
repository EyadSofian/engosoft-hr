import { NavIcon } from './NavIcon';
import { useI18n } from '../i18n/LangProvider';
import { MOBILE_NAV, navItem, type View } from '../nav';

/**
 * Bottom tab bar for phones. Five destinations at 56px tall with a safe-area
 * inset, so it clears the iOS home indicator; the rest of the nav stays in the
 * drawer.
 */
export function MobileNav({
  active,
  onNavigate,
}: {
  active: View;
  onNavigate: (v: View) => void;
}) {
  const { t } = useI18n();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface-card/95
                 shadow-bottombar backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('header.menu')}
    >
      <ul className="mx-auto flex max-w-lg">
        {MOBILE_NAV.map((view) => {
          const item = navItem(view);
          const isActive = active === view;
          return (
            <li key={view} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate(view)}
                aria-current={isActive ? 'page' : undefined}
                className={`focus-ring flex min-h-[56px] w-full flex-col items-center justify-center gap-1
                            px-1 pt-1.5 pb-1 transition-colors ${
                              isActive ? 'text-brand-600' : 'text-ink-400'
                            }`}
              >
                <span className="relative">
                  {isActive && (
                    <span className="absolute -top-1.5 start-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full
                                     bg-brand-600" />
                  )}
                  <NavIcon name={item.icon} size={19} />
                </span>
                <span className="max-w-full truncate text-[10.5px] font-bold leading-tight">
                  {t(item.labelKey)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
