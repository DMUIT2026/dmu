'use client';
import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

const KEY = 'dmu-cookie-notice';
const TXT = {
  en: { text: 'This website uses only essential cookies that it needs to work (for example, to remember your accessibility settings and keep staff signed in). We do not use advertising or tracking cookies.', ok: 'OK, got it' },
  ar: { text: 'يستخدم هذا الموقع ملفات تعريف الارتباط الأساسية فقط اللازمة لعمله (مثل حفظ إعدادات إمكانية الوصول وإبقاء الموظفين مسجّلين الدخول). لا نستخدم ملفات تعريف الارتباط الإعلانية أو ملفات التتبّع.', ok: 'حسنًا، فهمت' },
};

export default function CookieNotice({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem(KEY)) setShow(true); } catch { setShow(true); } }, []);
  if (!show) return null;
  const close = () => { try { localStorage.setItem(KEY, new Date().toISOString()); } catch { /* ignore */ } setShow(false); };
  return (
    <div role="region" aria-label={locale === 'ar' ? 'ملفات تعريف الارتباط' : 'Cookies'} className="fixed bottom-3 start-3 end-20 z-[54] max-w-3xl sm:start-6 sm:end-24 sm:bottom-6 lg:mx-auto rounded-2xl border border-line bg-white p-4 shadow-2xl sm:inset-x-6 sm:bottom-6 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Cookie className="hidden size-8 shrink-0 text-gold-500 sm:block" />
        <p className="flex-1 text-sm leading-relaxed text-ink/80">{TXT[locale].text}</p>
        <button type="button" onClick={close} className="btn btn-dark shrink-0 justify-center !py-2.5">{TXT[locale].ok}</button>
      </div>
    </div>
  );
}
