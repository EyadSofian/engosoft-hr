import type { SheetRow } from '../types';
import {
  Dataset, dateOf, has, numOf, textOf,
} from './sheets';
import {
  LOCATION, PRIORITY, SENIORITY, STATUS, VACANCY,
  deptColor, locationKey, priorityKey, seniorityKey, stageState, statusKey, vacancyKey,
} from '../config/semantics';
import { daysBetween, mean, median, parseComp, startOfToday } from './format';

export interface Slice { key: string; value: number }
export interface NamedSlice { name: string; value: number; color: string }

export interface DeptStat {
  name: string; total: number; active: number; hold: number; done: number;
  needed: number; accepted: number; color: string;
}
export interface RecruiterStat {
  name: string; total: number; active: number; hold: number; done: number;
  needed: number; accepted: number;
}
export interface PipelineStage { key: string; value: number }

export interface Analytics {
  total: number;
  needed: number;
  accepted: number;
  fillRate: number | null;
  active: number;
  hold: number;
  done: number;
  overdue: number;
  overdueRows: SheetRow[];

  byStatus: Slice[];
  byPriority: Slice[];
  bySeniority: Slice[];
  byLocation: Slice[];
  byVacancy: Slice[];
  byDepartment: DeptStat[];
  byRecruiter: RecruiterStat[];
  byInterviewer: NamedSlice[];
  pipeline: PipelineStage[];

  comp: {
    count: number; median: number | null; mean: number | null; min: number | null; max: number | null;
    byDept: { name: string; median: number; count: number; color: string }[];
  };
  planWindowAvg: number | null; // avg planned days (active → due)
  timeToHire: { count: number; avg: number | null };

  flags: {
    department: boolean; priority: boolean; seniority: boolean; location: boolean;
    vacancy: boolean; recruiter: boolean; interviewer: boolean; pipeline: boolean;
    accepted: boolean; salary: boolean; dates: boolean;
  };
}

function bump<T extends string>(map: Map<T, number>, key: T, by = 1) {
  map.set(key, (map.get(key) || 0) + by);
}

function orderedSlices(counts: Map<string, number>, order: Record<string, unknown>): Slice[] {
  const out: Slice[] = [];
  Object.keys(order).forEach((k) => {
    const v = counts.get(k) || 0;
    if (k === 'other' && v === 0) return;
    out.push({ key: k, value: v });
  });
  return out;
}

export function computeAnalytics(ds: Dataset): Analytics {
  const rows = ds.records;
  const today = startOfToday();

  const statusCounts = new Map<string, number>();
  const priorityCounts = new Map<string, number>();
  const seniorityCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  const vacancyCounts = new Map<string, number>();
  const depts = new Map<string, DeptStat>();
  const recruiters = new Map<string, RecruiterStat>();
  const interviewers = new Map<string, number>();

  let needed = 0;
  let accepted = 0;
  let overdue = 0;
  const overdueRows: SheetRow[] = [];

  const stageDone = { reqReceived: 0, published: 0, candidateReceived: 0 };
  const compAmounts: number[] = [];
  const compByDept = new Map<string, number[]>();
  const planWindows: number[] = [];
  const hireDurations: number[] = [];

  const hasAccepted = has(ds, 'accepted');

  for (const r of rows) {
    const sKey = statusKey(textOf(ds, r, 'status'));
    bump(statusCounts, sKey);

    bump(priorityCounts, priorityKey(textOf(ds, r, 'priority')));
    bump(seniorityCounts, seniorityKey(textOf(ds, r, 'seniority')));
    bump(locationCounts, locationKey(textOf(ds, r, 'location')));
    bump(vacancyCounts, vacancyKey(textOf(ds, r, 'vacancyReason')));

    const n = numOf(ds, r, 'needed');
    if (n && n > 0) needed += n;

    const a = numOf(ds, r, 'accepted');
    if (hasAccepted && a && a > 0) accepted += a;

    // Department roll-up
    const dept = textOf(ds, r, 'department').trim();
    if (dept) {
      const d = depts.get(dept) || {
        name: dept, total: 0, active: 0, hold: 0, done: 0, needed: 0, accepted: 0, color: deptColor(dept),
      };
      d.total += 1;
      if (sKey === 'active') d.active += 1;
      else if (sKey === 'hold') d.hold += 1;
      else if (sKey === 'done') d.done += 1;
      if (n && n > 0) d.needed += n;
      if (a && a > 0) d.accepted += a;
      depts.set(dept, d);
    }

    // Recruiter roll-up (Assigned to I)
    const rec = textOf(ds, r, 'recruiter1').trim();
    if (rec) {
      const rr = recruiters.get(rec) || {
        name: rec, total: 0, active: 0, hold: 0, done: 0, needed: 0, accepted: 0,
      };
      rr.total += 1;
      if (sKey === 'active') rr.active += 1;
      else if (sKey === 'hold') rr.hold += 1;
      else if (sKey === 'done') rr.done += 1;
      if (n && n > 0) rr.needed += n;
      if (a && a > 0) rr.accepted += a;
      recruiters.set(rec, rr);
    }

    const intv = textOf(ds, r, 'interviewer').trim();
    if (intv) bump(interviewers, intv);

    // Pipeline stages
    if (stageState(textOf(ds, r, 'reqReceived')) === 'done') stageDone.reqReceived += 1;
    if (stageState(textOf(ds, r, 'published')) === 'done') stageDone.published += 1;
    if (stageState(textOf(ds, r, 'candidateReceived')) === 'done') stageDone.candidateReceived += 1;

    // Overdue: past due & not done
    const due = dateOf(ds, r, 'dueDate');
    if (due && sKey !== 'done' && due < today) {
      overdue += 1;
      overdueRows.push(r);
    }

    // Planned window & actual time-to-hire
    const activeD = dateOf(ds, r, 'activeDate');
    if (activeD && due) {
      const w = daysBetween(activeD, due);
      if (w >= 0 && w < 400) planWindows.push(w);
    }
    const hireD = dateOf(ds, r, 'hireDate');
    if (activeD && hireD) {
      const w = daysBetween(activeD, hireD);
      if (w >= 0 && w < 400) hireDurations.push(w);
    }

    // Compensation (EGP monthly only)
    const comp = parseComp(textOf(ds, r, 'actualSalary'));
    if (comp.isMonthlyEgp && comp.amount) {
      compAmounts.push(comp.amount);
      if (dept) {
        const arr = compByDept.get(dept) || [];
        arr.push(comp.amount);
        compByDept.set(dept, arr);
      }
    }
  }

  const active = statusCounts.get('active') || 0;
  const hold = statusCounts.get('hold') || 0;
  const done = statusCounts.get('done') || 0;
  if (!hasAccepted) accepted = done; // fall back to closed count

  const fillRate = needed > 0 ? (accepted / needed) * 100 : null;

  const byDepartment = [...depts.values()].sort((a, b) => b.total - a.total);
  const byRecruiter = [...recruiters.values()].sort((a, b) => b.total - a.total);
  const byInterviewer = [...interviewers.entries()]
    .map(([name, value]) => ({ name, value, color: deptColor(name) }))
    .sort((a, b) => b.value - a.value);

  const compByDeptArr = [...compByDept.entries()]
    .map(([name, arr]) => ({ name, median: median(arr) as number, count: arr.length, color: deptColor(name) }))
    .filter((d) => d.median !== null)
    .sort((a, b) => b.median - a.median);

  const pipeline: PipelineStage[] = [
    { key: 'reqReceived', value: stageDone.reqReceived },
    { key: 'published', value: stageDone.published },
    { key: 'candidateReceived', value: stageDone.candidateReceived },
    { key: 'accepted', value: accepted },
  ];

  return {
    total: rows.length,
    needed,
    accepted,
    fillRate,
    active,
    hold,
    done,
    overdue,
    overdueRows,

    byStatus: orderedSlices(statusCounts, STATUS),
    byPriority: orderedSlices(priorityCounts, PRIORITY),
    bySeniority: orderedSlices(seniorityCounts, SENIORITY),
    byLocation: orderedSlices(locationCounts, LOCATION),
    byVacancy: orderedSlices(vacancyCounts, VACANCY),
    byDepartment,
    byRecruiter,
    byInterviewer,
    pipeline,

    comp: {
      count: compAmounts.length,
      median: median(compAmounts),
      mean: mean(compAmounts),
      min: compAmounts.length ? Math.min(...compAmounts) : null,
      max: compAmounts.length ? Math.max(...compAmounts) : null,
      byDept: compByDeptArr,
    },
    planWindowAvg: mean(planWindows),
    timeToHire: { count: hireDurations.length, avg: mean(hireDurations) },

    flags: {
      department: has(ds, 'department') && byDepartment.length > 0,
      priority: has(ds, 'priority'),
      seniority: has(ds, 'seniority'),
      location: has(ds, 'location'),
      vacancy: has(ds, 'vacancyReason') && vacancyCounts.size > 0,
      recruiter: has(ds, 'recruiter1') && byRecruiter.length > 0,
      interviewer: has(ds, 'interviewer') && byInterviewer.length > 0,
      pipeline: has(ds, 'reqReceived') || has(ds, 'published') || has(ds, 'candidateReceived'),
      accepted: hasAccepted,
      salary: compAmounts.length > 0,
      dates: has(ds, 'activeDate') && has(ds, 'dueDate'),
    },
  };
}
