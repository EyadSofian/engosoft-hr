import { ExternalLink, Inbox } from 'lucide-react';
import { SHEET_URL } from '../config/domains';
import { useI18n } from '../i18n/LangProvider';

/** Shown when a tab exists but has no rows — usually a CSV that is not uploaded yet. */
export function EmptyTab({ tab }: { tab: string }) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-[46vh] place-items-center px-4">
      <div className="card max-w-sm p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-muted text-ink-400">
          <Inbox size={26} />
        </span>
        <h2 className="mt-4 text-[16px] font-bold text-ink-900">{t('state.empty')}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
          {t('state.emptyTab', { tab })}
        </p>
        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5
                     text-[13px] font-semibold text-white transition hover:bg-brand-700"
        >
          <ExternalLink size={15} />
          {t('header.openSheet')}
        </a>
      </div>
    </div>
  );
}
