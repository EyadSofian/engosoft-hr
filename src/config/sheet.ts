import type { CanonicalKey, ColumnMap, TabInfo } from '../types';

// ── Data source ───────────────────────────────────────────────
// The Google Sheet must be shared "Anyone with the link → Viewer".
export const SHEET_ID: string =
  import.meta.env.VITE_SHEET_ID || '12n8WoP01MihoviW-jNlx5TajTr6Qy5AAOfHnFsv-A08';

export const REFRESH_SECONDS: number = Number(import.meta.env.VITE_REFRESH_SECONDS) || 60;

// Optional: when set, every tab in the sheet is auto-discovered (new monthly
// tabs appear on their own). Without it, FALLBACK_TABS below are used.
export const GSHEET_API_KEY: string = import.meta.env.VITE_GSHEET_API_KEY || '';

// The sheet's live URL (opened from the header "Open sheet" button).
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

// ── Tabs (used when no API key is configured) ─────────────────
// Order matters: the first tab is the default view. The sheet name must match
// the Google Sheet tab EXACTLY. Friendly bilingual labels are shown in the UI.
export const FALLBACK_TABS: TabInfo[] = [
  { sheet: '6-2026', labelAr: 'يوليو 2026', labelEn: 'July 2026' },
  { sheet: 'Recruitment Analysis', labelAr: 'تحليل ديسمبر 2025', labelEn: 'Analysis · Dec 2025' },
];

// Prettify an auto-discovered tab name into a bilingual label.
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function tabLabel(sheet: string): { ar: string; en: string } {
  const known = FALLBACK_TABS.find((t) => t.sheet === sheet);
  if (known) return { ar: known.labelAr, en: known.labelEn };
  const m = sheet.match(/^(\d{1,2})[-/](\d{4})$/); // "7-2026" -> July 2026
  if (m) {
    const mi = Math.min(Math.max(parseInt(m[1], 10) - 1, 0), 11);
    return { ar: `${MONTHS_AR[mi]} ${m[2]}`, en: `${MONTHS_EN[mi]} ${m[2]}` };
  }
  return { ar: sheet, en: sheet };
}

// ── Column semantics ──────────────────────────────────────────
// The dashboard never hard-codes column letters. It reads the live header row
// and maps each header to a canonical role, so renaming/reordering a column in
// the sheet still "just works". NOTE: in this sheet column "Total" holds the
// job title — it is mapped to `position`.

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

// Exact header (normalized) -> canonical key.
const EXACT_ALIASES: Record<string, CanonicalKey> = {
  'no.': 'no',
  no: 'no',
  '#': 'no',
  total: 'position',
  position: 'position',
  'job title': 'position',
  role: 'position',
  'number needed': 'needed',
  needed: 'needed',
  required: 'needed',
  'accepted numb.': 'accepted',
  'accepted numb': 'accepted',
  'accepted number': 'accepted',
  accepted: 'accepted',
  hired: 'accepted',
  feedback: 'feedback',
  'feed back': 'feedback',
  notes: 'feedback',
  department: 'department',
  dept: 'department',
  'vacancy reason': 'vacancyReason',
  reason: 'vacancyReason',
  status: 'status',
  'received requirements': 'reqReceived',
  requirements: 'reqReceived',
  published: 'published',
  publish: 'published',
  'received candidate': 'candidateReceived',
  'received candidates': 'candidateReceived',
  candidate: 'candidateReceived',
  priority: 'priority',
  seniority: 'seniority',
  level: 'seniority',
  location: 'location',
  country: 'location',
  'assigned to i': 'recruiter1',
  'assigned to 1': 'recruiter1',
  'assigned to': 'recruiter1',
  recruiter: 'recruiter1',
  'assigned to ii': 'recruiter2',
  'assigned to 2': 'recruiter2',
  'active date': 'activeDate',
  'start date': 'activeDate',
  'due date / time of hire': 'dueDate',
  'due date': 'dueDate',
  deadline: 'dueDate',
  'time of hire': 'dueDate',
  'actual hiring date': 'hireDate',
  'hiring date': 'hireDate',
  'hire date': 'hireDate',
  'salary range': 'salaryRange',
  range: 'salaryRange',
  'actual salary': 'actualSalary',
  'final salary': 'actualSalary',
  salary: 'actualSalary',
  'hr manager validation': 'hrValidation',
  'hr validation': 'hrValidation',
  'hr manager': 'hrValidation',
  action: 'action',
  plan: 'action',
  interviewer: 'interviewer',
  'interviewed by': 'interviewer',
  validation: 'validation',
  'validated by': 'validation',
  'approved by': 'validation',
};

// Fuzzy fallback (specific-first so prefixes don't steal, e.g. "assigned to ii"
// must be tried before "assigned to i").
const FUZZY_ORDER: { key: CanonicalKey; aliases: string[] }[] = [
  { key: 'recruiter2', aliases: ['assigned to ii', 'assigned to 2', 'second recruiter'] },
  { key: 'recruiter1', aliases: ['assigned to', 'recruiter', 'assignee'] },
  { key: 'candidateReceived', aliases: ['received candidate', 'candidate'] },
  { key: 'reqReceived', aliases: ['received requirement', 'requirement'] },
  { key: 'actualSalary', aliases: ['actual salary', 'final salary', 'net salary'] },
  { key: 'salaryRange', aliases: ['salary range', 'salary', 'range'] },
  { key: 'accepted', aliases: ['accepted', 'hired'] },
  { key: 'needed', aliases: ['needed', 'required'] },
  { key: 'vacancyReason', aliases: ['vacancy', 'reason'] },
  { key: 'hireDate', aliases: ['hiring date', 'hire date'] },
  { key: 'dueDate', aliases: ['due date', 'deadline', 'time of hire'] },
  { key: 'activeDate', aliases: ['active date', 'start date'] },
  { key: 'hrValidation', aliases: ['hr manager', 'hr validation'] },
  { key: 'validation', aliases: ['validation', 'approved'] },
  { key: 'interviewer', aliases: ['interviewer', 'interview'] },
  { key: 'department', aliases: ['department', 'dept'] },
  { key: 'seniority', aliases: ['seniority', 'level'] },
  { key: 'priority', aliases: ['priority'] },
  { key: 'location', aliases: ['location', 'country'] },
  { key: 'published', aliases: ['publish'] },
  { key: 'status', aliases: ['status'] },
  { key: 'feedback', aliases: ['feedback', 'notes'] },
  { key: 'action', aliases: ['action', 'plan'] },
  { key: 'position', aliases: ['position', 'title', 'role', 'total'] },
  { key: 'no', aliases: ['no', '#', 'sr'] },
];

/** Resolve the live headers to canonical column indexes. */
export function resolveColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  const used = new Set<number>();

  // Pass 1 — exact normalized match.
  headers.forEach((h, i) => {
    const key = EXACT_ALIASES[norm(h)];
    if (key && map[key] === undefined) {
      map[key] = i;
      used.add(i);
    }
  });

  // Pass 2 — fuzzy contains, specific-first, one header per canonical.
  for (const { key, aliases } of FUZZY_ORDER) {
    if (map[key] !== undefined) continue;
    for (let i = 0; i < headers.length; i++) {
      if (used.has(i)) continue;
      const n = norm(headers[i]);
      if (aliases.some((a) => n === a || n.startsWith(a) || n.includes(a))) {
        map[key] = i;
        used.add(i);
        break;
      }
    }
  }

  return map;
}
