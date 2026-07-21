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

/** One row of the sheet, keyed by the ORIGINAL (trimmed) header label. */
export interface SheetRow {
  index: number;
  cells: Record<string, CellValue>;
}

export interface SheetTable {
  sheet: string; // gviz tab name
  title: string; // row-1 report title (live from the sheet)
  headers: string[]; // trimmed row-2 labels, in order
  rows: SheetRow[];
  fetchedAt: number;
}

export interface TabInfo {
  sheet: string; // exact gviz tab name
  labelAr: string;
  labelEn: string;
}

export type CanonicalKey =
  | 'no'
  | 'position'
  | 'needed'
  | 'accepted'
  | 'feedback'
  | 'department'
  | 'vacancyReason'
  | 'status'
  | 'reqReceived'
  | 'published'
  | 'candidateReceived'
  | 'priority'
  | 'seniority'
  | 'location'
  | 'recruiter1'
  | 'recruiter2'
  | 'activeDate'
  | 'dueDate'
  | 'hireDate'
  | 'salaryRange'
  | 'actualSalary'
  | 'hrValidation'
  | 'action'
  | 'interviewer'
  | 'validation';

/** canonical key -> index into headers/row cells (only present columns) */
export type ColumnMap = Partial<Record<CanonicalKey, number>>;
