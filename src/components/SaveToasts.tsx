import { AlertCircle, Check, Loader2, X } from 'lucide-react';
import { useData } from '../data/DataProvider';
import { useI18n } from '../i18n/LangProvider';

/**
 * Write feedback. A failed save stays until dismissed — the optimistic value
 * has already been rolled back, so the user must know the sheet did not take it.
 */
export function SaveToasts() {
  const { t } = useI18n();
  const { pending, dismiss } = useData();
  if (!pending.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[76px] z-50 flex flex-col items-center gap-2
                 px-4 lg:bottom-6 lg:end-6 lg:inset-x-auto lg:items-end"
      role="status"
      aria-live="polite"
    >
      {pending.map((p) => {
        const id = `${p.domain}:${p.key}:${p.at}`;
        const failed = p.state === 'failed';
        return (
          <div
            key={id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border
                        px-3.5 py-2.5 shadow-lift animate-slide-up ${
                          failed
                            ? 'border-rose-200 bg-rose-50'
                            : p.state === 'saved'
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-slate-200 bg-white'
                        }`}
          >
            <span className="mt-0.5 shrink-0">
              {p.state === 'saving' && <Loader2 size={16} className="animate-spin text-brand-600" />}
              {p.state === 'saved' && <Check size={16} className="text-emerald-600" />}
              {failed && <AlertCircle size={16} className="text-rose-600" />}
            </span>

            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-bold ${
                failed ? 'text-rose-800' : p.state === 'saved' ? 'text-emerald-800' : 'text-ink-900'
              }`}>
                {p.state === 'saving' && t('edit.saving')}
                {p.state === 'saved' && t('edit.saved')}
                {failed && t('edit.failed')}
              </p>
              <p className="truncate text-[11.5px] text-ink-500">{p.key}</p>
              {failed && p.error && (
                <p className="mt-0.5 break-words text-[11.5px] text-rose-700">{p.error}</p>
              )}
            </div>

            {failed && (
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label={t('edit.cancel')}
                className="focus-ring -me-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg
                           text-rose-500 hover:bg-rose-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
