import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// `import.meta.dirname` needs Node 20.11+; this works on every version Railway
// might pick.
const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Dev-only local data sandbox.
 *
 * Serves `data/csv/*.csv` at `/local-data/*.csv` and mirrors the Apps Script
 * write API at `/__mock-write`, keeping edits in memory. Together they let the
 * whole dashboard — including drag-and-drop and Close — be exercised before the
 * Google Sheet exists. Both routes are `apply: 'serve'`, so neither the payroll
 * CSVs nor the fake write endpoint can reach a production build.
 */
function localData(): Plugin {
  const root = resolve(HERE, 'data/csv');
  // tab -> key -> { column: value }
  const overlay = new Map<string, Map<string, Record<string, string>>>();

  const readBody = (req: IncomingMessage) =>
    new Promise<string>((done) => {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => done(body));
    });

  const json = (res: ServerResponse, payload: unknown, status = 200) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };

  return {
    name: 'engosoft-local-data',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/local-data', async (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\//, ''));
        // Refuse anything that could climb out of data/csv.
        if (!/^[\w .()-]+\.csv$/.test(name)) return next();
        try {
          let csv = await readFile(resolve(root, name), 'utf8');
          csv = applyOverlay(csv, overlay.get(name.replace(/\.csv$/, '')));
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(csv);
        } catch {
          res.statusCode = 404;
          res.end('not found');
        }
      });

      server.middlewares.use('/__mock-write', async (req, res) => {
        if (req.method !== 'POST') return json(res, { ok: true, mock: true });
        let body: {
          action?: string; sheet?: string; key?: string;
          patch?: Record<string, string>; ops?: { key: string; patch: Record<string, string> }[];
          values?: Record<string, string>;
        };
        try {
          body = JSON.parse(await readBody(req));
        } catch {
          return json(res, { ok: false, error: 'Malformed JSON body.' }, 400);
        }

        const tab = body.sheet ?? '';
        const forTab = overlay.get(tab) ?? new Map<string, Record<string, string>>();
        overlay.set(tab, forTab);

        const stamp = (patch: Record<string, string>) => ({
          ...patch,
          'Updated At': new Date().toISOString().slice(0, 19).replace('T', ' '),
        });

        if (body.action === 'update' && body.key) {
          forTab.set(body.key, { ...(forTab.get(body.key) ?? {}), ...stamp(body.patch ?? {}) });
        } else if (body.action === 'batch') {
          for (const op of body.ops ?? []) {
            forTab.set(op.key, { ...(forTab.get(op.key) ?? {}), ...stamp(op.patch) });
          }
        } else if (body.action === 'append') {
          // Appends are not reflected back; the sandbox only models updates.
          return json(res, { ok: true, mock: true, note: 'append not persisted locally' });
        }
        json(res, { ok: true, mock: true });
      });
    },
  };
}

/** Rewrite matching cells of a CSV in place, keyed by the first column. */
function applyOverlay(csv: string, patches?: Map<string, Record<string, string>>): string {
  if (!patches?.size) return csv;
  const bom = csv.startsWith('﻿') ? '﻿' : '';
  const lines = csv.replace(/^﻿/, '').split(/\r?\n/);
  if (!lines.length) return csv;

  const split = (line: string) => {
    const out: string[] = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"') {
          if (line[i + 1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { out.push(field); field = ''; }
      else field += c;
    }
    out.push(field);
    return out;
  };
  const join = (cells: string[]) =>
    cells.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',');

  const headers = split(lines[0]);
  const body = lines.slice(1).map((line) => {
    if (!line.trim()) return line;
    const cells = split(line);
    const patch = patches.get(cells[0]);
    if (!patch) return line;
    for (const [column, value] of Object.entries(patch)) {
      const idx = headers.indexOf(column);
      if (idx >= 0) cells[idx] = value;
    }
    return join(cells);
  });

  return bom + [lines[0], ...body].join('\n');
}

// Relative base so the build works on any static host:
// GitHub Pages project sites (/engosoft-hr/), Vercel, Netlify, or a plain folder.
export default defineConfig({
  base: './',
  plugins: [react(), localData()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
});
