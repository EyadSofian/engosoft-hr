import type { Lang } from '../types';

// Bilingual, colored value dictionaries. `key` normalizers fold the messy
// real-world values (typos, casing, trailing spaces) into stable buckets.

export interface Meta {
  key: string;
  ar: string;
  en: string;
  color: string;
}

const pick = (m: Meta, lang: Lang) => (lang === 'ar' ? m.ar : m.en);

// ── Status ────────────────────────────────────────────────────
export const STATUS: Record<string, Meta> = {
  active: { key: 'active', ar: 'قيد التنفيذ', en: 'Active', color: '#2a7df0' },
  hold: { key: 'hold', ar: 'معلّقة', en: 'On Hold', color: '#f59e0b' },
  done: { key: 'done', ar: 'مكتملة', en: 'Done', color: '#10b981' },
  other: { key: 'other', ar: 'أخرى', en: 'Other', color: '#8091a8' },
};
export function statusKey(raw: string): keyof typeof STATUS {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return 'other';
  if (s.startsWith('act')) return 'active';
  if (s.startsWith('hol')) return 'hold';
  if (s.startsWith('don') || s.startsWith('clos') || s.startsWith('fill')) return 'done';
  return 'other';
}

// ── Priority ──────────────────────────────────────────────────
export const PRIORITY: Record<string, Meta> = {
  top: { key: 'top', ar: 'عالية', en: 'Top', color: '#f43f5e' },
  med: { key: 'med', ar: 'متوسطة', en: 'Medium', color: '#f59e0b' },
  normal: { key: 'normal', ar: 'عادية', en: 'Normal', color: '#2a7df0' },
  other: { key: 'other', ar: 'غير محددة', en: 'Unset', color: '#8091a8' },
};
export function priorityKey(raw: string): keyof typeof PRIORITY {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return 'other';
  if (s.startsWith('top') || s.startsWith('high') || s.startsWith('urg')) return 'top';
  if (s.startsWith('med')) return 'med';
  if (s.startsWith('nor') || s.startsWith('low')) return 'normal';
  return 'other';
}

// ── Seniority ─────────────────────────────────────────────────
export const SENIORITY: Record<string, Meta> = {
  high: { key: 'high', ar: 'خبرة عالية', en: 'High', color: '#0f52c0' },
  med: { key: 'med', ar: 'خبرة متوسطة', en: 'Medium', color: '#2a7df0' },
  normal: { key: 'normal', ar: 'مبتدئ', en: 'Normal', color: '#17b5e8' },
  other: { key: 'other', ar: 'غير محددة', en: 'Unset', color: '#8091a8' },
};
export function seniorityKey(raw: string): keyof typeof SENIORITY {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return 'other';
  if (s.startsWith('high')) return 'high';
  if (s.startsWith('med')) return 'med';
  // "Noraml" (source typo), "Normal", "low"
  if (s.startsWith('nor') || s.startsWith('noraml') || s.startsWith('low')) return 'normal';
  return 'other';
}

// ── Location ──────────────────────────────────────────────────
export const LOCATION: Record<string, Meta> = {
  eg: { key: 'eg', ar: 'مصر', en: 'Egypt', color: '#2a7df0' },
  ksa: { key: 'ksa', ar: 'السعودية', en: 'KSA', color: '#10b981' },
  other: { key: 'other', ar: 'أخرى', en: 'Other', color: '#8091a8' },
};
export function locationKey(raw: string): keyof typeof LOCATION {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return 'other';
  if (s.startsWith('eg') || s.includes('egy') || s.includes('مصر')) return 'eg';
  if (s.startsWith('ksa') || s.includes('saud') || s.includes('سعود')) return 'ksa';
  return 'other';
}

// ── Vacancy reason ────────────────────────────────────────────
export const VACANCY: Record<string, Meta> = {
  new: { key: 'new', ar: 'وظيفة جديدة', en: 'New', color: '#17b5e8' },
  replace: { key: 'replace', ar: 'إحلال', en: 'Replacement', color: '#8b5cf6' },
  other: { key: 'other', ar: 'غير محدد', en: 'Unspecified', color: '#8091a8' },
};
export function vacancyKey(raw: string): keyof typeof VACANCY {
  const s = (raw || '').toLowerCase().trim();
  if (!s || s === '0') return 'other';
  if (s.startsWith('new')) return 'new';
  if (s.startsWith('rep')) return 'replace';
  return 'other';
}

// ── Pipeline stage value (Requirements / Published / Candidate) ─
export type StageState = 'done' | 'wait' | 'hold' | 'none';
export function stageState(raw: string): StageState {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return 'none';
  if (s.startsWith('don')) return 'done';
  if (s.startsWith('wai') || s.startsWith('wia')) return 'wait'; // "Wiat" typo
  if (s.startsWith('hol')) return 'hold';
  return 'none';
}

export const STAGE_COLORS: Record<StageState, string> = {
  done: '#10b981',
  wait: '#f59e0b',
  hold: '#f43f5e',
  none: '#c3d0e4',
};

// Department palette (stable-ish colors; falls back by hashing the name).
const DEPT_PALETTE = [
  '#1366e6', '#17b5e8', '#8b5cf6', '#10b981', '#f59e0b',
  '#f43f5e', '#0ea5e9', '#6366f1', '#14b8a6', '#e11d48',
];
export function deptColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return DEPT_PALETTE[h % DEPT_PALETTE.length];
}

export function label(meta: Meta, lang: Lang) {
  return pick(meta, lang);
}
