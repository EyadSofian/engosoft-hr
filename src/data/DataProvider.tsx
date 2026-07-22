import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import type { CellValue, Dataset, DomainId, PendingEdit, SheetRow, WritePatch } from '../types';
import { DOMAINS, REFRESH_SECONDS } from '../config/domains';
import { loadTable } from '../lib/loader';
import { buildDataset } from '../lib/rows';
import { appendRow, canWrite, updateRow, batchUpdate, type BatchOp } from '../lib/writeApi';

interface DomainState {
  dataset: Dataset | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastSync: number | null;
}

const IDLE: DomainState = {
  dataset: null, loading: false, refreshing: false, error: null, lastSync: null,
};

interface DataContextValue {
  get: (id: DomainId) => DomainState;
  /** Marks a domain as needed; the first call triggers the fetch. */
  request: (id: DomainId) => void;
  refresh: (id?: DomainId) => void;
  edit: (id: DomainId, key: string, patch: WritePatch) => Promise<boolean>;
  editMany: (id: DomainId, ops: BatchOp[]) => Promise<boolean>;
  append: (id: DomainId, values: WritePatch, label?: string) => Promise<boolean>;
  pending: PendingEdit[];
  dismiss: (key: string) => void;
  actor: string;
  setActor: (name: string) => void;
  writable: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

/** Overlay an optimistic patch onto a fetched row so the UI updates instantly. */
function patchRow(row: SheetRow, patch: WritePatch): SheetRow {
  const cells = { ...row.cells };
  for (const [column, value] of Object.entries(patch)) {
    const text = String(value);
    const nextNum = typeof value === 'number' ? value : null;
    const prev: CellValue | undefined = cells[column];
    cells[column] = {
      raw: value,
      text,
      num: nextNum,
      // Keep the previous date if the column is a date we did not touch.
      date: nextNum === null && prev?.type === 'date' ? prev.date : null,
      type: text === '' ? 'empty' : typeof value === 'number' ? 'number' : 'string',
    };
  }
  return { ...row, cells };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Partial<Record<DomainId, DomainState>>>({});
  const [edits, setEdits] = useState<Record<string, WritePatch>>({});
  const [pending, setPending] = useState<PendingEdit[]>([]);
  const [actor, setActorRaw] = useState<string>(
    () => localStorage.getItem('engosoft.actor') || '',
  );

  const wanted = useRef<Set<DomainId>>(new Set());
  const reqId = useRef<Partial<Record<DomainId, number>>>({});

  const setActor = useCallback((name: string) => {
    setActorRaw(name);
    localStorage.setItem('engosoft.actor', name);
  }, []);

  const patchState = useCallback((id: DomainId, next: Partial<DomainState>) => {
    setStates((s) => ({ ...s, [id]: { ...(s[id] ?? IDLE), ...next } }));
  }, []);

  const load = useCallback(async (id: DomainId, silent: boolean) => {
    const spec = DOMAINS[id];
    const myId = (reqId.current[id] ?? 0) + 1;
    reqId.current[id] = myId;

    patchState(id, silent ? { refreshing: true } : { loading: true, error: null });
    try {
      const table = await loadTable(spec.tab);
      if (reqId.current[id] !== myId) return;
      patchState(id, {
        dataset: buildDataset(spec, table),
        loading: false,
        refreshing: false,
        error: null,
        lastSync: Date.now(),
      });
      // The sheet is now authoritative for anything we had queued locally.
      setEdits((e) => {
        const next = { ...e };
        for (const k of Object.keys(next)) if (k.startsWith(`${id}:`)) delete next[k];
        return next;
      });
    } catch (e) {
      if (reqId.current[id] !== myId) return;
      patchState(id, {
        loading: false,
        refreshing: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [patchState]);

  const request = useCallback((id: DomainId) => {
    if (wanted.current.has(id)) return;
    wanted.current.add(id);
    load(id, false);
  }, [load]);

  const refresh = useCallback((id?: DomainId) => {
    const targets = id ? [id] : [...wanted.current];
    targets.forEach((t) => load(t, true));
  }, [load]);

  // Poll only the domains that have actually been opened.
  useEffect(() => {
    if (!REFRESH_SECONDS) return;
    const timer = setInterval(() => {
      wanted.current.forEach((id) => load(id, true));
    }, REFRESH_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [load]);

  const track = useCallback((entry: PendingEdit) => {
    setPending((p) => [entry, ...p].slice(0, 8));
    if (entry.state === 'saved') {
      setTimeout(() => setPending((p) => p.filter((x) => x !== entry)), 2600);
    }
  }, []);

  const edit = useCallback(async (id: DomainId, key: string, patch: WritePatch) => {
    const spec = DOMAINS[id];
    const editKey = `${id}:${key}`;
    setEdits((e) => ({ ...e, [editKey]: { ...(e[editKey] ?? {}), ...patch } }));

    const entry: PendingEdit = { domain: id, key, patch, at: Date.now(), state: 'saving' };
    track(entry);

    try {
      await updateRow({
        sheet: spec.tab, key, keyColumn: spec.keyColumn, patch,
        actor: actor || 'dashboard',
      });
      setPending((p) => p.map((x) => (x === entry ? { ...x, state: 'saved' } : x)));
      setTimeout(() => setPending((p) => p.filter((x) => x.at !== entry.at)), 2600);
      // Re-read so any formula the sheet recalculated comes back.
      setTimeout(() => load(id, true), 900);
      return true;
    } catch (e) {
      // Roll the optimistic value back — the sheet never took it.
      setEdits((prev) => {
        const next = { ...prev };
        delete next[editKey];
        return next;
      });
      setPending((p) =>
        p.map((x) => (x === entry
          ? { ...x, state: 'failed', error: e instanceof Error ? e.message : String(e) }
          : x)));
      return false;
    }
  }, [actor, load, track]);

  const editMany = useCallback(async (id: DomainId, ops: BatchOp[]) => {
    if (!ops.length) return true;
    const spec = DOMAINS[id];
    setEdits((e) => {
      const next = { ...e };
      for (const op of ops) {
        const k = `${id}:${op.key}`;
        next[k] = { ...(next[k] ?? {}), ...op.patch };
      }
      return next;
    });

    const entry: PendingEdit = {
      domain: id, key: `${ops.length} rows`, patch: {}, at: Date.now(), state: 'saving',
    };
    track(entry);

    try {
      await batchUpdate(spec.tab, spec.keyColumn, ops, actor || 'dashboard');
      setPending((p) => p.map((x) => (x === entry ? { ...x, state: 'saved' } : x)));
      setTimeout(() => setPending((p) => p.filter((x) => x.at !== entry.at)), 2600);
      setTimeout(() => load(id, true), 900);
      return true;
    } catch (e) {
      setEdits((prev) => {
        const next = { ...prev };
        for (const op of ops) delete next[`${id}:${op.key}`];
        return next;
      });
      setPending((p) =>
        p.map((x) => (x === entry
          ? { ...x, state: 'failed', error: e instanceof Error ? e.message : String(e) }
          : x)));
      return false;
    }
  }, [actor, load, track]);

  const append = useCallback(async (id: DomainId, values: WritePatch, label?: string) => {
    const spec = DOMAINS[id];
    const entry: PendingEdit = {
      domain: id, key: label ?? spec.tab, patch: values, at: Date.now(), state: 'saving',
    };
    track(entry);
    try {
      await appendRow(spec.tab, values, actor || 'dashboard');
      setPending((p) => p.map((x) => (x === entry ? { ...x, state: 'saved' } : x)));
      setTimeout(() => setPending((p) => p.filter((x) => x.at !== entry.at)), 2600);
      // No optimistic row to reconcile — just pull the new one back.
      setTimeout(() => load(id, true), 900);
      return true;
    } catch (e) {
      setPending((p) =>
        p.map((x) => (x === entry
          ? { ...x, state: 'failed', error: e instanceof Error ? e.message : String(e) }
          : x)));
      return false;
    }
  }, [actor, load, track]);

  const dismiss = useCallback((key: string) => {
    setPending((p) => p.filter((x) => `${x.domain}:${x.key}:${x.at}` !== key));
  }, []);

  // Apply the optimistic overlay on read, so pages never see stale values.
  const get = useCallback((id: DomainId): DomainState => {
    const state = states[id] ?? IDLE;
    if (!state.dataset) return state;
    const prefix = `${id}:`;
    const relevant = Object.keys(edits).filter((k) => k.startsWith(prefix));
    if (!relevant.length) return state;

    const keyColumn = state.dataset.spec.keyColumn;
    const byKey = new Map(relevant.map((k) => [k.slice(prefix.length), edits[k]]));
    const rows = state.dataset.rows.map((r) => {
      const patch = byKey.get((r.cells[keyColumn]?.text ?? '').trim());
      return patch ? patchRow(r, patch) : r;
    });
    return { ...state, dataset: { ...state.dataset, rows } };
  }, [states, edits]);

  const value = useMemo<DataContextValue>(() => ({
    get, request, refresh, edit, editMany, append, pending, dismiss, actor, setActor,
    writable: canWrite(),
  }), [get, request, refresh, edit, editMany, append, pending, dismiss, actor, setActor]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>.');
  return ctx;
}

/** Subscribe to one domain; requests it on first render. */
export function useDomain(id: DomainId): DomainState {
  const { get, request } = useData();
  useEffect(() => { request(id); }, [id, request]);
  return get(id);
}
