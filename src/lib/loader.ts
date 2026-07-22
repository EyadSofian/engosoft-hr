import type { SheetTable } from '../types';
import { DATA_MODE, SHEET_ID } from '../config/domains';
import { loadSheetTable } from './gviz';
import { parseCsvTable } from './csv';

/**
 * Where a tab's rows come from.
 *
 * `sheet` (default) reads the live Google Sheet. `local` reads the CSVs in
 * `data/csv/`, served only by the Vite dev server — useful for working on the
 * dashboard before the sheet is populated, and it never reaches production
 * because the middleware does not exist in a built bundle.
 */
export async function loadTable(tab: string): Promise<SheetTable> {
  if (DATA_MODE === 'local') {
    const res = await fetch(`/local-data/${encodeURIComponent(tab)}.csv`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`No local CSV for "${tab}" (data/csv/${tab}.csv).`);
    return parseCsvTable(tab, await res.text());
  }
  return loadSheetTable(SHEET_ID, tab);
}
