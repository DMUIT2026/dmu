// Languages: English lives at normal addresses (/news), Arabic under /ar (/ar/news).
export type Locale = 'en' | 'ar';
export const locales: Locale[] = ['en', 'ar'];
export const isLocale = (v: string): v is Locale => v === 'en' || v === 'ar';
export const dirOf = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr');

/** Adds /ar in front of internal links when the page is Arabic. */
export function lhref(l: Locale, url?: string | null): string {
  if (!url) return '#';
  if (l !== 'ar' || !url.startsWith('/') || url.startsWith('/ar/') || url === '/ar' || url.startsWith('/admin')) return url;
  return url === '/' ? '/ar' : '/ar' + url;
}
/** The same page in the other language. */
export function switchHref(pathname: string, to: Locale) {
  const plain = pathname === '/ar' ? '/' : pathname.startsWith('/ar/') ? pathname.slice(3) : pathname;
  return to === 'ar' ? lhref('ar', plain) : plain;
}

/** Picks the Arabic version of a field when available. */
export function pick<T extends object>(row: T | null | undefined, field: string, l: Locale): string {
  if (!row) return '';
  const r = row as Record<string, unknown>;
  const ar = r[field + '_ar'];
  return (l === 'ar' && typeof ar === 'string' && ar.trim() ? ar : (r[field] as string)) ?? '';
}
/** Menu item label in the right language. */
export const label = (item: { label?: string; label_ar?: string | null; title?: string; title_ar?: string | null }, l: Locale) =>
  (l === 'ar' ? item.label_ar || item.title_ar : undefined) || item.label || item.title || '';

export function fmtDateL(d: string | null | undefined, l: Locale, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!d) return '';
  return new Intl.DateTimeFormat(l === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { ...opts, timeZone: 'Asia/Dubai' }).format(new Date(d));
}

const en = {
  home: 'Home', apply: 'Apply Now', applyTo: 'Apply to DMU', contact: 'Contact', contactUs: 'Contact Us', directory: 'Directory',
  academicCalendar: 'Academic Calendar', search: 'Search', searchPlaceholder: 'Search programmes, pages, news, people…', searchSite: 'Search the website',
  openMenu: 'Open menu', closeMenu: 'Close menu', skip: 'Skip to content', language: 'العربية',
  findProgramme: 'Find your programme', admissions: 'Admissions', allNews: 'All news', news: 'News & Events', newsSub: 'Stories, achievements and events from across Dubai Medical University.',
  latestNews: 'Latest news & events', happening: 'What’s happening at DMU', moreNews: 'More news', noNews: 'No news yet.', media: 'Media',
  aboutLabel: 'About DMU', legacy: 'A legacy of healthcare education,', since: 'since 1986', vision: 'Our vision & mission', vca: 'VCA message',
  programmesAt: 'Programmes at DMU', programmesTitle: 'Find the programme that fits your future.', allLevels: 'All levels', allColleges: 'All colleges',
  Undergraduate: 'Undergraduate', Postgraduate: 'Postgraduate', starts: 'Starts', programme: 'Programme',
  lifeAt: 'Life at DMU', lifeTitle: 'A campus built for learning, practice and wellbeing.', facilities: 'Facilities & services', explore: 'Explore',
  joinDmu: 'Join DMU', joinTitle: 'Discover the perfect academic programme — and start your journey in healthcare.', fees: 'Fees & scholarships',
  prospective: 'Prospective students', prospectiveText: 'Programmes, admissions, fees & scholarships',
  current: 'Current students', currentText: 'Academic calendar, advising, student affairs',
  staff: 'Faculty & staff', staffText: 'Directory, QAIE, publications', alumni: 'Alumni', alumniText: 'Stay connected with the DMU community',
  getInTouch: 'Get in touch', quickLinks: 'Quick links', colleges: 'Colleges', rights: 'DMU – Dubai, United Arab Emirates', tagline: 'Empower the next generation of health care leaders.',
  results: 'result(s)', resultsFor: 'Results for', kindPage: 'Page', kindNews: 'News', kindPerson: 'Person', kindEvent: 'Event',
  notFoundTitle: 'This page could not be found.', notFoundText: 'It may have moved when we refreshed our website. Try searching, or head back to the home page.', goHome: 'Go home',
  directoryBack: 'Faculty and Staff Directory', people: 'people', person: 'person', searchPeople: 'Search by name, role or department', allDepartments: 'All colleges & departments', all: 'All',
  sendMessage: 'Send us a message', fullName: 'Full name', email: 'Email', phone: 'Phone (optional)', subject: 'Subject', message: 'Message', send: 'Send message', sending: 'Sending…',
  thanks: 'Thank you', thanksText: 'Your message has been sent. Our team will get back to you soon.',
  events: 'Events', eventsTitle: 'Events & Academic Calendar', eventsSub: 'Upcoming events, key academic dates, conferences and open days at DMU.',
  upcoming: 'Upcoming', upcomingEvents: 'Upcoming events', allEvents: 'All events', calendarView: 'Calendar', listView: 'List', today: 'Today',
  noEvents: 'No events in this period.', location: 'Location', addToCalendar: 'Add to my calendar', moreInfo: 'More information', previous: 'Previous', next: 'Next',
  cat_all: 'All', cat_academic: 'Academic dates', cat_event: 'Events', cat_conference: 'Conferences', cat_workshop: 'Workshops', 'cat_open-day': 'Open days', cat_holiday: 'Holidays', cat_deadline: 'Deadlines',
  translationNote: '',
};
const ar: typeof en = {
  home: 'الرئيسية', apply: 'قدّم الآن', applyTo: 'قدّم إلى الجامعة', contact: 'اتصل بنا', contactUs: 'اتصل بنا', directory: 'الدليل',
  academicCalendar: 'التقويم الأكاديمي', search: 'بحث', searchPlaceholder: 'ابحث عن البرامج والصفحات والأخبار والأشخاص…', searchSite: 'ابحث في الموقع',
  openMenu: 'فتح القائمة', closeMenu: 'إغلاق القائمة', skip: 'انتقل إلى المحتوى', language: 'English',
  findProgramme: 'ابحث عن برنامجك', admissions: 'القبول', allNews: 'جميع الأخبار', news: 'الأخبار والفعاليات', newsSub: 'قصص وإنجازات وفعاليات من مختلف أرجاء جامعة دبي الطبية.',
  latestNews: 'آخر الأخبار والفعاليات', happening: 'ما الجديد في الجامعة', moreNews: 'المزيد من الأخبار', noNews: 'لا توجد أخبار بعد.', media: 'الإعلام',
  aboutLabel: 'عن الجامعة', legacy: 'إرث في تعليم الرعاية الصحية', since: 'منذ عام 1986', vision: 'رؤيتنا ورسالتنا', vca: 'كلمة نائب مدير الجامعة',
  programmesAt: 'البرامج الأكاديمية', programmesTitle: 'اختر البرنامج الذي يناسب مستقبلك.', allLevels: 'جميع المستويات', allColleges: 'جميع الكليات',
  Undergraduate: 'البكالوريوس', Postgraduate: 'الدراسات العليا', starts: 'يبدأ في', programme: 'برنامج',
  lifeAt: 'الحياة في الجامعة', lifeTitle: 'حرم جامعي مصمّم للتعلّم والممارسة وجودة الحياة.', facilities: 'المرافق والخدمات', explore: 'استكشف',
  joinDmu: 'انضم إلينا', joinTitle: 'اكتشف البرنامج الأكاديمي الأمثل لك، وابدأ رحلتك في مجال الرعاية الصحية.', fees: 'الرسوم والمنح',
  prospective: 'الطلبة المستقبليون', prospectiveText: 'البرامج والقبول والرسوم والمنح',
  current: 'الطلبة الحاليون', currentText: 'التقويم الأكاديمي والإرشاد وشؤون الطلبة',
  staff: 'أعضاء الهيئة التدريسية والموظفون', staffText: 'الدليل وضمان الجودة والمنشورات', alumni: 'الخريجون', alumniText: 'ابقَ على تواصل مع مجتمع الجامعة',
  getInTouch: 'تواصل معنا', quickLinks: 'روابط سريعة', colleges: 'الكليات', rights: 'جامعة دبي الطبية – دبي، الإمارات العربية المتحدة', tagline: 'تمكين الجيل القادم من قادة الرعاية الصحية.',
  results: 'نتيجة', resultsFor: 'نتائج البحث عن', kindPage: 'صفحة', kindNews: 'خبر', kindPerson: 'شخص', kindEvent: 'فعالية',
  notFoundTitle: 'تعذّر العثور على هذه الصفحة.', notFoundText: 'ربما نُقلت عند تحديث موقعنا. جرّب البحث أو عُد إلى الصفحة الرئيسية.', goHome: 'العودة إلى الرئيسية',
  directoryBack: 'دليل أعضاء الهيئة التدريسية والموظفين', people: 'شخصًا', person: 'شخص', searchPeople: 'ابحث بالاسم أو المسمى الوظيفي أو القسم', allDepartments: 'جميع الكليات والأقسام', all: 'الكل',
  sendMessage: 'أرسل لنا رسالة', fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف (اختياري)', subject: 'الموضوع', message: 'الرسالة', send: 'إرسال', sending: 'جارٍ الإرسال…',
  thanks: 'شكرًا لك', thanksText: 'تم إرسال رسالتك، وسيتواصل معك فريقنا قريبًا.',
  events: 'الفعاليات', eventsTitle: 'الفعاليات والتقويم الأكاديمي', eventsSub: 'الفعاليات القادمة والمواعيد الأكاديمية المهمة والمؤتمرات والأيام المفتوحة في الجامعة.',
  upcoming: 'القادمة', upcomingEvents: 'الفعاليات القادمة', allEvents: 'جميع الفعاليات', calendarView: 'التقويم', listView: 'القائمة', today: 'اليوم',
  noEvents: 'لا توجد فعاليات في هذه الفترة.', location: 'المكان', addToCalendar: 'أضف إلى تقويمي', moreInfo: 'مزيد من المعلومات', previous: 'السابق', next: 'التالي',
  cat_all: 'الكل', cat_academic: 'مواعيد أكاديمية', cat_event: 'فعاليات', cat_conference: 'مؤتمرات', cat_workshop: 'ورش عمل', 'cat_open-day': 'أيام مفتوحة', cat_holiday: 'عطلات', cat_deadline: 'مواعيد نهائية',
  translationNote: 'تمت ترجمة هذه الصفحة آليًا وهي قيد المراجعة.',
};
export const dict = { en, ar };
export type DictKey = keyof typeof en;
export const t = (l: Locale, k: DictKey) => dict[l][k] ?? dict.en[k];

export const COLLEGE_AR: Record<string, string> = {
  'College of Medicine': 'كلية الطب', 'College of Pharmacy': 'كلية الصيدلة', 'College of Nursing': 'كلية التمريض',
  'College of Health Sciences': 'كلية العلوم الصحية', 'Dubai Medical University': 'جامعة دبي الطبية',
};
export const collegeName = (c: string | null | undefined, l: Locale) => {
  if (!c) return '';
  const nice = c.replace(/\b(Of|And)\b/g, m => m.toLowerCase());
  return l === 'ar' ? COLLEGE_AR[nice] ?? nice : nice;
};
