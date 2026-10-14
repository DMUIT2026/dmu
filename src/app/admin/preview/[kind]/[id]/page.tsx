import { notFound } from 'next/navigation';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import PageHero from '@/components/site/PageHero';
import RichText from '@/components/site/RichText';
import { requireAdmin } from '@/lib/admin-auth';
import { fmtDate, placeArticleImages } from '@/lib/format';

export const dynamic = 'force-dynamic';

// Shows a page or article exactly as visitors would see it, including drafts.
export default async function Preview({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const { supabase } = await requireAdmin();
  const table = kind === 'post' ? 'posts' : 'pages';
  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  return (
    <div className="bg-sand-50">
      <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-espresso px-5 py-2 text-sm text-white shadow-lg">Preview{data.status === 'draft' ? ' of a draft — not visible to visitors' : ''}</div>
      <Header overlay locale="en" />
      <PageHero locale="en" title={data.title} image={kind === 'post' ? data.cover_image : data.hero_image} eyebrow={kind === 'post' ? fmtDate(data.published_at) : undefined} subtitle={data.subtitle} />
      <section className="container-x max-w-3xl py-16"><RichText html={kind === 'post' ? placeArticleImages(data.content, data.images) : data.content} /></section>
      <Footer locale="en" />
    </div>
  );
}
