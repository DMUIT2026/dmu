'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { lhref, t, type Locale } from '@/lib/i18n';

// Shown when a page does not exist (no site header here because this view cannot load data).
export default function NotFound() {
  const locale: Locale = usePathname()?.startsWith('/ar') ? 'ar' : 'en';
  return (
    <section className="container-x flex min-h-[70vh] flex-col items-start justify-center pt-24 pb-20">
      <Link href={lhref(locale, '/')}><img src="/brand/logo.png" alt="" className="h-12 w-auto" /></Link>
      <p className="eyebrow mt-12">404</p>
      <h1 className="font-display mt-4 text-5xl md:text-6xl">{t(locale, 'notFoundTitle')}</h1>
      <p className="mt-4 max-w-xl text-lg text-stone-500">{t(locale, 'notFoundText')}</p>
      <div className="mt-8 flex gap-3"><Link href={lhref(locale, '/')} className="btn btn-dark">{t(locale, 'goHome')}</Link><Link href={lhref(locale, '/search')} className="btn btn-outline">{t(locale, 'search')}</Link></div>
    </section>
  );
}
