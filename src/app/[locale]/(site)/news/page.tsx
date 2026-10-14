import type { Metadata } from 'next';
import Header from '@/components/site/Header';
import PageHero from '@/components/site/PageHero';
import NewsList from '@/components/site/NewsList';

export const revalidate = 300;
export const metadata: Metadata = { title: 'News & Events', description: 'The latest news and events from Dubai Medical University.' };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <Header overlay />
      <PageHero title="News & Events" eyebrow="Media" crumbs={[{ label: 'News & Events' }]} subtitle="Stories, achievements and events from across Dubai Medical University." compact />
      <section className="container-x py-14 md:py-20"><NewsList page={Math.max(1, Number(sp.page) || 1)} basePath="/news" /></section>
    </>
  );
}
