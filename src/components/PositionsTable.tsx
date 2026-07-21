import { useMemo, useState } from 'react';
import { ChevronDown, ChevronsUpDown, Download, SlidersHorizontal } from 'lucide-react';
import type { CanonicalKey, SheetRow } from '../types';
import { cellOf, dateOf, has, numOf, textOf, type Dataset } from '../lib/sheets';
import {
  LOCATION, PRIORITY, SENIORITY, STATUS, VACANCY,
  locationKey, priorityKey, seniorityKey, statusKey, vacancyKey,
} from '../config/semantics';
import { formatDate, startOfToday } from '../lib/format';
import { useI18n } from '../i18n/LangProvider';
import { Badge, TextChip } from './primitives';

type Kind = 'no' | 'title' | 'status' | 'priority' | 'seniority' | 'location' | 'vacancy' | 'num' | 'date' | 'money' | 'text';

const PRIMARY: { key: CanonicalKey; kind: Kind }[] = [
  { key: 'no', kind: 'no' },
  { key: 'position', kind: 'title' },
  { key: 'department', kind: 'text' },
  { key: 'status', kind: 'status' },
  { key: 'priority', kind: 'priority' },
  { key: 'seniority', kind: 'seniority' },
  { key: 'location', kind: 'location' },
  { key: 'needed', kind: 'num' },
  { key: 'accepted', kind: 'num' },
  { key: 'vacancyReason', kind: 'vacancy' },
  { key: 'recruiter1', kind: 'text' },
  { key: 'interviewer', kind: 'text' },
  { key: 'activeDate', kind: 'date' },
  { key: 'dueDate', kind: 'date' },
  { key: 'salaryRange', kind: 'text' },
  { key: 'actualSalary', kind: 'money' },
];

const DETAIL_KEYS: CanonicalKey[] = ['feedback', 'action', 'hrValidation', 'recruiter2', 'hireDate', 'validation'];

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 ps-3 pe-8 text-[13px] font-medium text-ink-800 hover:border-brand-300"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute inset-y-0 my-auto h-3.5 w-3.5 text-ink-400" style={{ insetInlineEnd: 9 }} />
    </div>
  );
}

export function PositionsTable({ ds, query }: { ds: Dataset; query: string }) {
  const { t, lang } = useI18n();
  const today = startOfToday();

  const [fStatus, setFStatus] = useState('all');
  const [fDept, setFDept] = useState('all');
  const [fPriority, setFPriority] = useState('all');
  const [fLocation, setFLocation] = useState('all');
  const [fRecruiter, setFRecruiter] = useState('all');
  const [sortKey, setSortKey] = useState<CanonicalKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expanded, setExpanded] = useState<number | null>(null);

  const columns = useMemo(() => {
    const cols = PRIMARY.filter((c) => has(ds, c.key)).map((c) => ({
      ...c,
      header: ds.canonicalHeader[c.key] as string,
    }));
    // Append any live headers not consumed above and not shown in the detail panel.
    const used = new Set<string>(cols.map((c) => c.header));
    DETAIL_KEYS.forEach((k) => { const h = ds.canonicalHeader[k]; if (h) used.add(h); });
    ds.table.headers.forEach((h) => {
      if (!used.has(h)) cols.push({ key: h as CanonicalKey, kind: 'text', header: h });
    });
    return cols;
  }, [ds]);

  const distinct = (key: CanonicalKey) => {
    const s = new Set<string>();
    ds.records.forEach((r) => { const v = textOf(ds, r, key).trim(); if (v) s.add(v); });
    return [...s].sort((a, b) => a.localeCompare(b));
  };
  const depts = useMemo(() => distinct('department'), [ds]);
  const recruiters = useMemo(() => distinct('recruiter1'), [ds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ds.records.filter((r) => {
      if (fStatus !== 'all' && statusKey(textOf(ds, r, 'status')) !== fStatus) return false;
      if (fDept !== 'all' && textOf(ds, r, 'department').trim() !== fDept) return false;
      if (fPriority !== 'all' && priorityKey(textOf(ds, r, 'priority')) !== fPriority) return false;
      if (fLocation !== 'all' && locationKey(textOf(ds, r, 'location')) !== fLocation) return false;
      if (fRecruiter !== 'all' && textOf(ds, r, 'recruiter1').trim() !== fRecruiter) return false;
      if (q) {
        const hay = [
          textOf(ds, r, 'position'), textOf(ds, r, 'department'), textOf(ds, r, 'recruiter1'),
          textOf(ds, r, 'interviewer'), textOf(ds, r, 'feedback'),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortKey) {
      const dir = sortDir === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const ca = cellOf(ds, a, sortKey);
        const cb = cellOf(ds, b, sortKey);
        if (ca?.num != null && cb?.num != null) return (ca.num - cb.num) * dir;
        if (ca?.date && cb?.date) return (ca.date.getTime() - cb.date.getTime()) * dir;
        return (ca?.text ?? '').localeCompare(cb?.text ?? '') * dir;
      });
    }
    return list;
  }, [ds, query, fStatus, fDept, fPriority, fLocation, fRecruiter, sortKey, sortDir]);

  const toggleSort = (key: CanonicalKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const clearFilters = () => {
    setFStatus('all'); setFDept('all'); setFPriority('all'); setFLocation('all'); setFRecruiter('all');
  };

  const exportCsv = () => {
    const headers = ds.table.headers;
    const esc = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.map(esc).join(',')];
    filtered.forEach((r) => {
      lines.push(headers.map((h) => esc(r.cells[h]?.text ?? '')).join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engosoft-${ds.table.sheet}-positions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCell = (r: SheetRow, col: { kind: Kind; key: CanonicalKey; header: string }) => {
    const { kind, key, header } = col;
    switch (kind) {
      case 'no':
        return <span className="text-ink-400 tnum">{textOf(ds, r, key)}</span>;
      case 'title':
        return <span className="font-semibold text-ink-900">{textOf(ds, r, key) || '—'}</span>;
      case 'status':
        return <Badge meta={STATUS[statusKey(textOf(ds, r, key))]} lang={lang} />;
      case 'priority': {
        const k = priorityKey(textOf(ds, r, key));
        return k === 'other' ? <span className="text-ink-300">—</span> : <Badge meta={PRIORITY[k]} lang={lang} />;
      }
      case 'seniority': {
        const k = seniorityKey(textOf(ds, r, key));
        const m = SENIORITY[k];
        return k === 'other' ? <span className="text-ink-300">—</span> : <TextChip color={m.color}>{lang === 'ar' ? m.ar : m.en}</TextChip>;
      }
      case 'location': {
        const k = locationKey(textOf(ds, r, key));
        const m = LOCATION[k];
        return k === 'other' ? <span className="text-ink-300">—</span> : <TextChip color={m.color}>{lang === 'ar' ? m.ar : m.en}</TextChip>;
      }
      case 'vacancy': {
        const k = vacancyKey(textOf(ds, r, key));
        const m = VACANCY[k];
        return k === 'other' ? <span className="text-ink-300">—</span> : <TextChip color={m.color}>{lang === 'ar' ? m.ar : m.en}</TextChip>;
      }
      case 'num': {
        const n = numOf(ds, r, key);
        return <span className="tnum text-ink-800">{n ?? '—'}</span>;
      }
      case 'date': {
        const d = dateOf(ds, r, key);
        const overdue = key === 'dueDate' && d && d < today && statusKey(textOf(ds, r, 'status')) !== 'done';
        return <span className={`tnum ${overdue ? 'font-semibold text-state-overdue' : 'text-ink-600'}`}>{formatDate(d, lang)}</span>;
      }
      case 'money':
        return <span className="tnum text-ink-800">{textOf(ds, r, key) || '—'}</span>;
      default:
        return <span className="text-ink-600">{r.cells[header]?.text || '—'}</span>;
    }
  };

  const anyFilter = fStatus !== 'all' || fDept !== 'all' || fPriority !== 'all' || fLocation !== 'all' || fRecruiter !== 'all';
  const detailCols = DETAIL_KEYS.filter((k) => has(ds, k));

  return (
    <div className="card overflow-hidden">
      {/* Filter bar */}
      <div className="border-b border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink-700">
          <SlidersHorizontal size={15} className="text-brand-600" />
          {t('positions.title')}
          <span className="ms-auto text-[12px] font-normal text-ink-400">
            {t('positions.count', { shown: filtered.length, total: ds.records.length })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select label={t('filter.status')} value={fStatus} onChange={setFStatus}
            options={[{ v: 'all', l: `${t('filter.status')}: ${t('filter.all')}` }, ...['active', 'hold', 'done'].map((k) => ({ v: k, l: STATUS[k][lang] }))]} />
          {has(ds, 'department') && (
            <Select label={t('filter.department')} value={fDept} onChange={setFDept}
              options={[{ v: 'all', l: `${t('filter.department')}: ${t('filter.all')}` }, ...depts.map((d) => ({ v: d, l: d }))]} />
          )}
          {has(ds, 'priority') && (
            <Select label={t('filter.priority')} value={fPriority} onChange={setFPriority}
              options={[{ v: 'all', l: `${t('filter.priority')}: ${t('filter.all')}` }, ...['top', 'med', 'normal'].map((k) => ({ v: k, l: PRIORITY[k][lang] }))]} />
          )}
          {has(ds, 'location') && (
            <Select label={t('filter.location')} value={fLocation} onChange={setFLocation}
              options={[{ v: 'all', l: `${t('filter.location')}: ${t('filter.all')}` }, ...['eg', 'ksa'].map((k) => ({ v: k, l: LOCATION[k][lang] }))]} />
          )}
          {has(ds, 'recruiter1') && (
            <Select label={t('filter.recruiter')} value={fRecruiter} onChange={setFRecruiter}
              options={[{ v: 'all', l: `${t('filter.recruiter')}: ${t('filter.all')}` }, ...recruiters.map((d) => ({ v: d, l: d }))]} />
          )}
          <div className="flex gap-2">
            {anyFilter && (
              <button onClick={clearFilters} className="focus-ring flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-ink-600 hover:bg-surface-muted">
                {t('positions.clear')}
              </button>
            )}
            <button onClick={exportCsv} className="focus-ring flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-ink-700 hover:bg-surface-muted" title={t('positions.export')}>
              <Download size={14} /> <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-start text-[13px]">
          <thead>
            <tr className="border-b border-slate-100 bg-surface-muted/60">
              <th className="w-8" />
              {columns.map((c) => (
                <th
                  key={c.header}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-start text-[11.5px] font-bold uppercase tracking-wide text-ink-500 hover:text-brand-600"
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    <ChevronsUpDown size={12} className={sortKey === c.key ? 'text-brand-600' : 'text-ink-300'} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.flatMap((r) => {
              const isOpen = expanded === r.index;
              const out = [
                <tr key={r.index} className="group border-b border-slate-50 last:border-0 hover:bg-brand-50/40">
                  <td className="ps-3">
                    {detailCols.length > 0 && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : r.index)}
                        className="focus-ring grid h-6 w-6 place-items-center rounded-md text-ink-400 hover:bg-white hover:text-brand-600"
                        aria-label={t('positions.expand')}
                      >
                        <ChevronDown size={15} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </td>
                  {columns.map((c) => (
                    <td key={c.header} className="whitespace-nowrap px-3 py-2.5 align-middle">
                      {renderCell(r, c)}
                    </td>
                  ))}
                </tr>,
              ];
              if (isOpen && detailCols.length > 0) {
                out.push(
                  <tr key={`d-${r.index}`} className="bg-surface-muted/50">
                    <td />
                    <td colSpan={columns.length} className="px-4 py-3">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {detailCols.map((k) => {
                          const val = k === 'hireDate' ? formatDate(dateOf(ds, r, k), lang) : textOf(ds, r, k);
                          if (!val || val === '—') return null;
                          return (
                            <div key={k} className="rounded-xl border border-slate-100 bg-white p-3">
                              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                                {ds.canonicalHeader[k]}
                              </div>
                              <div className="text-[12.5px] leading-relaxed text-ink-700">{val}</div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>,
                );
              }
              return out;
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-14 text-center text-sm text-ink-400">{t('positions.noResults')}</div>
      )}
    </div>
  );
}
