// Adds the DMU Academic Calendar 2026–2027 (from the old website) to the events calendar. Safe to run again.
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

type E = [string, string, string, string | null, string?];
const F = 'Fall Semester', S = 'Spring Semester', S1 = 'Summer Semester (1)', S2 = 'Summer Semester (2)';
const AR: Record<string, string> = { [F]: 'الفصل الدراسي الأول (الخريف)', [S]: 'الفصل الدراسي الثاني (الربيع)', [S1]: 'الفصل الصيفي (1)', [S2]: 'الفصل الصيفي (2)' };
// [semester, English, Arabic, start, end?]
const rows: [string, string, string, string, string | null][] = [
  [F, 'Faculty and staff report to work', 'عودة أعضاء الهيئة التدريسية والموظفين إلى العمل', '2026-08-17', null],
  [F, 'New students’ orientation and registration', 'البرنامج التعريفي للطلبة الجدد والتسجيل', '2026-08-19', '2026-08-20'],
  [F, 'Classes begin', 'بدء الدراسة', '2026-08-24', null],
  [F, 'Registration', 'التسجيل', '2026-08-24', '2026-09-04'],
  [F, 'Midterm exams', 'امتحانات منتصف الفصل', '2026-10-05', '2026-10-16'],
  [F, 'Last day of classes', 'آخر يوم دراسي', '2026-12-04', null],
  [F, 'Final exams', 'الامتحانات النهائية', '2026-12-07', '2026-12-16'],
  [F, 'Results announcement', 'إعلان النتائج', '2026-12-18', null],
  [F, 'Winter break for students', 'العطلة الشتوية للطلبة', '2026-12-17', '2027-01-10'],
  [F, 'Winter break for faculty', 'العطلة الشتوية لأعضاء الهيئة التدريسية', '2026-12-21', '2027-01-03'],
  [F, 'Re-sit exams', 'امتحانات الإعادة', '2027-01-05', '2027-01-07'],
  [S, 'Classes begin', 'بدء الدراسة', '2027-01-11', null],
  [S, 'Registration', 'التسجيل', '2027-01-11', '2027-01-22'],
  [S, 'Midterm exams', 'امتحانات منتصف الفصل', '2027-02-15', '2027-02-26'],
  [S, 'Spring break for students and faculty', 'عطلة الربيع للطلبة وأعضاء الهيئة التدريسية', '2027-04-05', '2027-04-09'],
  [S, 'Last day of classes', 'آخر يوم دراسي', '2027-04-30', null],
  [S, 'Final exams', 'الامتحانات النهائية', '2027-05-03', '2027-05-12'],
  [S, 'Results announcement', 'إعلان النتائج', '2027-05-14', null],
  [S, 'Re-sit exams', 'امتحانات الإعادة', '2027-05-20', '2027-05-22'],
  [S1, 'Classes begin', 'بدء الدراسة', '2027-05-24', null],
  [S1, 'Registration', 'التسجيل', '2027-05-24', '2027-05-28'],
  [S1, 'Last day of classes', 'آخر يوم دراسي', '2027-06-25', null],
  [S1, 'Final exams and results announcement', 'الامتحانات النهائية وإعلان النتائج', '2027-06-28', '2027-06-29'],
  [S1, 'Re-sit exams', 'امتحانات الإعادة', '2027-07-01', '2027-07-02'],
  [S2, 'Clinical training begins', 'بدء التدريب السريري', '2027-07-05', null],
  [S2, 'Registration', 'التسجيل', '2027-07-05', '2027-07-09'],
  [S2, 'Last day of clinical training', 'آخر يوم في التدريب السريري', '2027-08-06', null],
];
void ({} as E);
(async () => {
  const { data: existing } = await sb.from('events').select('title,starts_on').eq('category', 'academic');
  const have = new Set((existing ?? []).map(e => e.title + e.starts_on));
  const desc = '<p>From the DMU Academic Calendar 2026–2027. Religious and public holidays are subject to confirmation.</p><p><a href="/academic-calendar-2">View the full academic calendar</a></p>';
  const descAr = '<p>من التقويم الأكاديمي لجامعة دبي الطبية 2026–2027. العطلات الدينية والرسمية خاضعة للتأكيد.</p><p><a href="/academic-calendar-2">عرض التقويم الأكاديمي كاملًا</a></p>';
  const toAdd = rows.map(([sem, en, ar, start, end]) => ({
    title: `${en} – ${sem}`, title_ar: `${ar} – ${AR[sem]}`, starts_on: start, ends_on: end, category: 'academic', status: 'published',
    description: desc, description_ar: descAr, location: 'Dubai Medical University', location_ar: 'جامعة دبي الطبية',
  })).filter(r => !have.has(r.title + r.starts_on));
  if (toAdd.length) { const { error } = await sb.from('events').insert(toAdd); if (error) throw error; }
  console.log(`academic dates added: ${toAdd.length}`);
})();
