// ── Shared types ──────────────────────────────────────────────

export type Lang = 'ar' | 'en';

export type CellType = 'string' | 'number' | 'date' | 'empty';

export interface CellValue {
  raw: unknown;
  text: string; // display text (formatted if the sheet provided one)
  num: number | null;
  date: Date | null;
  type: CellType;
}

/** One row of a tab, keyed by the ORIGINAL (trimmed) header label. */
export interface SheetRow {
  index: number;
  cells: Record<string, CellValue>;
}

export interface SheetTable {
  sheet: string; // gviz tab name
  headers: string[]; // trimmed header labels, in order
  rows: SheetRow[];
  fetchedAt: number;
}

// ── Domains ───────────────────────────────────────────────────

export type DomainId =
  | 'recruitment'
  | 'employees'
  | 'salaries'
  | 'jobs'
  | 'kpis'
  | 'appraisals'
  | 'criteria'
  | 'plans'
  | 'training'
  | 'payroll';

export interface DomainSpec {
  id: DomainId;
  tab: string;
  ar: string;
  en: string;
  /** Stable row identity the write API targets. Never renumber it in the sheet. */
  keyColumn: string;
  editable: boolean;
  /** Requires the passcode gate before any data is fetched. */
  restricted?: boolean;
}

/** A tab that has been loaded and had its headers resolved. */
export interface Dataset {
  spec: DomainSpec;
  table: SheetTable;
  rows: SheetRow[];
  /** Present headers, so a page can ask "does this column exist?" */
  headers: string[];
}

// ── Write API ─────────────────────────────────────────────────

export interface WritePatch {
  [column: string]: string | number;
}

export interface WriteResult {
  ok: boolean;
  error?: string;
}

/** A local, not-yet-confirmed edit layered over the fetched rows. */
export interface PendingEdit {
  domain: DomainId;
  key: string;
  patch: WritePatch;
  at: number;
  state: 'saving' | 'saved' | 'failed';
  error?: string;
}
