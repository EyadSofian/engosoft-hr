import type { CellValue, CellType, SheetRow, SheetTable } from '../types';

/**
 * CSV → SheetTable, for the dev-only local data mode.
 *
 * Values are typed the same way the gviz reader types them, so a page cannot
 * tell which source it is reading and local preview stays faithful.
 */

/** RFC 4180 split: quoted fields may contain commas, newlines and "" escapes. */
function parseRows(input: string): string[][] {
  const text = input.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toCellValue(raw: string): CellValue {
  const text = raw.trim();
  if (text === '') return { raw: null, text: '', num: null, date: null, type: 'empty' };

  const cleaned = text.replace(/,/g, '');
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    const num = Number(cleaned);
    return { raw: num, text, num, date: null, type: 'number' };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T00:00:00`);
    if (!isNaN(date.getTime())) return { raw: text, text, num: null, date, type: 'date' };
  }
  const type: CellType = 'string';
  return { raw: text, text, num: null, date: null, type };
}

export function parseCsvTable(sheetName: string, csv: string): SheetTable {
  const grid = parseRows(csv);
  if (!grid.length) return { sheet: sheetName, headers: [], rows: [], fetchedAt: Date.now() };

  const kept: { idx: number; label: string }[] = [];
  grid[0].forEach((h, i) => {
    const label = h.trim();
    if (label) kept.push({ idx: i, label });
  });
  const headers = kept.map((k) => k.label);

  const rows: SheetRow[] = [];
  grid.slice(1).forEach((line, ri) => {
    const cells: Record<string, CellValue> = {};
    let hasAny = false;
    kept.forEach((k) => {
      const cv = toCellValue(line[k.idx] ?? '');
      cells[k.label] = cv;
      if (cv.type !== 'empty') hasAny = true;
    });
    if (hasAny) rows.push({ index: ri, cells });
  });

  return { sheet: sheetName, headers, rows, fetchedAt: Date.now() };
}
