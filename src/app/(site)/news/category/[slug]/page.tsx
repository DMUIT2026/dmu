import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/site/Header';
import PageHero from '@/components/site/PageHero';
import NewsList from '@/components/site/NewsList';
import { getCategories } from '@/lib/content';

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCategories()).find(c => c.slug === slug);
  return { title: c ? `${c.name} News` : 'News' };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = (await getCategories()).find(c => c.slug === slug);
  if (!cat) notFound();
  return (
    <>
      <Header overlay />
      <PageHero title={`${cat.name} News`} eyebrow="Media" crumbs={[{ label: 'News & Events', href: '/news' }, { label: cat.name }]} compact />
      <section className="container-x py-14 md:py-20">
        <NewsList categories={[slug]} page={Math.max(1, Number(sp.page) || 1)} basePath={`/news/category/${slug}`} activeChip={slug} />
      </section>
    </>
  );
}
