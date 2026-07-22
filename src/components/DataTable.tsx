import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDownUp, ChevronDown, Download, Search } from 'lucide-react';
import { useI18n } from '../i18n/LangProvider';

export interface Column<T> {
  key: string;
  label: string;
  /** Text used for search, sort and CSV export. */
  value: (row: T) => string | number | null;
  /** Rich cell; falls back to `value`. */
  render?: (row: T) => ReactNode;
  align?: 'start' | 'end';
  numeric?: boolean;
  /** Hidden on phones — the table becomes a card list there. */
  desktopOnly?: boolean;
  /** Shown as the card title on phones. */
  primary?: boolean;
}

export interface Facet<T> {
  key: string;
  label: string;
  options: { key: string; label: string }[];
  match: (row: T, optionKey: string) => boolean;
}

const compare = (a: string | number | null, b: string | number | null): number => {
  if (a === null || a === '') return 1; // blanks always sink
  if (b === null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

function toCsv<T>(rows: T[], columns: Column<T>[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => escape(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => escape(c.value(r))).join(',')).join('\n');
  return `﻿${head}\n${body}`; // BOM so Excel reads the Arabic correctly
}

export function DataTable<T>({
  rows,
  columns,
  facets = [],
  getKey,
  title,
  actions,
  expand,
}: {
  rows: T[];
  columns: Column<T>[];
  facets?: Facet<T>[];
  getKey: (row: T) => string;
  title?: string;
  actions?: ReactNode;
  /** Extra detail revealed when a row is opened. */
  expand?: (row: T) => ReactNode;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows;

    for (const facet of facets) {
      const choice = selected[facet.key];
      if (choice && choice !== '__all') out = out.filter((r) => facet.match(r, choice));
    }
    if (q) {
      out = out.filter((r) =>
        columns.some((c) => String(c.value(r) ?? '').toLowerCase().includes(q)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) out = [...out].sort((a, b) => compare(col.value(a), col.value(b)) * sort.dir);
    }
    return out;
  }, [rows, columns, facets, selected, query, sort]);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  const download = () => {
    const blob = new Blob([toCsv(filtered, columns)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'export').replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = query.trim() !== '' ||
    Object.values(selected).some((v) => v && v !== '__all');

  const mobileCols = columns.filter((c) => !c.desktopOnly);
  const primary = columns.find((c) => c.primary) ?? columns[0];

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 p-3.5 sm:p-4">
        {title && <h2 className="me-auto text-[15px] font-bold text-ink-900">{title}</h2>}

        <div className="relative w-full sm:w-56">
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('table.search')}
            aria-label={t('table.search')}
            className="focus-ring min-h-[42px] w-full rounded-xl border border-slate-200 bg-surface-muted
                       ps-9 pe-3 text-[13.5px] placeholder:text-ink-400"
          />
        </div>

        {facets.map((facet) => (
          <div key={facet.key} className="relative">
            <select
              value={selected[facet.key] ?? '__all'}
              onChange={(e) => setSelected((s) => ({ ...s, [facet.key]: e.target.value }))}
              aria-label={facet.label}
              className="focus-ring min-h-[42px] appearance-none rounded-xl border border-slate-200
                         bg-surface-muted ps-3 pe-8 text-[13.5px] font-semibold text-ink-700"
            >
              <option value="__all">{facet.label}: {t('filter.all')}</option>
              {facet.options.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
          </div>
        ))}

        {actions}

        <button
          type="button"
          onClick={download}
          className="focus-ring flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200
                     px-3 text-[13px] font-semibold text-ink-700 hover:bg-surface-muted"
        >
          <Download size={15} />
          <span className="hidden sm:inline">{t('table.export')}</span>
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-[12px] text-ink-400">
        <span className="tnum">
          {t('table.count', { shown: filtered.length, total: rows.length })}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSelected({}); }}
            className="focus-ring rounded-md px-1.5 py-0.5 font-semibold text-brand-600 hover:bg-brand-50"
          >
            {t('table.clear')}
          </button>
        )}
      </div>

      {!filtered.length ? (
        <p className="py-14 text-center text-[13.5px] text-ink-400">{t('table.noResults')}</p>
      ) : (
        <>
          {/* Desktop: a real table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-slate-100 bg-surface-muted/60">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={`px-3 py-2.5 font-bold text-ink-500 ${
                        c.align === 'end' ? 'text-end' : 'text-start'
                      }`}
                      aria-sort={
                        sort?.key === c.key
                          ? sort.dir === 1 ? 'ascending' : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`focus-ring inline-flex items-center gap-1 rounded hover:text-brand-600 ${
                          sort?.key === c.key ? 'text-brand-600' : ''
                        }`}
                      >
                        {c.label}
                        <ArrowDownUp size={11} className={sort?.key === c.key ? '' : 'opacity-30'} />
                      </button>
                    </th>
                  ))}
                  {expand && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const key = getKey(row);
                  return (
                    <tr key={key} className="border-b border-slate-50 last:border-0 hover:bg-surface-muted/50">
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={`px-3 py-2.5 align-top ${c.align === 'end' ? 'text-end' : ''} ${
                            c.numeric ? 'tnum' : ''
                          }`}
                        >
                          {c.render ? c.render(row) : (c.value(row) ?? '—')}
                        </td>
                      ))}
                      {expand && (
                        <td className="px-2 py-2.5 align-top">
                          <button
                            type="button"
                            onClick={() => setOpen(open === key ? null : key)}
                            aria-label={t('table.details')}
                            aria-expanded={open === key}
                            className="focus-ring grid h-7 w-7 place-items-center rounded-lg text-ink-400
                                       hover:bg-surface-muted hover:text-brand-600"
                          >
                            <ChevronDown
                              size={15}
                              className={`transition-transform ${open === key ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {expand && open && (
              <div className="border-t border-slate-100 bg-surface-muted/40 p-4">
                {(() => {
                  const row = filtered.find((r) => getKey(r) === open);
                  return row ? expand(row) : null;
                })()}
              </div>
            )}
          </div>

          {/* Phone: one card per row — a 20-column table is unusable at 375px */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((row) => {
              const key = getKey(row);
              const isOpen = open === key;
              return (
                <li key={key} className="p-3.5">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-2 text-start"
                  >
                    <span className="flex-1 text-[14px] font-bold text-ink-900">
                      {primary.render ? primary.render(row) : (primary.value(row) ?? '—')}
                    </span>
                    <ChevronDown
                      size={17}
                      className={`mt-0.5 shrink-0 text-ink-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {mobileCols
                      .filter((c) => c.key !== primary.key)
                      .slice(0, isOpen ? undefined : 4)
                      .map((c) => (
                        <div key={c.key} className="min-w-0">
                          <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                            {c.label}
                          </dt>
                          <dd className={`truncate text-[13px] text-ink-700 ${c.numeric ? 'tnum' : ''}`}>
                            {c.render ? c.render(row) : (c.value(row) ?? '—')}
                          </dd>
                        </div>
                      ))}
                  </dl>

                  {isOpen && expand && <div className="mt-3">{expand(row)}</div>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
