import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import { Lock, ShieldAlert, Unlock } from 'lucide-react';
import { SALARY_PASS_HASH } from '../config/domains';
import { useI18n } from '../i18n/LangProvider';

/**
 * Passcode gate for the salary pages.
 *
 * The unlock is per-tab (sessionStorage) — closing the tab re-locks. Only a
 * SHA-256 digest of the passcode is shipped, and nothing behind the gate is
 * even requested from Google Sheets until it opens, so a locked visitor never
 * has payroll data in their browser at all.
 *
 * This keeps salaries off the screen of someone glancing at a shared laptop. It
 * is not a server-side permission: anyone who can open the spreadsheet itself
 * can still read the Salaries tab. Restrict the tab in Google Sheets too if
 * that matters.
 */

interface GateValue {
  unlocked: boolean;
  unlock: (passcode: string) => Promise<boolean>;
  lock: () => void;
  configured: boolean;
}

const GateContext = createContext<GateValue | null>(null);
const SESSION_KEY = 'engosoft.salary.unlocked';

/**
 * The env var must hold a SHA-256 digest, not the passcode. Pasting the
 * passcode itself is the obvious mistake, and it would otherwise surface as
 * "wrong passcode" forever — so check the shape and say so instead.
 */
const isDigest = (v: string) => /^[0-9a-f]{64}$/i.test(v.trim());

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function SalaryGateProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1',
  );

  const unlock = useCallback(async (passcode: string) => {
    if (!isDigest(SALARY_PASS_HASH)) return false;
    const hash = await sha256Hex(passcode);
    const ok = hash.toLowerCase() === SALARY_PASS_HASH.trim().toLowerCase();
    if (ok) {
      setUnlocked(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    return ok;
  }, []);

  const lock = useCallback(() => {
    setUnlocked(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo<GateValue>(
    () => ({ unlocked, unlock, lock, configured: isDigest(SALARY_PASS_HASH) }),
    [unlocked, unlock, lock],
  );

  return <GateContext.Provider value={value}>{children}</GateContext.Provider>;
}

export function useSalaryGate(): GateValue {
  const ctx = useContext(GateContext);
  if (!ctx) throw new Error('useSalaryGate must be used inside <SalaryGateProvider>.');
  return ctx;
}

/** Renders `children` only once the passcode has been accepted. */
export function SalaryGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { unlocked, unlock, configured } = useSalaryGate();
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (unlocked) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    const ok = await unlock(value);
    setBusy(false);
    if (!ok) {
      setError(true);
      setValue('');
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-md animate-fade-up sm:mt-16">
      <div className="card overflow-hidden">
        <div className="bg-hero-gradient px-6 py-7 text-center text-white">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Lock size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold">{t('sal.locked')}</h2>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-white/75">
            {t('sal.lockedBody')}
          </p>
        </div>

        <div className="p-6">
          {!configured ? (
            <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-900">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-500" />
              <span>{t('sal.notConfigured')}</span>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">
                  {t('sal.passcode')}
                </span>
                <input
                  type="password"
                  autoFocus
                  inputMode="text"
                  autoComplete="off"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(false);
                  }}
                  aria-invalid={error}
                  className={`focus-ring w-full rounded-xl border px-4 py-3 text-[15px] tnum
                    ${error ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-surface-muted'}`}
                />
              </label>

              {error && (
                <p role="alert" className="text-[13px] font-semibold text-rose-600">
                  {t('sal.wrong')}
                </p>
              )}

              <button
                type="submit"
                disabled={!value || busy}
                className="focus-ring flex min-h-[46px] w-full items-center justify-center gap-2
                           rounded-xl bg-brand-600 font-bold text-white transition
                           hover:bg-brand-700 disabled:opacity-40"
              >
                <Unlock size={17} />
                {t('sal.unlock')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
