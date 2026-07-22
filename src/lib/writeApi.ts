import { WRITE_API_TOKEN, WRITE_API_URL } from '../config/domains';
import type { WritePatch } from '../types';

/**
 * Client for the Apps Script write API (see `apps-script/Code.gs`).
 *
 * Requests go out as `text/plain` on purpose: Apps Script cannot answer a CORS
 * preflight, and a text/plain POST is a "simple request" the browser sends
 * without one. The body is still JSON.
 */

export const canWrite = (): boolean => Boolean(WRITE_API_URL && WRITE_API_TOKEN);

interface ApiResponse {
  ok: boolean;
  error?: string;
  [k: string]: unknown;
}

async function call(payload: Record<string, unknown>, timeoutMs = 20000): Promise<ApiResponse> {
  if (!canWrite()) {
    throw new Error('Write API is not configured (VITE_WRITE_API_URL / VITE_WRITE_API_TOKEN).');
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(WRITE_API_URL, {
      method: 'POST',
      // Deliberately text/plain — see the note above.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, token: WRITE_API_TOKEN }),
      signal: ctrl.signal,
      redirect: 'follow',
    });
    const raw = await res.text();
    let json: ApiResponse;
    try {
      json = JSON.parse(raw);
    } catch {
      // A login page instead of JSON means the deployment is not public.
      throw new Error(
        res.status === 200
          ? 'The Apps Script deployment is not shared with "Anyone".'
          : `Write API returned HTTP ${res.status}.`,
      );
    }
    if (!json.ok) throw new Error(json.error || 'The write was rejected.');
    return json;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Timed out talking to the write API.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export interface UpdateArgs {
  sheet: string;
  key: string;
  keyColumn: string;
  patch: WritePatch;
  actor: string;
}

export function updateRow({ sheet, key, keyColumn, patch, actor }: UpdateArgs): Promise<ApiResponse> {
  return call({ action: 'update', sheet, key, keyColumn, patch, actor });
}

export function appendRow(sheet: string, values: WritePatch, actor: string): Promise<ApiResponse> {
  return call({ action: 'append', sheet, values, actor });
}

export interface BatchOp {
  key: string;
  patch: WritePatch;
}

export function batchUpdate(
  sheet: string,
  keyColumn: string,
  ops: BatchOp[],
  actor: string,
): Promise<ApiResponse> {
  return call({ action: 'batch', sheet, keyColumn, ops, actor });
}

/** Cheap reachability probe used by the Settings page. */
export async function ping(): Promise<boolean> {
  if (!WRITE_API_URL) return false;
  try {
    const res = await fetch(`${WRITE_API_URL}?action=ping`, { redirect: 'follow' });
    const json = (await res.json()) as ApiResponse;
    return Boolean(json.ok);
  } catch {
    return false;
  }
}
