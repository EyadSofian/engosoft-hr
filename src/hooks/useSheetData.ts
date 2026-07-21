import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SheetTable, TabInfo } from '../types';
import { FALLBACK_TABS, REFRESH_SECONDS, SHEET_ID } from '../config/sheet';
import { buildDataset, discoverTabs, loadSheetTable, type Dataset } from '../lib/sheets';
import { computeAnalytics, type Analytics } from '../lib/analytics';

export interface SheetState {
  tabs: TabInfo[];
  activeSheet: string;
  setActiveSheet: (s: string) => void;
  table: SheetTable | null;
  dataset: Dataset | null;
  analytics: Analytics | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastSync: number | null;
  refresh: () => void;
}

export function useSheetData(): SheetState {
  const [tabs, setTabs] = useState<TabInfo[]>(FALLBACK_TABS);
  const [activeSheet, setActiveSheet] = useState<string>(FALLBACK_TABS[0]?.sheet ?? '');
  const [table, setTable] = useState<SheetTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);

  const reqId = useRef(0);

  // Discover tabs once (auto if an API key is set, else the configured fallback).
  useEffect(() => {
    let alive = true;
    discoverTabs(SHEET_ID)
      .then((ts) => {
        if (!alive || !ts.length) return;
        setTabs(ts);
        setActiveSheet((cur) => (ts.some((t) => t.sheet === cur) ? cur : ts[0].sheet));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(async (sheet: string, silent: boolean) => {
    if (!sheet) return;
    const id = ++reqId.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const tbl = await loadSheetTable(SHEET_ID, sheet);
      if (id !== reqId.current) return; // a newer request superseded this one
      setTable(tbl);
      setLastSync(Date.now());
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : String(e));
      if (!silent) setTable(null);
    } finally {
      if (id === reqId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Load whenever the active tab changes.
  useEffect(() => {
    load(activeSheet, false);
  }, [activeSheet, load]);

  // Poll for live sync.
  useEffect(() => {
    if (!REFRESH_SECONDS) return;
    const id = setInterval(() => load(activeSheet, true), REFRESH_SECONDS * 1000);
    return () => clearInterval(id);
  }, [activeSheet, load]);

  const dataset = useMemo(() => (table ? buildDataset(table) : null), [table]);
  const analytics = useMemo(() => (dataset ? computeAnalytics(dataset) : null), [dataset]);

  const refresh = useCallback(() => load(activeSheet, !!table), [activeSheet, load, table]);

  return {
    tabs, activeSheet, setActiveSheet, table, dataset, analytics,
    loading, refreshing, error, lastSync, refresh,
  };
}
