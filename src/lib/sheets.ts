import type { CanonicalKey, CellValue, ColumnMap, SheetRow, SheetTable, TabInfo } from '../types';
import { FALLBACK_TABS, GSHEET_API_KEY, resolveColumns, tabLabel } from '../config/sheet';
import { loadSheetTable } from './gviz';

export { loadSheetTable };

export interface Dataset {
  table: SheetTable;
  columns: ColumnMap;
  canonicalHeader: Partial<Record<CanonicalKey, string>>;
  records: SheetRow[];
}

/** Turn a raw SheetTable into a canonical, analytics-ready dataset. */
export function buildDataset(table: SheetTable): Dataset {
  const columns = resolveColumns(table.headers);

  const canonicalHeader: Partial<Record<CanonicalKey, string>> = {};
  (Object.keys(columns) as CanonicalKey[]).forEach((k) => {
    const idx = columns[k];
    if (idx !== undefined) canonicalHeader[k] = table.headers[idx];
  });

  // A real position row must carry a job title (the mislabeled "Total" column).
  // This drops the sheet's totals/summary row automatically.
  const posH = canonicalHeader.position;
  const records = table.rows.filter((r) => {
    if (!posH) return true;
    const c = r.cells[posH];
    return !!c && c.type !== 'empty' && c.text.trim() !== '';
  });

  return { table, columns, canonicalHeader, records };
}

// ── Canonical accessors ───────────────────────────────────────
export function has(ds: Dataset, key: CanonicalKey): boolean {
  return ds.columns[key] !== undefined;
}
export function cellOf(ds: Dataset, row: SheetRow, key: CanonicalKey): CellValue | null {
  const h = ds.canonicalHeader[key];
  return h ? row.cells[h] ?? null : null;
}
export function textOf(ds: Dataset, row: SheetRow, key: CanonicalKey): string {
  return cellOf(ds, row, key)?.text ?? '';
}
export function numOf(ds: Dataset, row: SheetRow, key: CanonicalKey): number | null {
  return cellOf(ds, row, key)?.num ?? null;
}
export function dateOf(ds: Dataset, row: SheetRow, key: CanonicalKey): Date | null {
  return cellOf(ds, row, key)?.date ?? null;
}

// ── Tab discovery ─────────────────────────────────────────────
// With an API key, every (visible) tab is discovered live; otherwise the
// configured fallback tabs are used.
export async function discoverTabs(sheetId: string): Promise<TabInfo[]> {
  if (GSHEET_API_KEY) {
    try {
      const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}` +
        `?fields=sheets.properties(title,hidden,index)&key=${GSHEET_API_KEY}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const tabs: TabInfo[] = (json.sheets || [])
          .map((s: { properties: { title: string; hidden?: boolean; index: number } }) => s.properties)
          .filter((p: { hidden?: boolean }) => !p.hidden)
          .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
          .map((p: { title: string }) => {
            const l = tabLabel(p.title);
            return { sheet: p.title, labelAr: l.ar, labelEn: l.en };
          });
        if (tabs.length) return tabs;
      }
    } catch {
      /* fall through to fallback */
    }
  }
  return FALLBACK_TABS;
}
