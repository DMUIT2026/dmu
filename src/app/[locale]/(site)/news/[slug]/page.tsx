import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/site/Header';
import RichText from '@/components/site/RichText';
import NewsCard from '@/components/site/NewsCard';
import { getCategories, getPost, getPosts } from '@/lib/content';
import { fmtDate, stripHtml, truncate } from '@/lib/format';

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(decodeURIComponent(slug));
  if (!post) return {};
  return { title: post.title, description: post.excerpt || truncate(stripHtml(post.content), 160), openGraph: { type: 'article', images: post.cover_image ? [post.cover_image] : undefined } };
}

export default async function NewsArticle({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(decodeURIComponent(slug));
  if (!post) notFound();
  const [cats, related] = await Promise.all([getCategories(), getPosts({ categories: post.categories.slice(0, 1), perPage: 4 })]);
  const more = related.posts.filter(p => p.slug !== post.slug).slice(0, 3);
  return (
    <>
      <Header />
      <article className="pt-36 md:pt-44">
        <div className="container-x max-w-4xl">
          <Link href="/news" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-ink"><ArrowLeft className="size-4" /> All news</Link>
          <div className="rise mt-8 flex flex-wrap items-center gap-3 text-sm">
            <time className="font-semibold uppercase tracking-wider text-bronze-600">{fmtDate(post.published_at)}</time>
            {post.categories.map(c => { const n = cats.find(x => x.slug === c); return n && <Link key={c} href={`/news/category/${c}`} className="rounded-full bg-sand-100 px-3 py-1 text-stone-500 hover:bg-sand-200">{n.name}</Link>; })}
          </div>
          <h1 className="rise rise-2 font-display mt-5 text-4xl font-medium leading-[1.1] md:text-5xl">{post.title}</h1>
        </div>
        {post.cover_image && (
          <div className="container-x mt-10 max-w-5xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-sand-100">
              <Image src={post.cover_image} alt="" fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
            </div>
          </div>
        )}
        <div className="container-x max-w-3xl py-12 md:py-16"><RichText html={post.content} /></div>
      </article>
      {more.length > 0 && (
        <section className="border-t border-line bg-sand-100/60 py-16 md:py-20">
          <div className="container-x">
            <h2 className="font-display text-3xl">More news</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{more.map(p => <NewsCard key={p.slug} post={p} cats={cats} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
