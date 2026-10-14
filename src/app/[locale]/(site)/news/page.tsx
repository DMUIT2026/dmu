import type { Metadata } from 'next';
import Header from '@/components/site/Header';
import PageHero from '@/components/site/PageHero';
import NewsList from '@/components/site/NewsList';
import { isLocale, t, type Locale } from '@/lib/i18n';

export const revalidate = 300;
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; const l: Locale = isLocale(locale) ? locale : 'en';
  return { title: t(l, 'news'), description: t(l, 'newsSub') };
}

export default async function NewsPage({ params, searchParams }: Props) {
  const [{ locale: lc }, sp] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(lc) ? lc : 'en';
  return (
    <>
      <Header overlay locale={locale} />
      <PageHero locale={locale} title={t(locale, 'news')} eyebrow={t(locale, 'media')} crumbs={[{ label: t(locale, 'news') }]} subtitle={t(locale, 'newsSub')} compact />
      <section className="container-x py-14 md:py-20"><NewsList locale={locale} page={Math.max(1, Number(sp.page) || 1)} basePath="/news" /></section>
    </>
  );
}
