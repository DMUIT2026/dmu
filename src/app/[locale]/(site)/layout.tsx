import Footer from '@/components/site/Footer';
import { isLocale, t } from '@/lib/i18n';

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : 'en';
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">{t(locale, 'skip')}</a>
      <main id="main">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
