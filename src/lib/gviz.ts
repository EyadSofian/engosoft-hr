import type { CellValue, CellType, SheetRow, SheetTable } from '../types';
import { parseGvizDate } from './format';

const GVIZ_BASE = 'https://docs.google.com/spreadsheets/d';

function gvizUrl(sheetId: string, sheetName: string, range: string, csv = false): string {
  const params = new URLSearchParams({
    tqx: `out:${csv ? 'csv' : 'json'}`,
    sheet: sheetName,
    range,
    headers: '1',
    _: String(Date.now()), // cache-buster so polling gets fresh data
  });
  return `${GVIZ_BASE}/${sheetId}/gviz/tq?${params.toString()}`;
}

interface GvizCol { id: string; label?: string; type?: string; }
interface GvizCell { v: unknown; f?: string } // may be null
interface GvizTable { cols: GvizCol[]; rows: { c: (GvizCell | null)[] }[] }
interface GvizResponse { status: string; errors?: { detailed_message?: string }[]; table: GvizTable }

function unwrap(text: string): GvizResponse {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('Unexpected response from Google Sheets.');
  return JSON.parse(text.slice(start, end + 1));
}

function toCellValue(cell: GvizCell | null, colType?: string): CellValue {
  if (!cell || (cell.v == null && !cell.f)) {
    return { raw: null, text: '', num: null, date: null, type: 'empty' };
  }
  const raw = cell.v;
  const f = cell.f;

  // Date (declared type or a "Date(...)" literal)
  if (colType === 'date' || colType === 'datetime' || (typeof raw === 'string' && raw.startsWith('Date('))) {
    const date = parseGvizDate(raw);
    if (date) return { raw, text: f ?? '', num: null, date, type: 'date' };
  }

  // Number
  if (typeof raw === 'number') {
    return { raw, text: f ?? String(raw), num: raw, date: null, type: 'number' };
  }
  if (typeof raw === 'boolean') {
    return { raw, text: f ?? String(raw), num: null, date: null, type: 'string' };
  }

  // String — keep a numeric view when the string is a clean number
  const text = (f ?? String(raw)).trim();
  const cleaned = text.replace(/,/g, '');
  const num = cleaned !== '' && /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
  const type: CellType = text === '' ? 'empty' : 'string';
  return { raw, text, num, date: null, type };
}

async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error(`Google Sheets returned HTTP ${res.status}.`);
    return await res.text();
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Network timeout — could not reach Google Sheets.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Best-effort read of the row-1 report title (kept separate from the header row). */
async function fetchTitle(sheetId: string, sheetName: string): Promise<string> {
  try {
    const text = await fetchText(gvizUrl(sheetId, sheetName, 'A1:A1', true));
    // CSV of a single cell, possibly quoted.
    return text.trim().replace(/^"|"$/g, '').replace(/""/g, '"').trim();
  } catch {
    return '';
  }
}

/** Load one tab as a normalized SheetTable (headers from row 2, data from row 3+). */
export async function loadSheetTable(sheetId: string, sheetName: string): Promise<SheetTable> {
  const [dataText, title] = await Promise.all([
    fetchText(gvizUrl(sheetId, sheetName, 'A2:AZ2000')),
    fetchTitle(sheetId, sheetName),
  ]);

  const resp = unwrap(dataText);
  if (resp.status === 'error') {
    const msg = resp.errors?.[0]?.detailed_message || 'Unknown error';
    throw new Error(`Google Sheets: ${msg}`);
  }

  const cols = resp.table.cols || [];
  // Keep only columns that carry a header label (drops trailing empties).
  const kept: { idx: number; label: string; type?: string }[] = [];
  cols.forEach((c, i) => {
    const label = (c.label || '').trim();
    if (label) kept.push({ idx: i, label, type: c.type });
  });

  const headers = kept.map((k) => k.label);

  const rows: SheetRow[] = [];
  (resp.table.rows || []).forEach((r, ri) => {
    const cells: Record<string, CellValue> = {};
    let hasAny = false;
    kept.forEach((k) => {
      const cv = toCellValue(r.c?.[k.idx] ?? null, k.type);
      cells[k.label] = cv;
      if (cv.type !== 'empty') hasAny = true;
    });
    if (hasAny) rows.push({ index: ri, cells });
  });

  return { sheet: sheetName, title, headers, rows, fetchedAt: Date.now() };
}
