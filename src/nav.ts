import type { StringKey } from './i18n/strings';

export type View =
  | 'overview'
  | 'recruitment'
  | 'employees'
  | 'jobs'
  | 'salaries'
  | 'performance'
  | 'kpis'
  | 'training'
  | 'settings';

export interface NavItem {
  view: View;
  labelKey: StringKey;
  icon: string; // lucide-react icon name
  /** Behind the passcode gate. */
  locked?: boolean;
}

export interface NavSection {
  titleKey: StringKey;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: 'nav.section.main',
    items: [
      { view: 'overview', labelKey: 'nav.overview', icon: 'LayoutDashboard' },
      { view: 'recruitment', labelKey: 'nav.recruitment', icon: 'UserPlus' },
      { view: 'employees', labelKey: 'nav.employees', icon: 'Users' },
    ],
  },
  {
    titleKey: 'nav.section.org',
    items: [
      { view: 'jobs', labelKey: 'nav.jobs', icon: 'Network' },
      { view: 'performance', labelKey: 'nav.performance', icon: 'ClipboardCheck' },
      { view: 'kpis', labelKey: 'nav.kpis', icon: 'Target' },
      { view: 'training', labelKey: 'nav.training', icon: 'GraduationCap' },
    ],
  },
  {
    titleKey: 'nav.section.finance',
    items: [
      { view: 'salaries', labelKey: 'nav.salaries', icon: 'Wallet', locked: true },
    ],
  },
  {
    titleKey: 'nav.section.system',
    items: [
      { view: 'settings', labelKey: 'nav.settings', icon: 'Settings' },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** The five that fit a phone's bottom bar. */
export const MOBILE_NAV: View[] = ['overview', 'recruitment', 'employees', 'performance', 'settings'];

export function navItem(view: View): NavItem {
  return NAV_ITEMS.find((n) => n.view === view) ?? NAV_ITEMS[0];
}
