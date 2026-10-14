import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Amiri, Fraunces, IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from 'next/font/google';
import { dirOf, isLocale, locales } from '@/lib/i18n';
import '../globals.css';
import { a11yBootScript } from '@/components/site/AccessibilityToolbar';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', axes: ['opsz', 'SOFT'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri', display: 'swap' });
const plexAr = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['300', '400', '500', '600', '700'], variable: '--font-plex-ar', display: 'swap' });

export const dynamicParams = false;
export function generateStaticParams() { return locales.map(locale => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ar = locale === 'ar';
  const name = ar ? 'جامعة دبي الطبية' : 'Dubai Medical University';
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dmu.ae'),
    title: { default: name, template: `%s | ${name}` },
    description: ar
      ? 'جامعة دبي الطبية – تعليم الطب والصيدلة والتمريض والعلوم الصحية في دبي. نُعدّ الجيل القادم من قادة الرعاية الصحية.'
      : 'Dubai Medical University (DMU) — medicine, pharmacy, nursing and health sciences education in Dubai. Shaping the next generation of health care leaders.',
    openGraph: { siteName: name, type: 'website', locale: ar ? 'ar_AE' : 'en_AE' },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html suppressHydrationWarning lang={locale} dir={dirOf(locale)} data-scroll-behavior="smooth" className={`${fraunces.variable} ${jakarta.variable} ${amiri.variable} ${plexAr.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: a11yBootScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
