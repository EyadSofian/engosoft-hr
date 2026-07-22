import type { Dataset, SheetRow } from '../types';
import { countBy, date, has, num, pct, text, toSlices, type Slice } from './rows';
import {
  LOCATION, PRIORITY, SENIORITY, STATUS, VACANCY,
  deptColor, locationKey, priorityKey, seniorityKey, stageState, statusKey, vacancyKey,
} from '../config/semantics';
import { daysBetween, mean, median, parseComp, startOfToday } from './format';

export interface KeyedSlice { key: string; value: number }

function bump(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) || 0) + by);
}

function orderedSlices(counts: Map<string, number>, order: Record<string, unknown>): KeyedSlice[] {
  return Object.keys(order)
    .map((k) => ({ key: k, value: counts.get(k) || 0 }))
    .filter((s) => s.key !== 'other' || s.value > 0);
}

// ── Recruitment ───────────────────────────────────────────────

export interface DeptStat {
  name: string; total: number; active: number; hold: number; done: number;
  needed: number; accepted: number; color: string;
}
export interface RecruiterStat {
  name: string; total: number; active: number; hold: number; done: number;
  needed: number; accepted: number; fillRate: number | null;
}

export interface RecruitmentAnalytics {
  total: number; needed: number; accepted: number; fillRate: number | null;
  active: number; hold: number; done: number;
  overdue: number; overdueRows: SheetRow[];
  byStatus: KeyedSlice[]; byPriority: KeyedSlice[]; bySeniority: KeyedSlice[];
  byLocation: KeyedSlice[]; byVacancy: KeyedSlice[];
  byDepartment: DeptStat[]; byRecruiter: RecruiterStat[];
  byInterviewer: { name: string; value: number; color: string }[];
  pipeline: KeyedSlice[];
  comp: {
    count: number; median: number | null; mean: number | null;
    min: number | null; max: number | null;
    byDept: { name: string; median: number; count: number; color: string }[];
  };
  planWindowAvg: number | null;
  timeToHire: { count: number; avg: number | null };
  flags: Record<string, boolean>;
}

export function recruitmentAnalytics(ds: Dataset): RecruitmentAnalytics {
  const rows = ds.rows;
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
  const overdueRows: SheetRow[] = [];
  const stageDone = { reqReceived: 0, published: 0, candidateReceived: 0 };
  const compAmounts: number[] = [];
  const compByDept = new Map<string, number[]>();
  const planWindows: number[] = [];
  const hireDurations: number[] = [];

  const hasAccepted = has(ds, 'accepted');

  for (const r of rows) {
    const sKey = statusKey(text(ds, r, 'status'));
    bump(statusCounts, sKey);
    bump(priorityCounts, priorityKey(text(ds, r, 'priority')));
    bump(seniorityCounts, seniorityKey(text(ds, r, 'seniority')));
    bump(locationCounts, locationKey(text(ds, r, 'location')));
    bump(vacancyCounts, vacancyKey(text(ds, r, 'vacancyReason')));

    const n = num(ds, r, 'needed');
    if (n && n > 0) needed += n;
    const a = num(ds, r, 'accepted');
    if (hasAccepted && a && a > 0) accepted += a;

    const dept = text(ds, r, 'department');
    if (dept) {
      const d = depts.get(dept) ?? {
        name: dept, total: 0, active: 0, hold: 0, done: 0, needed: 0, accepted: 0,
        color: deptColor(dept),
      };
      d.total += 1;
      if (sKey === 'active') d.active += 1;
      else if (sKey === 'hold') d.hold += 1;
      else if (sKey === 'done') d.done += 1;
      if (n && n > 0) d.needed += n;
      if (a && a > 0) d.accepted += a;
      depts.set(dept, d);
    }

    const rec = text(ds, r, 'recruiter1');
    if (rec) {
      const rr = recruiters.get(rec) ?? {
        name: rec, total: 0, active: 0, hold: 0, done: 0, needed: 0, accepted: 0, fillRate: null,
      };
      rr.total += 1;
      if (sKey === 'active') rr.active += 1;
      else if (sKey === 'hold') rr.hold += 1;
      else if (sKey === 'done') rr.done += 1;
      if (n && n > 0) rr.needed += n;
      if (a && a > 0) rr.accepted += a;
      recruiters.set(rec, rr);
    }

    const intv = text(ds, r, 'interviewer');
    if (intv) bump(interviewers, intv);

    if (stageState(text(ds, r, 'reqReceived')) === 'done') stageDone.reqReceived += 1;
    if (stageState(text(ds, r, 'published')) === 'done') stageDone.published += 1;
    if (stageState(text(ds, r, 'candidateReceived')) === 'done') stageDone.candidateReceived += 1;

    const due = date(ds, r, 'dueDate');
    if (due && sKey !== 'done' && due < today) overdueRows.push(r);

    const activeD = date(ds, r, 'activeDate');
    if (activeD && due) {
      const w = daysBetween(activeD, due);
      if (w >= 0 && w < 400) planWindows.push(w);
    }
    const hireD = date(ds, r, 'hireDate');
    if (activeD && hireD) {
      const w = daysBetween(activeD, hireD);
      if (w >= 0 && w < 400) hireDurations.push(w);
    }

    const comp = parseComp(text(ds, r, 'actualSalary'));
    if (comp.isMonthlyEgp && comp.amount) {
      compAmounts.push(comp.amount);
      if (dept) compByDept.set(dept, [...(compByDept.get(dept) ?? []), comp.amount]);
    }
  }

  const active = statusCounts.get('active') || 0;
  const hold = statusCounts.get('hold') || 0;
  const done = statusCounts.get('done') || 0;
  if (!hasAccepted) accepted = done; // fall back to the closed count

  for (const rr of recruiters.values()) {
    rr.fillRate = rr.needed > 0 ? pct(rr.accepted, rr.needed) : null;
  }

  return {
    total: rows.length,
    needed,
    accepted,
    fillRate: needed > 0 ? pct(accepted, needed) : null,
    active, hold, done,
    overdue: overdueRows.length,
    overdueRows,
    byStatus: orderedSlices(statusCounts, STATUS),
    byPriority: orderedSlices(priorityCounts, PRIORITY),
    bySeniority: orderedSlices(seniorityCounts, SENIORITY),
    byLocation: orderedSlices(locationCounts, LOCATION),
    byVacancy: orderedSlices(vacancyCounts, VACANCY),
    byDepartment: [...depts.values()].sort((a, b) => b.total - a.total),
    byRecruiter: [...recruiters.values()].sort((a, b) => b.total - a.total),
    byInterviewer: [...interviewers.entries()]
      .map(([name, value]) => ({ name, value, color: deptColor(name) }))
      .sort((a, b) => b.value - a.value),
    pipeline: [
      { key: 'reqReceived', value: stageDone.reqReceived },
      { key: 'published', value: stageDone.published },
      { key: 'candidateReceived', value: stageDone.candidateReceived },
      { key: 'accepted', value: accepted },
    ],
    comp: {
      count: compAmounts.length,
      median: median(compAmounts),
      mean: mean(compAmounts),
      min: compAmounts.length ? Math.min(...compAmounts) : null,
      max: compAmounts.length ? Math.max(...compAmounts) : null,
      byDept: [...compByDept.entries()]
        .map(([name, arr]) => ({
          name, median: median(arr) as number, count: arr.length, color: deptColor(name),
        }))
        .filter((d) => d.median !== null)
        .sort((a, b) => b.median - a.median),
    },
    planWindowAvg: mean(planWindows),
    timeToHire: { count: hireDurations.length, avg: mean(hireDurations) },
    flags: {
      department: has(ds, 'department') && depts.size > 0,
      priority: has(ds, 'priority'),
      seniority: has(ds, 'seniority'),
      location: has(ds, 'location'),
      vacancy: has(ds, 'vacancyReason') && vacancyCounts.size > 0,
      recruiter: has(ds, 'recruiter1') && recruiters.size > 0,
      interviewer: has(ds, 'interviewer') && interviewers.size > 0,
      pipeline: has(ds, 'reqReceived') || has(ds, 'published') || has(ds, 'candidateReceived'),
      accepted: hasAccepted,
      salary: compAmounts.length > 0,
      dates: has(ds, 'activeDate') && has(ds, 'dueDate'),
    },
  };
}

// ── Employees ─────────────────────────────────────────────────

export interface EmployeeAnalytics {
  total: number; active: number; inactive: number;
  turnover: number | null;
  newThisYear: number; leftThisYear: number;
  underProbation: SheetRow[];
  avgTenureYears: number | null;
  avgAge: number | null;
  byDepartment: { name: string; total: number; active: number; color: string }[];
  bySector: Slice[];
  byGender: Slice[];
  byWorkType: Slice[];
  byNationality: Slice[];
  hiresByYear: Slice[];
  exitsByYear: Slice[];
  hiresByMonth: Slice[];
  docCompletion: { rate: number; complete: number; partial: number; missing: number };
  activeRows: SheetRow[];
}

const MONTHS_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function employeeAnalytics(ds: Dataset): EmployeeAnalytics {
  const rows = ds.rows;
  const thisYear = new Date().getFullYear();
  const isActive = (r: SheetRow) => text(ds, r, 'empStatus').toLowerCase().startsWith('act');

  const activeRows = rows.filter(isActive);
  const depts = new Map<string, { total: number; active: number }>();
  const tenures: number[] = [];
  const ages: number[] = [];
  let newThisYear = 0;
  let leftThisYear = 0;
  const underProbation: SheetRow[] = [];
  let docComplete = 0;
  let docPartial = 0;
  let docMissing = 0;
  let docSum = 0;
  let docCount = 0;

  for (const r of rows) {
    const dept = text(ds, r, 'department');
    if (dept) {
      const d = depts.get(dept) ?? { total: 0, active: 0 };
      d.total += 1;
      if (isActive(r)) d.active += 1;
      depts.set(dept, d);
    }

    const hire = date(ds, r, 'hiringDate');
    if (hire) {
      if (hire.getFullYear() === thisYear) newThisYear += 1;
      if (isActive(r)) {
        tenures.push((Date.now() - hire.getTime()) / (365.25 * 86400000));
      }
    }

    const resign = date(ds, r, 'resignDate');
    if (resign && resign.getFullYear() === thisYear) leftThisYear += 1;

    const age = num(ds, r, 'age');
    if (age && age > 15 && age < 80 && isActive(r)) ages.push(age);

    if (isActive(r) && text(ds, r, 'probation').toLowerCase().startsWith('under')) {
      underProbation.push(r);
    }

    if (isActive(r)) {
      const rate = num(ds, r, 'docRate');
      if (rate !== null) {
        docSum += rate;
        docCount += 1;
        if (rate >= 0.999) docComplete += 1;
        else if (rate > 0) docPartial += 1;
        else docMissing += 1;
      }
    }
  }

  const yearCount = (key: 'hiringDate' | 'resignDate') => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const d = date(ds, r, key);
      if (d) bump(m, String(d.getFullYear()));
    }
    return [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const hiresByMonth = (() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const d = date(ds, r, 'hiringDate');
      if (d && d.getFullYear() === thisYear) bump(m, MONTHS_ORDER[d.getMonth()]);
    }
    return MONTHS_ORDER.map((label) => ({ label, value: m.get(label) ?? 0 }));
  })();

  // Turnover measured the way HR reads it: leavers this year against the
  // headcount that was available to leave.
  const denominator = activeRows.length + leftThisYear;

  return {
    total: rows.length,
    active: activeRows.length,
    inactive: rows.length - activeRows.length,
    turnover: denominator > 0 ? pct(leftThisYear, denominator) : null,
    newThisYear,
    leftThisYear,
    underProbation,
    avgTenureYears: mean(tenures),
    avgAge: mean(ages),
    byDepartment: [...depts.entries()]
      .map(([name, d]) => ({ name, total: d.total, active: d.active, color: deptColor(name) }))
      .sort((a, b) => b.active - a.active || b.total - a.total),
    bySector: toSlices(countBy(activeRows, (r) => text(ds, r, 'sector'))),
    byGender: toSlices(countBy(activeRows, (r) => text(ds, r, 'gender'))),
    byWorkType: toSlices(countBy(activeRows, (r) => text(ds, r, 'workType'))),
    byNationality: toSlices(countBy(activeRows, (r) => text(ds, r, 'nationality'))),
    hiresByYear: yearCount('hiringDate'),
    exitsByYear: yearCount('resignDate'),
    hiresByMonth,
    docCompletion: {
      rate: docCount ? (docSum / docCount) * 100 : 0,
      complete: docComplete,
      partial: docPartial,
      missing: docMissing,
    },
    activeRows,
  };
}

// ── Salaries ──────────────────────────────────────────────────

export interface SalaryAnalytics {
  period: string;
  paidCount: number;
  headcount: number;
  totalCost: number;
  basicCost: number;
  kpiCost: number;
  avg: number | null;
  medianSalary: number | null;
  min: number | null;
  max: number | null;
  kpiShare: number;
  byDepartment: {
    name: string; total: number; count: number; avg: number; median: number; color: string;
  }[];
  bands: Slice[];
  topEarnersShare: number;
  missingSalary: number;
}

const BANDS: { label: string; min: number; max: number }[] = [
  { label: '< 6k', min: 0, max: 6000 },
  { label: '6–10k', min: 6000, max: 10000 },
  { label: '10–15k', min: 10000, max: 15000 },
  { label: '15–20k', min: 15000, max: 20000 },
  { label: '20–30k', min: 20000, max: 30000 },
  { label: '30k+', min: 30000, max: Infinity },
];

export function salaryAnalytics(ds: Dataset): SalaryAnalytics {
  const rows = ds.rows;
  const active = rows.filter((r) => text(ds, r, 'empStatus').toLowerCase().startsWith('act'));

  const paid: { row: SheetRow; total: number; basic: number; kpi: number; dept: string }[] = [];
  for (const r of rows) {
    const total = num(ds, r, 'totalSalary') ?? 0;
    if (total <= 0) continue; // a 0 here means "not set", not a real zero
    paid.push({
      row: r,
      total,
      basic: num(ds, r, 'basic') ?? 0,
      kpi: num(ds, r, 'kpiAmount') ?? 0,
      dept: text(ds, r, 'department'),
    });
  }

  const totals = paid.map((p) => p.total).sort((a, b) => b - a);
  const totalCost = totals.reduce((a, b) => a + b, 0);
  const basicCost = paid.reduce((a, p) => a + p.basic, 0);
  const kpiCost = paid.reduce((a, p) => a + p.kpi, 0);

  const byDept = new Map<string, number[]>();
  for (const p of paid) {
    if (p.dept) byDept.set(p.dept, [...(byDept.get(p.dept) ?? []), p.total]);
  }

  const bandCounts = new Map<string, number>();
  for (const t of totals) {
    const band = BANDS.find((b) => t >= b.min && t < b.max);
    if (band) bump(bandCounts, band.label);
  }

  // How concentrated the payroll is: what the best-paid tenth costs.
  const topN = Math.max(1, Math.round(totals.length * 0.1));
  const topSum = totals.slice(0, topN).reduce((a, b) => a + b, 0);

  return {
    period: rows.length ? text(ds, rows[0], 'period') : '',
    paidCount: paid.length,
    headcount: active.length,
    totalCost,
    basicCost,
    kpiCost,
    avg: mean(totals),
    medianSalary: median(totals),
    min: totals.length ? totals[totals.length - 1] : null,
    max: totals.length ? totals[0] : null,
    kpiShare: totalCost > 0 ? pct(kpiCost, totalCost) : 0,
    byDepartment: [...byDept.entries()]
      .map(([name, arr]) => ({
        name,
        total: arr.reduce((a, b) => a + b, 0),
        count: arr.length,
        avg: mean(arr) as number,
        median: median(arr) as number,
        color: deptColor(name),
      }))
      .sort((a, b) => b.total - a.total),
    bands: BANDS.map((b) => ({ label: b.label, value: bandCounts.get(b.label) ?? 0 })),
    topEarnersShare: totalCost > 0 ? pct(topSum, totalCost) : 0,
    missingSalary: active.length - paid.filter((p) =>
      text(ds, p.row, 'empStatus').toLowerCase().startsWith('act')).length,
  };
}

// ── Job structure ─────────────────────────────────────────────

export interface JobAnalytics {
  totalJobs: number;
  forecast: number;
  hired: number;
  coverage: number;
  under: number; match: number; over: number;
  withJd: number; withKpis: number;
  jdCoverage: number; kpiCoverage: number;
  byDepartment: {
    name: string; forecast: number; hired: number; gap: number; jobs: number; color: string;
  }[];
  gaps: { row: SheetRow; title: string; dept: string; gap: number }[];
}

export function jobAnalytics(ds: Dataset): JobAnalytics {
  const rows = ds.rows;
  const yes = (v: string) => v.trim().toLowerCase() === 'yes';

  let forecast = 0;
  let hired = 0;
  let under = 0;
  let match = 0;
  let over = 0;
  let withJd = 0;
  let withKpis = 0;
  const depts = new Map<string, { forecast: number; hired: number; jobs: number }>();
  const gaps: JobAnalytics['gaps'] = [];

  for (const r of rows) {
    const f = num(ds, r, 'forecast') ?? 0;
    const h = num(ds, r, 'hired') ?? 0;
    forecast += f;
    hired += h;

    const gap = h - f;
    if (gap < 0) under += 1;
    else if (gap === 0) match += 1;
    else over += 1;

    if (yes(text(ds, r, 'hasJd'))) withJd += 1;
    if (yes(text(ds, r, 'hasKpis'))) withKpis += 1;

    const dept = text(ds, r, 'department');
    if (dept) {
      const d = depts.get(dept) ?? { forecast: 0, hired: 0, jobs: 0 };
      d.forecast += f;
      d.hired += h;
      d.jobs += 1;
      depts.set(dept, d);
    }

    if (gap !== 0) {
      gaps.push({ row: r, title: text(ds, r, 'title'), dept, gap });
    }
  }

  return {
    totalJobs: rows.length,
    forecast,
    hired,
    coverage: forecast > 0 ? pct(hired, forecast) : 0,
    under, match, over,
    withJd, withKpis,
    jdCoverage: rows.length ? pct(withJd, rows.length) : 0,
    kpiCoverage: rows.length ? pct(withKpis, rows.length) : 0,
    byDepartment: [...depts.entries()]
      .map(([name, d]) => ({
        name, forecast: d.forecast, hired: d.hired, gap: d.hired - d.forecast,
        jobs: d.jobs, color: deptColor(name),
      }))
      .sort((a, b) => b.forecast - a.forecast),
    gaps: gaps.sort((a, b) => a.gap - b.gap),
  };
}

// ── KPI library ───────────────────────────────────────────────

export interface KpiAnalytics {
  total: number;
  departments: number;
  roles: number;
  byCategory: Slice[];
  byDepartment: Slice[];
  byUnit: Slice[];
  roleCoverage: { role: string; dept: string; count: number; weight: number }[];
  weightIssues: { role: string; dept: string; weight: number }[];
}

export function kpiAnalytics(ds: Dataset): KpiAnalytics {
  const rows = ds.rows;
  const byRole = new Map<string, { dept: string; count: number; weight: number }>();

  for (const r of rows) {
    const role = text(ds, r, 'kpiRole');
    if (!role) continue;
    const entry = byRole.get(role) ?? { dept: text(ds, r, 'kpiDept'), count: 0, weight: 0 };
    entry.count += 1;
    entry.weight += num(ds, r, 'kpiWeight') ?? 0;
    byRole.set(role, entry);
  }

  const roleCoverage = [...byRole.entries()]
    .map(([role, v]) => ({ role, dept: v.dept, count: v.count, weight: v.weight }))
    .sort((a, b) => b.count - a.count);

  return {
    total: rows.length,
    departments: new Set(rows.map((r) => text(ds, r, 'kpiDept')).filter(Boolean)).size,
    roles: byRole.size,
    byCategory: toSlices(countBy(rows, (r) => text(ds, r, 'kpiCategory'))),
    byDepartment: toSlices(countBy(rows, (r) => text(ds, r, 'kpiDept'))),
    byUnit: toSlices(countBy(rows, (r) => text(ds, r, 'kpiUnit'))),
    roleCoverage,
    // A role whose weights do not add to 100 cannot produce a fair score.
    weightIssues: roleCoverage.filter((r) => Math.round(r.weight) !== 100),
  };
}

// ── Appraisals ────────────────────────────────────────────────

export interface AppraisalAnalytics {
  total: number;
  avgPercent: number | null;
  byGrade: Slice[];
  byDepartment: { name: string; avg: number; count: number; color: string }[];
  buckets: { label: string; avg: number; max: number }[];
  ranked: { name: string; dept: string; percent: number; grade: string }[];
}

export function appraisalAnalytics(ds: Dataset): AppraisalAnalytics {
  const rows = ds.rows;
  const percents: number[] = [];
  const byDept = new Map<string, number[]>();
  const ranked: AppraisalAnalytics['ranked'] = [];

  // Section maxima, derived from the instrument: 14 / 8 / 12 / 6 criteria, each
  // scored out of 5, totalling 200.
  const buckets = [
    { key: 'aprPersonal' as const, label: 'تقييم شخصي', max: 70 },
    { key: 'aprTechnical' as const, label: 'تقييم فني', max: 40 },
    { key: 'aprManagerial' as const, label: 'تقييم اداري', max: 60 },
    { key: 'aprTraits' as const, label: 'سمات وصفات', max: 30 },
  ];
  const bucketSums = new Map<string, number[]>();

  for (const r of rows) {
    // The sheet stores the percentage as a 0-1 fraction.
    const raw = num(ds, r, 'aprPercent');
    const percent = raw === null ? null : raw <= 1 ? raw * 100 : raw;
    if (percent !== null) {
      percents.push(percent);
      const dept = text(ds, r, 'aprDept');
      if (dept) byDept.set(dept, [...(byDept.get(dept) ?? []), percent]);
      ranked.push({
        name: text(ds, r, 'aprName'),
        dept,
        percent,
        grade: text(ds, r, 'aprGrade'),
      });
    }
    for (const b of buckets) {
      const v = num(ds, r, b.key);
      if (v !== null) bucketSums.set(b.label, [...(bucketSums.get(b.label) ?? []), v]);
    }
  }

  return {
    total: rows.length,
    avgPercent: mean(percents),
    byGrade: toSlices(countBy(rows, (r) => text(ds, r, 'aprGrade'))),
    byDepartment: [...byDept.entries()]
      .map(([name, arr]) => ({
        name, avg: mean(arr) as number, count: arr.length, color: deptColor(name),
      }))
      .sort((a, b) => b.avg - a.avg),
    buckets: buckets.map((b) => ({
      label: b.label,
      avg: mean(bucketSums.get(b.label) ?? []) ?? 0,
      max: b.max,
    })),
    ranked: ranked.sort((a, b) => b.percent - a.percent),
  };
}
