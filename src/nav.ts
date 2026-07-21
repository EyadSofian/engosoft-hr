import type { StringKey } from './i18n/strings';

export type View = 'overview' | 'positions' | 'recruiters' | 'pipeline' | 'about';

export const NAV: { view: View; labelKey: StringKey }[] = [
  { view: 'overview', labelKey: 'nav.overview' },
  { view: 'positions', labelKey: 'nav.positions' },
  { view: 'recruiters', labelKey: 'nav.recruiters' },
  { view: 'pipeline', labelKey: 'nav.pipeline' },
  { view: 'about', labelKey: 'nav.about' },
];
