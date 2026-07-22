import type { DomainId, DomainSpec } from '../types';

// ── Data source ───────────────────────────────────────────────
// One spreadsheet, one tab per domain. It must be shared
// "Anyone with the link → Viewer" for the public gviz read to work.
export const SHEET_ID: string =
  import.meta.env.VITE_SHEET_ID || '12n8WoP01MihoviW-jNlx5TajTr6Qy5AAOfHnFsv-A08';

export const REFRESH_SECONDS: number = Number(import.meta.env.VITE_REFRESH_SECONDS) || 90;

/**
 * `sheet` reads the live Google Sheet. `local` reads `data/csv/` through the
 * Vite dev server — for previewing before the sheet is populated. It only works
 * in `npm run dev`; a production build has no such route.
 */
export const DATA_MODE: 'sheet' | 'local' =
  import.meta.env.VITE_DATA_MODE === 'local' && import.meta.env.DEV ? 'local' : 'sheet';

export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

/** Apps Script Web App /exec URL — absent means the dashboard stays read-only. */
export const WRITE_API_URL: string = import.meta.env.VITE_WRITE_API_URL || '';
export const WRITE_API_TOKEN: string = import.meta.env.VITE_WRITE_API_TOKEN || '';

/** SHA-256 of the salary passcode. Never ship the passcode itself. */
export const SALARY_PASS_HASH: string = import.meta.env.VITE_SALARY_PASS_HASH || '';

// ── Domains ───────────────────────────────────────────────────
// `tab` must match the Google Sheet tab name exactly. `editable` turns on
// write-back for that domain; `keyColumn` is the stable row identity the write
// API targets, which is why it must never be renumbered in the sheet.
export const DOMAINS: Record<DomainId, DomainSpec> = {
  recruitment: {
    id: 'recruitment',
    tab: 'Recruitment',
    ar: 'التوظيف',
    en: 'Recruitment',
    keyColumn: 'RID',
    editable: true,
  },
  employees: {
    id: 'employees',
    tab: 'Employees',
    ar: 'الموظفين',
    en: 'Employees',
    keyColumn: 'Emp ID',
    editable: false,
  },
  salaries: {
    id: 'salaries',
    tab: 'Salaries',
    ar: 'المرتبات',
    en: 'Salaries',
    keyColumn: 'Emp ID',
    editable: false,
    restricted: true,
  },
  jobs: {
    id: 'jobs',
    tab: 'JobStructure',
    ar: 'الوظائف',
    en: 'Job structure',
    keyColumn: 'Job Code',
    editable: true,
  },
  kpis: {
    id: 'kpis',
    tab: 'KPI_Library',
    ar: 'مؤشرات الأداء',
    en: 'KPI library',
    keyColumn: 'كود المؤشر',
    editable: false,
  },
  appraisals: {
    id: 'appraisals',
    tab: 'Appraisals',
    ar: 'تقييمات الأداء',
    en: 'Appraisals',
    keyColumn: 'RID',
    editable: true,
  },
  criteria: {
    id: 'criteria',
    tab: 'Appraisal_Criteria',
    ar: 'معايير التقييم',
    en: 'Appraisal criteria',
    keyColumn: 'Code',
    editable: false,
  },
  plans: {
    id: 'plans',
    tab: 'Improvement_Plans',
    ar: 'خطط التحسين',
    en: 'Improvement plans',
    keyColumn: 'RID',
    editable: true,
  },
  training: {
    id: 'training',
    tab: 'Training',
    ar: 'التدريب',
    en: 'Training',
    keyColumn: 'RID',
    editable: true,
  },
  payroll: {
    id: 'payroll',
    tab: 'Payroll_Variables',
    ar: 'متغيرات الرواتب',
    en: 'Payroll variables',
    keyColumn: 'RID',
    editable: true,
    restricted: true,
  },
};

export const DOMAIN_LIST = Object.values(DOMAINS);

// ── Field resolution ──────────────────────────────────────────
// Pages never hard-code a single header string. They ask for a field by a list
// of candidates, so renaming a column in the sheet degrades to "column missing"
// instead of silently reading blanks.
export const FIELDS = {
  // Recruitment
  rid: ['RID'],
  position: ['Position', 'Total', 'Job Title'],
  needed: ['Number needed', 'Needed'],
  accepted: ['Accepted NUMB.', 'Accepted', 'Hired'],
  status: ['Status'],
  department: ['Department', 'Dept'],
  vacancyReason: ['Vacancy Reason'],
  reqReceived: ['Received Requirements'],
  published: ['Published'],
  candidateReceived: ['Received Candidate'],
  priority: ['priority', 'Priority'],
  seniority: ['Seniority'],
  location: ['Location'],
  recruiter1: ['Assigned to I', 'Assigned to'],
  recruiter2: ['Assigned to II'],
  activeDate: ['Active Date'],
  dueDate: ['Due date / Time of hire', 'Due Date'],
  hireDate: ['Actual Hiring Date', 'Hiring Date'],
  salaryRange: ['Salary Range'],
  actualSalary: ['Actual Salary'],
  interviewer: ['Interviewer'],
  validation: ['Validation'],
  feedback: ['FeedBack', 'Feedback', 'Notes'],

  // Employees
  empId: ['Emp ID'],
  nameEn: ['Name English'],
  nameAr: ['Name'],
  sector: ['Sector'],
  title: ['Title', 'Job Title'],
  manager: ['Direct Manager'],
  hiringDate: ['Hiring Date'],
  hiringYear: ['Hiring Year'],
  hiringQuarter: ['Hiring Quarter'],
  empStatus: ['Employee Status', 'Status'],
  resignDate: ['Resgnation Date', 'Resignation Date'],
  resignYear: ['Resignation Year'],
  probation: ['probation period', 'Probation Period'],
  lastProbation: ['Last probation date'],
  workType: ['Work Type'],
  gender: ['Gender'],
  age: ['Age'],
  education: ['Education'],
  nationality: ['Nationality'],
  maritalStatus: ['Marital Status'],
  docRate: ['Document Rate'],
  docCollection: ['Document Collection'],

  // Salaries
  period: ['Period'],
  basic: ['Basic Salary'],
  kpiAmount: ['KPIs Amount'],
  totalSalary: ['Total Salary'],
  kpiEligible: ['KPI Eligible'],

  // Job structure
  jobCode: ['Job Code'],
  forecast: ['Forecasted Quantity'],
  hired: ['Current Hired'],
  gap: ['Gap'],
  fit: ['Fit'],
  hasJd: ['Job Description'],
  hasKpis: ['KPIs'],
  jdLink: ['JD Link'],
  kpiLink: ['KPIs Link'],

  // KPI library
  kpiCode: ['كود المؤشر'],
  kpiDept: ['القسم'],
  kpiRole: ['الدور'],
  kpiCategory: ['الفئة'],
  kpiName: ['اسم المؤشر'],
  kpiDefinition: ['التعريف'],
  kpiWeight: ['الوزن %'],
  kpiTarget: ['الهدف الافتراضي'],
  kpiDirection: ['اتجاه القياس'],
  kpiUnit: ['الوحدة'],
  kpiSource: ['مصدر التحقق'],

  // Appraisals
  aprEmpId: ['الرقم الوظيفي'],
  aprName: ['اسم الموظف'],
  aprDept: ['القسم'],
  aprDate: ['تاريخ التقييم'],
  aprTotal: ['إجمالي الدرجة (من 200)'],
  aprPercent: ['النسبة المئوية'],
  aprGrade: ['التقدير العام'],
  aprPersonal: ['تقييم شخصي'],
  aprTechnical: ['تقييم فني'],
  aprManagerial: ['تقييم اداري'],
  aprTraits: ['سمات وصفات'],

  // Criteria
  critCode: ['Code'],
  critGroup: ['المجموعة'],
  critName: ['المعيار'],
  critBucket: ['التصنيف'],

  // Plans
  planStatus: ['حالة الخطة'],
  planRecommendation: ['توصية المدير المباشر'],
  planStrengths: ['نقاط القوة'],
  planGaps: ['نقاط تحتاج إلى تحسين'],
  planAction: ['خطة العمل المقترحة للتحسين'],
  planOwner: ['المسؤول عن المتابعة'],
  planStart: ['تاريخ بداية الخطة'],
  planEnd: ['تاريخ المتابعة/النهاية'],
} as const;

export type FieldKey = keyof typeof FIELDS;
