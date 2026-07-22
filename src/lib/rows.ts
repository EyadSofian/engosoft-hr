import type { CellValue, Dataset, DomainSpec, SheetRow, SheetTable } from '../types';
import { FIELDS, type FieldKey } from '../config/domains';

const EMPTY: CellValue = { raw: null, text: '', num: null, date: null, type: 'empty' };

/** Resolve a field to the first candidate header the tab actually has. */
export function headerFor(headers: string[], key: FieldKey): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const present = new Map(headers.map((h) => [norm(h), h]));
  for (const candidate of FIELDS[key]) {
    const hit = present.get(norm(candidate));
    if (hit) return hit;
  }
  return null;
}

/**
 * A grand-total row left at the bottom of a sheet would otherwise be counted as
 * a record. It is recognised by having no key AND almost nothing else filled in
 * — which a real record never looks like. Keying on the missing id alone would
 * be wrong: at least one live employee has no Emp ID yet.
 */
const TOTALS_ROW_MAX_CELLS = 3;

export function buildDataset(spec: DomainSpec, table: SheetTable): Dataset {
  const keyHeader = table.headers.find((h) => h.trim() === spec.keyColumn.trim());
  const rows = keyHeader
    ? table.rows.filter((r) => {
        if ((r.cells[keyHeader]?.text ?? '').trim() !== '') return true;
        const filled = Object.values(r.cells).filter((c) => c.type !== 'empty').length;
        return filled > TOTALS_ROW_MAX_CELLS;
      })
    : table.rows;
  return { spec, table, rows, headers: table.headers };
}

// ── Accessors ─────────────────────────────────────────────────
// Every read goes through these, so a missing column yields an empty cell
// rather than a crash.

export function cell(ds: Dataset, row: SheetRow, key: FieldKey): CellValue {
  const h = headerFor(ds.headers, key);
  return (h ? row.cells[h] : undefined) ?? EMPTY;
}
export function text(ds: Dataset, row: SheetRow, key: FieldKey): string {
  return cell(ds, row, key).text.trim();
}
export function num(ds: Dataset, row: SheetRow, key: FieldKey): number | null {
  return cell(ds, row, key).num;
}
export function date(ds: Dataset, row: SheetRow, key: FieldKey): Date | null {
  return cell(ds, row, key).date;
}
export function has(ds: Dataset, key: FieldKey): boolean {
  return headerFor(ds.headers, key) !== null;
}
/** The stable identity of a row, used as the write-back target. */
export function keyOf(ds: Dataset, row: SheetRow): string {
  return (row.cells[ds.spec.keyColumn]?.text ?? '').trim();
}

// ── Small aggregation helpers ─────────────────────────────────

export function countBy<T>(items: T[], pick: (t: T) => string): Map<string, number> {
  const out = new Map<string, number>();
  for (const item of items) {
    const k = pick(item).trim();
    if (!k) continue;
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

export function sumBy<T>(items: T[], pick: (t: T) => string, value: (t: T) => number): Map<string, number> {
  const out = new Map<string, number>();
  for (const item of items) {
    const k = pick(item).trim();
    if (!k) continue;
    out.set(k, (out.get(k) ?? 0) + value(item));
  }
  return out;
}

export interface Slice {
  label: string;
  value: number;
}

/** Map → sorted slices, biggest first, with an optional "other" tail. */
export function toSlices(map: Map<string, number>, limit = 0): Slice[] {
  const all = [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  if (!limit || all.length <= limit) return all;
  const head = all.slice(0, limit);
  const tail = all.slice(limit).reduce((sum, s) => sum + s.value, 0);
  return tail > 0 ? [...head, { label: '—', value: tail }] : head;
}

export function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}
