import type { Lang } from '../types';

type Entry = { ar: string; en: string };

export const strings = {
  'app.name': { ar: 'إنجوسوفت', en: 'Engosoft' },
  'app.hr': { ar: 'الموارد البشرية', en: 'Human Resources' },
  'app.title': { ar: 'لوحة التوظيف', en: 'Recruitment Dashboard' },
  'app.subtitle': { ar: 'متابعة حية لطلبات التوظيف', en: 'Live recruitment tracker' },

  'nav.section.main': { ar: 'الرئيسية', en: 'Main' },
  'nav.section.data': { ar: 'البيانات', en: 'Data' },
  'nav.overview': { ar: 'نظرة عامة', en: 'Overview' },
  'nav.positions': { ar: 'الوظائف', en: 'Positions' },
  'nav.recruiters': { ar: 'فريق التوظيف', en: 'Recruiters' },
  'nav.pipeline': { ar: 'مسار التوظيف', en: 'Pipeline' },
  'nav.about': { ar: 'حول اللوحة', en: 'About' },

  'header.report': { ar: 'التقرير', en: 'Report' },
  'header.searchPlaceholder': { ar: 'ابحث عن وظيفة أو قسم أو موظف…', en: 'Search a role, department, recruiter…' },
  'header.refresh': { ar: 'تحديث', en: 'Refresh' },
  'header.live': { ar: 'مباشر', en: 'Live' },
  'header.syncing': { ar: 'جارٍ المزامنة…', en: 'Syncing…' },
  'header.updated': { ar: 'آخر تحديث', en: 'Updated' },
  'header.openSheet': { ar: 'فتح الشيت', en: 'Open sheet' },
  'header.language': { ar: 'English', en: 'العربية' },

  'time.now': { ar: 'الآن', en: 'just now' },
  'time.secAgo': { ar: 'منذ {n} ث', en: '{n}s ago' },
  'time.minAgo': { ar: 'منذ {n} د', en: '{n}m ago' },
  'time.hourAgo': { ar: 'منذ {n} س', en: '{n}h ago' },

  'kpi.total': { ar: 'إجمالي الطلبات', en: 'Total requests' },
  'kpi.total.hint': { ar: 'كل الوظائف في هذا التقرير', en: 'All roles in this report' },
  'kpi.needed': { ar: 'الشواغر المطلوبة', en: 'Vacancies needed' },
  'kpi.needed.hint': { ar: 'مجموع الأعداد المطلوب توظيفها', en: 'Total headcount to hire' },
  'kpi.accepted': { ar: 'تم قبولهم', en: 'Accepted' },
  'kpi.accepted.hint': { ar: 'مرشحون تم قبولهم', en: 'Candidates accepted' },
  'kpi.done': { ar: 'وظائف مكتملة', en: 'Closed roles' },
  'kpi.done.hint': { ar: 'تم إغلاقها بنجاح', en: 'Successfully filled' },
  'kpi.fillRate': { ar: 'نسبة السد', en: 'Fill rate' },
  'kpi.fillRate.hint': { ar: 'المقبولون ÷ المطلوبون', en: 'Accepted ÷ needed' },
  'kpi.active': { ar: 'قيد التنفيذ', en: 'Active' },
  'kpi.hold': { ar: 'معلّقة', en: 'On hold' },
  'kpi.overdue': { ar: 'متأخرة', en: 'Overdue' },
  'kpi.overdue.hint': { ar: 'تجاوزت الموعد ولم تُغلق', en: 'Past due & still open' },

  'chart.status': { ar: 'الحالة', en: 'Status' },
  'chart.status.sub': { ar: 'توزيع الوظائف حسب الحالة', en: 'Roles by status' },
  'chart.department': { ar: 'الأقسام', en: 'Departments' },
  'chart.department.sub': { ar: 'الطلبات لكل قسم وحالتها', en: 'Requests per department' },
  'chart.priority': { ar: 'الأولوية', en: 'Priority' },
  'chart.priority.sub': { ar: 'توزيع حسب الأهمية', en: 'By importance' },
  'chart.seniority': { ar: 'مستوى الخبرة', en: 'Seniority' },
  'chart.seniority.sub': { ar: 'حسب مستوى الخبرة المطلوب', en: 'By required level' },
  'chart.location': { ar: 'الموقع', en: 'Location' },
  'chart.location.sub': { ar: 'مصر مقابل السعودية', en: 'Egypt vs KSA' },
  'chart.vacancy': { ar: 'سبب الشاغر', en: 'Vacancy reason' },
  'chart.vacancy.sub': { ar: 'وظيفة جديدة أم إحلال', en: 'New vs replacement' },
  'chart.recruiter': { ar: 'حِمل فريق التوظيف', en: 'Recruiter workload' },
  'chart.recruiter.sub': { ar: 'عدد الوظائف لكل موظف توظيف', en: 'Roles handled per recruiter' },
  'chart.pipeline': { ar: 'مسار التوظيف', en: 'Hiring pipeline' },
  'chart.pipeline.sub': { ar: 'من استلام المتطلبات حتى القبول', en: 'Requirements → acceptance' },
  'chart.interviewer': { ar: 'المقابلات', en: 'Interviewers' },
  'chart.interviewer.sub': { ar: 'عدد الوظائف لكل مُقابِل', en: 'Roles per interviewer' },
  'chart.comp': { ar: 'الرواتب (مصر / شهري)', en: 'Compensation (EG / monthly)' },
  'chart.comp.sub': { ar: 'وسيط الراتب الفعلي لكل قسم', en: 'Median actual salary by dept' },

  'pipe.reqReceived': { ar: 'استلام المتطلبات', en: 'Requirements' },
  'pipe.published': { ar: 'تم النشر', en: 'Published' },
  'pipe.candidateReceived': { ar: 'استلام المرشحين', en: 'Candidates' },
  'pipe.accepted': { ar: 'تم القبول', en: 'Accepted' },

  'positions.title': { ar: 'كل الوظائف', en: 'All positions' },
  'positions.count': { ar: 'عرض {shown} من {total}', en: 'Showing {shown} of {total}' },
  'positions.noResults': { ar: 'لا توجد نتائج مطابقة', en: 'No matching results' },
  'positions.clear': { ar: 'مسح الفلاتر', en: 'Clear filters' },
  'positions.expand': { ar: 'تفاصيل', en: 'Details' },
  'positions.export': { ar: 'تصدير CSV', en: 'Export CSV' },

  'filter.all': { ar: 'الكل', en: 'All' },
  'filter.status': { ar: 'الحالة', en: 'Status' },
  'filter.department': { ar: 'القسم', en: 'Department' },
  'filter.priority': { ar: 'الأولوية', en: 'Priority' },
  'filter.location': { ar: 'الموقع', en: 'Location' },
  'filter.recruiter': { ar: 'موظف التوظيف', en: 'Recruiter' },

  'recruiters.title': { ar: 'أداء فريق التوظيف', en: 'Recruiter performance' },
  'recruiters.sub': { ar: 'الحِمل ونسبة الإنجاز لكل موظف', en: 'Load and completion per recruiter' },
  'recruiters.roles': { ar: 'وظيفة', en: 'roles' },
  'recruiters.done': { ar: 'مكتملة', en: 'done' },
  'recruiters.completion': { ar: 'نسبة الإنجاز', en: 'Completion' },

  'stat.median': { ar: 'الوسيط', en: 'Median' },
  'stat.avg': { ar: 'المتوسط', en: 'Average' },
  'stat.range': { ar: 'المدى', en: 'Range' },
  'stat.planWindow': { ar: 'متوسط مدة التوظيف المخططة', en: 'Avg planned time-to-hire' },
  'unit.egpMo': { ar: 'ج.م / شهر', en: 'EGP / mo' },
  'unit.days': { ar: 'يوم', en: 'days' },
  'unit.role': { ar: 'وظيفة', en: 'roles' },
  'unit.person': { ar: 'مرشح', en: 'people' },

  'comp.caveat': {
    ar: 'يشمل الوظائف المصرية ذات الراتب الشهري الواضح فقط (باستثناء الريال والساعة والكورس).',
    en: 'EG monthly roles with a clear figure only (excludes SAR, hourly & per-course).',
  },
  'comp.based': { ar: 'محسوب على {n} وظيفة', en: 'Based on {n} roles' },

  'state.loading': { ar: 'جارٍ تحميل البيانات من Google Sheets…', en: 'Loading data from Google Sheets…' },
  'state.error': { ar: 'تعذّر تحميل البيانات', en: 'Could not load data' },
  'state.errorDesc': {
    ar: 'تأكد أن الشيت متاح للمشاركة «أي شخص لديه الرابط». التفاصيل: ',
    en: 'Make sure the sheet is shared "Anyone with the link". Details: ',
  },
  'state.retry': { ar: 'إعادة المحاولة', en: 'Retry' },
  'state.empty': { ar: 'لا توجد بيانات في هذا التبويب', en: 'No data in this tab' },

  'about.title': { ar: 'عن هذه اللوحة', en: 'About this dashboard' },
  'about.live': { ar: 'مزامنة حية مع Google Sheets', en: 'Live Google Sheets sync' },
  'about.liveDesc': {
    ar: 'تقرأ اللوحة مباشرة من الشيت وتتحدّث تلقائيًا كل دقيقة. أي تعديل على العناوين أو البيانات يظهر هنا بلا أي ربط يدوي.',
    en: 'The dashboard reads straight from the sheet and refreshes automatically. Any change to headers or data shows up here — no manual wiring.',
  },
  'about.adaptive': { ar: 'يتكيّف مع بنية الشيت', en: 'Adapts to your sheet' },
  'about.adaptiveDesc': {
    ar: 'يقرأ صف العناوين حيًّا، فلو غيّرت اسم عمود أو أضفت تبويب شهر جديد، تتكيّف اللوحة معه.',
    en: 'Headers are read live — rename a column or add a new monthly tab and the dashboard adapts.',
  },
  'about.bilingual': { ar: 'عربي / إنجليزي', en: 'Arabic / English' },
  'about.bilingualDesc': {
    ar: 'واجهة كاملة بالعربية (RTL) والإنجليزية (LTR) بضغطة زر.',
    en: 'Full Arabic (RTL) and English (LTR) with one click.',
  },
  'about.tab': { ar: 'التبويب الحالي', en: 'Current tab' },
  'about.rows': { ar: 'عدد الصفوف', en: 'Rows' },
  'about.columns': { ar: 'الأعمدة المكتشفة', en: 'Detected columns' },

  'foot.builtby': { ar: 'لوحة إنجوسوفت للموارد البشرية', en: 'Engosoft HR Dashboard' },
} satisfies Record<string, Entry>;

export type StringKey = keyof typeof strings;

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  const entry = strings[key];
  let s = entry ? entry[lang] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return s;
}
