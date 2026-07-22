import type { Lang } from '../types';

type Entry = { ar: string; en: string };

export const strings = {
  'app.name': { ar: 'إنجوسوفت', en: 'Engosoft' },
  'app.hr': { ar: 'الموارد البشرية', en: 'Human Resources' },
  'app.suite': { ar: 'منظومة الموارد البشرية', en: 'HR Suite' },

  // ── Navigation ──────────────────────────────────────────────
  'nav.section.main': { ar: 'الرئيسية', en: 'Main' },
  'nav.section.org': { ar: 'التنظيم والأداء', en: 'Org & performance' },
  'nav.section.finance': { ar: 'المالية', en: 'Finance' },
  'nav.section.system': { ar: 'النظام', en: 'System' },
  'nav.overview': { ar: 'نظرة عامة', en: 'Overview' },
  'nav.recruitment': { ar: 'التوظيف', en: 'Recruitment' },
  'nav.employees': { ar: 'الموظفين', en: 'Employees' },
  'nav.jobs': { ar: 'الهيكل الوظيفي', en: 'Job structure' },
  'nav.salaries': { ar: 'المرتبات', en: 'Salaries' },
  'nav.performance': { ar: 'تقييمات الأداء', en: 'Appraisals' },
  'nav.kpis': { ar: 'مؤشرات الأداء', en: 'KPIs' },
  'nav.training': { ar: 'التدريب', en: 'Training' },
  'nav.settings': { ar: 'الإعدادات', en: 'Settings' },

  // ── Header ──────────────────────────────────────────────────
  'header.searchPlaceholder': { ar: 'ابحث…', en: 'Search…' },
  'header.refresh': { ar: 'تحديث', en: 'Refresh' },
  'header.live': { ar: 'مباشر', en: 'Live' },
  'header.syncing': { ar: 'جارٍ المزامنة…', en: 'Syncing…' },
  'header.readonly': { ar: 'قراءة فقط', en: 'Read-only' },
  'header.updated': { ar: 'آخر تحديث', en: 'Updated' },
  'header.openSheet': { ar: 'فتح الشيت', en: 'Open sheet' },
  'header.language': { ar: 'English', en: 'العربية' },
  'header.menu': { ar: 'القائمة', en: 'Menu' },

  'time.now': { ar: 'الآن', en: 'just now' },
  'time.secAgo': { ar: 'منذ {n} ث', en: '{n}s ago' },
  'time.minAgo': { ar: 'منذ {n} د', en: '{n}m ago' },
  'time.hourAgo': { ar: 'منذ {n} س', en: '{n}h ago' },

  // ── Overview ────────────────────────────────────────────────
  'ov.title': { ar: 'الحالة العامة', en: 'Company at a glance' },
  'ov.sub': { ar: 'مباشر من Google Sheets', en: 'Live from Google Sheets' },
  'ov.headcount': { ar: 'عدد الموظفين', en: 'Headcount' },
  'ov.headcount.hint': { ar: 'الموظفون النشطون', en: 'Active employees' },
  'ov.turnover': { ar: 'معدل الدوران', en: 'Turnover' },
  'ov.turnover.hint': { ar: 'المغادرون هذا العام', en: 'Leavers this year' },
  'ov.openRoles': { ar: 'وظائف مفتوحة', en: 'Open roles' },
  'ov.openRoles.hint': { ar: 'طلبات قيد التنفيذ', en: 'Active requisitions' },
  'ov.newHires': { ar: 'تعيينات جديدة', en: 'New hires' },
  'ov.newHires.hint': { ar: 'هذا العام', en: 'This year' },
  'ov.coverage': { ar: 'تغطية الهيكل', en: 'Structure coverage' },
  'ov.coverage.hint': { ar: 'الموجود ÷ المخطط', en: 'Hired ÷ forecast' },
  'ov.probation': { ar: 'تحت الاختبار', en: 'Under probation' },
  'ov.probation.hint': { ar: 'يحتاجون قرار تثبيت', en: 'Awaiting confirmation' },
  'ov.attention': { ar: 'يحتاج انتباهك', en: 'Needs your attention' },
  'ov.attention.sub': { ar: 'بنود مفتوحة عبر المنظومة', en: 'Open items across the suite' },
  'ov.headcountTrend': { ar: 'التعيينات والمغادرة', en: 'Hires vs. exits' },
  'ov.headcountTrend.sub': { ar: 'حسب السنة', en: 'By year' },

  // ── KPI cards (recruitment) ─────────────────────────────────
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

  // ── Charts ──────────────────────────────────────────────────
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

  // ── Board / editing ─────────────────────────────────────────
  'board.table': { ar: 'جدول', en: 'Table' },
  'board.board': { ar: 'لوحة', en: 'Board' },
  'board.dragHint': {
    ar: 'اسحب البطاقة بين الأعمدة لتغيير الحالة — يُحفظ في الشيت فورًا.',
    en: 'Drag a card between columns to change its status — saved to the sheet instantly.',
  },
  'board.close': { ar: 'إغلاق الوظيفة', en: 'Close role' },
  'board.reopen': { ar: 'إعادة فتح', en: 'Reopen' },
  'board.empty': { ar: 'لا شيء هنا', en: 'Nothing here' },
  'board.moveTo': { ar: 'نقل إلى', en: 'Move to' },

  'edit.saving': { ar: 'جارٍ الحفظ…', en: 'Saving…' },
  'edit.saved': { ar: 'تم الحفظ في الشيت', en: 'Saved to the sheet' },
  'edit.failed': { ar: 'فشل الحفظ', en: 'Save failed' },
  'edit.readonlyTitle': { ar: 'التعديل غير مُفعّل', en: 'Editing is off' },
  'edit.readonlyBody': {
    ar: 'اضبط VITE_WRITE_API_URL و VITE_WRITE_API_TOKEN لتفعيل الكتابة في الشيت.',
    en: 'Set VITE_WRITE_API_URL and VITE_WRITE_API_TOKEN to enable writing to the sheet.',
  },
  'edit.whoAreYou': { ar: 'من أنت؟', en: 'Who are you?' },
  'edit.whoHint': {
    ar: 'يُسجَّل اسمك مع كل تعديل في سجل الشيت.',
    en: 'Your name is recorded with every edit in the sheet audit log.',
  },
  'edit.save': { ar: 'حفظ', en: 'Save' },
  'edit.cancel': { ar: 'إلغاء', en: 'Cancel' },

  // ── Employees ───────────────────────────────────────────────
  'emp.title': { ar: 'تحليل الموظفين', en: 'Workforce analysis' },
  'emp.sub': { ar: 'الحالة والتركيبة والاستقرار', en: 'Headcount, composition and stability' },
  'emp.active': { ar: 'موظف نشط', en: 'Active' },
  'emp.inactive': { ar: 'غادروا', en: 'Left' },
  'emp.avgTenure': { ar: 'متوسط مدة الخدمة', en: 'Avg tenure' },
  'emp.avgAge': { ar: 'متوسط العمر', en: 'Avg age' },
  'emp.years': { ar: 'سنة', en: 'yrs' },
  'emp.byDept': { ar: 'التوزيع على الأقسام', en: 'Headcount by department' },
  'emp.byDept.sub': { ar: 'النشطون مقابل الإجمالي التاريخي', en: 'Active vs. all-time' },
  'emp.gender': { ar: 'النوع', en: 'Gender' },
  'emp.workType': { ar: 'نوع التعاقد', en: 'Work type' },
  'emp.sector': { ar: 'القطاعات', en: 'Sectors' },
  'emp.hiresByYear': { ar: 'التعيينات حسب السنة', en: 'Hires by year' },
  'emp.hiresThisYear': { ar: 'التعيينات هذا العام', en: 'Hires this year' },
  'emp.docs': { ar: 'اكتمال ملفات الموظفين', en: 'Employee file completeness' },
  'emp.docs.sub': { ar: 'نسبة المستندات المستلمة', en: 'Share of documents received' },
  'emp.docs.complete': { ar: 'مكتمل', en: 'Complete' },
  'emp.docs.partial': { ar: 'ناقص', en: 'Partial' },
  'emp.docs.missing': { ar: 'لا يوجد', en: 'None' },
  'emp.probationList': { ar: 'تحت فترة الاختبار', en: 'Under probation' },
  'emp.probationList.sub': { ar: 'يحتاجون قرار تثبيت', en: 'Need a confirmation decision' },

  // ── Salaries ────────────────────────────────────────────────
  'sal.locked': { ar: 'صفحة محمية', en: 'Protected page' },
  'sal.lockedBody': {
    ar: 'بيانات المرتبات سرّية. أدخل رمز الدخول للمتابعة.',
    en: 'Salary data is confidential. Enter the passcode to continue.',
  },
  'sal.passcode': { ar: 'رمز الدخول', en: 'Passcode' },
  'sal.unlock': { ar: 'دخول', en: 'Unlock' },
  'sal.wrong': { ar: 'رمز غير صحيح', en: 'Incorrect passcode' },
  'sal.lock': { ar: 'قفل', en: 'Lock' },
  'sal.notConfigured': {
    ar: 'لم يُضبط رمز الدخول. اضبط VITE_SALARY_PASS_HASH قبل النشر.',
    en: 'No passcode is configured. Set VITE_SALARY_PASS_HASH before deploying.',
  },
  'sal.title': { ar: 'تحليل المرتبات', en: 'Payroll analysis' },
  'sal.period': { ar: 'الفترة', en: 'Period' },
  'sal.totalCost': { ar: 'إجمالي التكلفة', en: 'Total cost' },
  'sal.basic': { ar: 'الأساسي', en: 'Basic' },
  'sal.kpiCost': { ar: 'حوافز المؤشرات', en: 'KPI incentives' },
  'sal.kpiShare': { ar: 'نسبة الحوافز', en: 'Incentive share' },
  'sal.avg': { ar: 'متوسط الراتب', en: 'Average salary' },
  'sal.median': { ar: 'وسيط الراتب', en: 'Median salary' },
  'sal.paid': { ar: 'مرتبات مسجلة', en: 'Salaries on record' },
  'sal.byDept': { ar: 'التكلفة حسب القسم', en: 'Cost by department' },
  'sal.byDept.sub': { ar: 'إجمالي التكلفة الشهرية', en: 'Total monthly cost' },
  'sal.bands': { ar: 'شرائح الرواتب', en: 'Salary bands' },
  'sal.bands.sub': { ar: 'عدد الموظفين في كل شريحة', en: 'Employees per band' },
  'sal.concentration': { ar: 'تركّز الأجور', en: 'Pay concentration' },
  'sal.concentration.sub': {
    ar: 'حصة أعلى 10٪ من إجمالي التكلفة',
    en: 'Share of total cost taken by the top 10%',
  },
  'sal.roster': { ar: 'كشف المرتبات', en: 'Payroll roster' },

  // ── Job structure ───────────────────────────────────────────
  'job.title': { ar: 'تحليل الوظائف', en: 'Job structure analysis' },
  'job.sub': { ar: 'المخطط مقابل الموجود', en: 'Forecast vs. actual' },
  'job.jobs': { ar: 'وظيفة معتمدة', en: 'Approved jobs' },
  'job.forecast': { ar: 'العدد المخطط', en: 'Forecast' },
  'job.hired': { ar: 'الموجود فعليًا', en: 'Currently hired' },
  'job.coverage': { ar: 'نسبة التغطية', en: 'Coverage' },
  'job.jdCoverage': { ar: 'وصف وظيفي', en: 'Has a JD' },
  'job.kpiCoverage': { ar: 'مؤشرات معتمدة', en: 'Has KPIs' },
  'job.gaps': { ar: 'فجوات الهيكل', en: 'Structure gaps' },
  'job.gaps.sub': { ar: 'نقص أو زيادة عن المخطط', en: 'Under or over the forecast' },
  'job.under': { ar: 'نقص', en: 'Under' },
  'job.over': { ar: 'زيادة', en: 'Over' },
  'job.match': { ar: 'مطابق', en: 'Match' },
  'job.byDept': { ar: 'المخطط والموجود لكل قسم', en: 'Forecast vs. hired by department' },

  // ── KPIs ────────────────────────────────────────────────────
  'kpis.title': { ar: 'مكتبة مؤشرات الأداء', en: 'KPI library' },
  'kpis.sub': {
    ar: 'شكل موحّد للمؤشرات مع معايير مختلفة لكل وظيفة',
    en: 'One shape for every KPI, different criteria per role',
  },
  'kpis.count': { ar: 'مؤشر', en: 'KPIs' },
  'kpis.roles': { ar: 'دور وظيفي', en: 'Roles covered' },
  'kpis.depts': { ar: 'قسم', en: 'Departments' },
  'kpis.byCategory': { ar: 'الفئات', en: 'Categories' },
  'kpis.byDept': { ar: 'المؤشرات لكل قسم', en: 'KPIs per department' },
  'kpis.coverage': { ar: 'تغطية الأدوار', en: 'Role coverage' },
  'kpis.coverage.sub': { ar: 'عدد المؤشرات ومجموع الأوزان', en: 'KPI count and total weight' },
  'kpis.weightWarn': { ar: 'أوزان لا تساوي ١٠٠٪', en: 'Weights do not total 100%' },
  'kpis.weightWarn.sub': {
    ar: 'هذه الأدوار لا يمكن حساب درجة عادلة لها حتى تُضبط أوزانها.',
    en: 'These roles cannot produce a fair score until their weights are fixed.',
  },
  'kpis.weight': { ar: 'الوزن', en: 'Weight' },

  // ── Appraisals ──────────────────────────────────────────────
  'perf.title': { ar: 'تقييمات الأداء', en: 'Performance appraisals' },
  'perf.sub': { ar: 'نموذج موحّد من ٤٠ معيارًا', en: 'A single 40-criteria instrument' },
  'perf.reviewed': { ar: 'موظف مُقيَّم', en: 'Employees reviewed' },
  'perf.avg': { ar: 'متوسط النسبة', en: 'Average score' },
  'perf.grades': { ar: 'التقديرات', en: 'Grades' },
  'perf.buckets': { ar: 'متوسط كل محور', en: 'Average by section' },
  'perf.buckets.sub': { ar: 'من الدرجة القصوى للمحور', en: 'Against each section maximum' },
  'perf.ranking': { ar: 'الترتيب', en: 'Ranking' },
  'perf.byDept': { ar: 'متوسط التقييم لكل قسم', en: 'Average score by department' },
  'perf.criteria': { ar: 'معايير التقييم', en: 'Appraisal criteria' },
  'perf.criteria.sub': { ar: '٨ مجموعات × ٤٠ معيارًا، كل معيار من ٥', en: '8 groups, 40 criteria, each out of 5' },
  'perf.plans': { ar: 'خطط التحسين', en: 'Improvement plans' },
  'perf.plans.sub': { ar: 'المصدر المباشر لتقرير التدريب', en: 'The direct input to the training report' },
  'perf.noPlans': { ar: 'لا توجد خطط تحسين مسجلة', en: 'No improvement plans on record' },

  // ── Training ────────────────────────────────────────────────
  'train.title': { ar: 'سجل التدريب', en: 'Training register' },
  'train.sub': { ar: 'يُستخرج من خطط التحسين والتقييمات', en: 'Derived from improvement plans and appraisals' },
  'train.empty': { ar: 'سجل التدريب فارغ', en: 'The training register is empty' },
  'train.emptyBody': {
    ar: 'أضف صفوفًا إلى تبويب Training في الشيت، أو أنشئها من خطط التحسين أدناه.',
    en: 'Add rows to the Training tab in the sheet, or create them from the improvement plans below.',
  },
  'train.candidates': { ar: 'مرشحون للتدريب', en: 'Training candidates' },
  'train.candidates.sub': {
    ar: 'موظفون لديهم خطة تحسين مفتوحة',
    en: 'Employees with an open improvement plan',
  },
  'train.addFromPlan': { ar: 'إضافة للتدريب', en: 'Add to training' },

  // ── Table ───────────────────────────────────────────────────
  'table.count': { ar: 'عرض {shown} من {total}', en: 'Showing {shown} of {total}' },
  'table.noResults': { ar: 'لا توجد نتائج مطابقة', en: 'No matching results' },
  'table.clear': { ar: 'مسح الفلاتر', en: 'Clear filters' },
  'table.export': { ar: 'تصدير CSV', en: 'Export CSV' },
  'table.details': { ar: 'تفاصيل', en: 'Details' },
  'table.search': { ar: 'بحث في الجدول…', en: 'Search this table…' },

  'filter.all': { ar: 'الكل', en: 'All' },
  'filter.status': { ar: 'الحالة', en: 'Status' },
  'filter.department': { ar: 'القسم', en: 'Department' },
  'filter.priority': { ar: 'الأولوية', en: 'Priority' },
  'filter.location': { ar: 'الموقع', en: 'Location' },
  'filter.recruiter': { ar: 'موظف التوظيف', en: 'Recruiter' },

  'recruiters.title': { ar: 'أداء فريق التوظيف', en: 'Recruiter performance' },
  'recruiters.sub': { ar: 'الحِمل ونسبة الإنجاز لكل موظف', en: 'Load and completion per recruiter' },
  'recruiters.completion': { ar: 'نسبة الإنجاز', en: 'Completion' },

  'stat.median': { ar: 'الوسيط', en: 'Median' },
  'stat.avg': { ar: 'المتوسط', en: 'Average' },
  'stat.range': { ar: 'المدى', en: 'Range' },
  'stat.planWindow': { ar: 'متوسط مدة التوظيف المخططة', en: 'Avg planned time-to-hire' },
  'unit.egpMo': { ar: 'ج.م / شهر', en: 'EGP / mo' },
  'unit.egp': { ar: 'ج.م', en: 'EGP' },
  'unit.days': { ar: 'يوم', en: 'days' },
  'unit.role': { ar: 'وظيفة', en: 'roles' },
  'unit.person': { ar: 'موظف', en: 'people' },

  'comp.caveat': {
    ar: 'يشمل الوظائف المصرية ذات الراتب الشهري الواضح فقط (باستثناء الريال والساعة والكورس).',
    en: 'EG monthly roles with a clear figure only (excludes SAR, hourly & per-course).',
  },
  'comp.based': { ar: 'محسوب على {n} وظيفة', en: 'Based on {n} roles' },

  // ── States ──────────────────────────────────────────────────
  'state.loading': { ar: 'جارٍ التحميل من Google Sheets…', en: 'Loading from Google Sheets…' },
  'state.error': { ar: 'تعذّر تحميل البيانات', en: 'Could not load data' },
  'state.errorDesc': {
    ar: 'تأكد أن الشيت متاح «لأي شخص لديه الرابط» وأن اسم التبويب مطابق. التفاصيل: ',
    en: 'Check the sheet is shared "Anyone with the link" and the tab name matches. Details: ',
  },
  'state.retry': { ar: 'إعادة المحاولة', en: 'Retry' },
  'state.empty': { ar: 'لا توجد بيانات بعد', en: 'No data yet' },
  'state.emptyTab': {
    ar: 'تبويب «{tab}» موجود لكنه فارغ. ارفع ملف {tab}.csv من مجلد data/csv.',
    en: 'The "{tab}" tab exists but is empty. Upload {tab}.csv from data/csv.',
  },

  // ── Settings ────────────────────────────────────────────────
  'set.title': { ar: 'الإعدادات والاتصال', en: 'Settings & connection' },
  'set.sub': { ar: 'حالة الربط مع Google Sheets', en: 'Google Sheets connection status' },
  'set.source': { ar: 'مصدر البيانات', en: 'Data source' },
  'set.tabs': { ar: 'التبويبات', en: 'Tabs' },
  'set.tab': { ar: 'التبويب', en: 'Tab' },
  'set.rows': { ar: 'الصفوف', en: 'Rows' },
  'set.columns': { ar: 'الأعمدة', en: 'Columns' },
  'set.state': { ar: 'الحالة', en: 'State' },
  'set.ok': { ar: 'متصل', en: 'Connected' },
  'set.notLoaded': { ar: 'لم يُطلب بعد', en: 'Not requested' },
  'set.writeApi': { ar: 'واجهة الكتابة', en: 'Write API' },
  'set.writeOn': { ar: 'مفعّلة — التعديل من اللوحة يُحفظ في الشيت', en: 'Enabled — edits save to the sheet' },
  'set.writeOff': { ar: 'غير مفعّلة — اللوحة للقراءة فقط', en: 'Disabled — the dashboard is read-only' },
  'set.identity': { ar: 'هويتك', en: 'Your identity' },
  'set.refreshEvery': { ar: 'التحديث التلقائي كل {n} ثانية', en: 'Auto-refresh every {n}s' },

  'foot.builtby': { ar: 'منظومة إنجوسوفت للموارد البشرية', en: 'Engosoft HR Suite' },
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
