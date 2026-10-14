import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/site/Header';
import PageHero from '@/components/site/PageHero';
import NewsList from '@/components/site/NewsList';
import { getCategories } from '@/lib/content';
import { isLocale, pick, t, type Locale } from '@/lib/i18n';

export const revalidate = 300;
type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params; const l: Locale = isLocale(locale) ? locale : 'en';
  const c = (await getCategories()).find(c => c.slug === slug);
  return { title: c ? `${pick(c, 'name', l)} – ${t(l, 'news')}` : t(l, 'news') };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug, locale: lc }, sp] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const cat = (await getCategories()).find(c => c.slug === slug);
  if (!cat) notFound();
  const name = pick(cat, 'name', locale);
  return (
    <>
      <Header overlay locale={locale} />
      <PageHero locale={locale} title={name} eyebrow={t(locale, 'news')} crumbs={[{ label: t(locale, 'news'), href: '/news' }, { label: name }]} compact />
      <section className="container-x py-14 md:py-20">
        <NewsList locale={locale} categories={[slug]} page={Math.max(1, Number(sp.page) || 1)} basePath={`/news/category/${slug}`} activeChip={slug} />
      </section>
    </>
  );
}
