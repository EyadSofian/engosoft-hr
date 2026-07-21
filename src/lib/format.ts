import type { Lang } from '../types';

// ── Dates ─────────────────────────────────────────────────────
// gviz encodes dates as "Date(y,m,d[,h,mi,s])" where m is already 0-indexed,
// which maps directly onto the JS Date constructor.
export function parseGvizDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v !== 'string') return null;
  const m = v.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const dt = new Date(
    Number(y), Number(mo), Number(d),
    Number(h ?? 0), Number(mi ?? 0), Number(s ?? 0),
  );
  return isNaN(dt.getTime()) ? null : dt;
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(lang: Lang, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = lang + JSON.stringify(opts);
  let f = dtfCache.get(key);
  if (!f) {
    // Latin digits in both languages for clean tabular alignment.
    const locale = lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
    f = new Intl.DateTimeFormat(locale, opts);
    dtfCache.set(key, f);
  }
  return f;
}

export function formatDate(d: Date | null, lang: Lang): string {
  if (!d) return '—';
  return dtf(lang, { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function formatMonthYear(d: Date | null, lang: Lang): string {
  if (!d) return '—';
  return dtf(lang, { month: 'short', year: 'numeric' }).format(d);
}

const DAY = 86400000;
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

export function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

// ── Numbers ───────────────────────────────────────────────────
const nf = new Intl.NumberFormat('en-US');
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return nf.format(n);
}
export function formatDecimal(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return nf1.format(n);
}
export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return `${nf1.format(n)}%`;
}
export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return nf.format(Math.round(n));
}

// ── Compensation parsing ──────────────────────────────────────
// Values are messy: EGP monthly numbers, "1000 SAR", "1500 Per Hour",
// "1500/45000 per course", ranges like "12000:15000". We extract a clean,
// comparable monthly-EGP figure only when it is unambiguous.
export type Period = 'month' | 'hour' | 'course';
export interface Comp {
  amount: number | null;
  currency: 'EGP' | 'SAR';
  period: Period;
  isMonthlyEgp: boolean; // safe to aggregate as a monthly EGP salary
}

const MONTHLY_MIN = 3000;
const MONTHLY_MAX = 80000;

export function parseComp(raw: unknown): Comp {
  const text = raw == null ? '' : String(raw);
  const lower = text.toLowerCase();

  const currency: Comp['currency'] =
    lower.includes('sar') || lower.includes('ريال') || lower.includes('ر.س') ? 'SAR' : 'EGP';

  let period: Period = 'month';
  if (lower.includes('hour') || lower.includes('/hr') || lower.includes('per hr') || lower.includes('ساعة'))
    period = 'hour';
  else if (lower.includes('course') || lower.includes('كورس') || lower.includes('محاضرة')) period = 'course';

  const nums = (text.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((x) => Number(x.replace(/,/g, '')));
  let amount: number | null = null;
  if (nums.length === 1) amount = nums[0];
  else if (nums.length > 1) amount = Math.max(...nums); // ranges: use the upper bound

  const isMonthlyEgp =
    currency === 'EGP' &&
    period === 'month' &&
    nums.length === 1 && // skip ambiguous multi-number cells for aggregation
    amount !== null &&
    amount >= MONTHLY_MIN &&
    amount <= MONTHLY_MAX;

  return { amount, currency, period, isMonthlyEgp };
}

/** Parse a salary range like "12000:15000" or "18000-20000". */
export function parseRange(raw: unknown): { min: number; max: number; mid: number } | null {
  const text = raw == null ? '' : String(raw);
  const m = text.match(/(\d[\d,]*)\s*[:\-–]\s*(\d[\d,]*)/);
  if (!m) return null;
  const min = Number(m[1].replace(/,/g, ''));
  const max = Number(m[2].replace(/,/g, ''));
  if (isNaN(min) || isNaN(max)) return null;
  return { min, max, mid: Math.round((min + max) / 2) };
}

// ── Small stats ───────────────────────────────────────────────
export function median(values: number[]): number | null {
  const v = values.filter((x) => !isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
export function mean(values: number[]): number | null {
  const v = values.filter((x) => !isNaN(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
