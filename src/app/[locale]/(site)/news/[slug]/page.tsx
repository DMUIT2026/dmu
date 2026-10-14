import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/site/Header';
import RichText from '@/components/site/RichText';
import NewsCard from '@/components/site/NewsCard';
import { getCategories, getPost, getPosts } from '@/lib/content';
import { stripHtml, truncate } from '@/lib/format';
import { fmtDateL, isLocale, lhref, pick, t, type Locale } from '@/lib/i18n';

export const revalidate = 300;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params; const l: Locale = isLocale(locale) ? locale : 'en';
  const post = await getPost(decodeURIComponent(slug));
  if (!post) return {};
  return {
    title: pick(post, 'title', l), description: pick(post, 'excerpt', l) || truncate(stripHtml(pick(post, 'content', l)), 160),
    openGraph: { type: 'article', images: post.cover_image ? [post.cover_image] : undefined },
    alternates: { languages: { en: `/news/${post.slug}`, ar: `/ar/news/${post.slug}` } },
  };
}

export default async function NewsArticle({ params }: Props) {
  const { slug, locale: lc } = await params;
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const post = await getPost(decodeURIComponent(slug));
  if (!post) notFound();
  const [cats, related] = await Promise.all([getCategories(), getPosts({ categories: post.categories.slice(0, 1), perPage: 4 })]);
  const more = related.posts.filter(p => p.slug !== post.slug).slice(0, 3);
  return (
    <>
      <Header locale={locale} />
      <article className="pt-36 md:pt-44">
        <div className="container-x max-w-4xl">
          <Link href={lhref(locale, '/news')} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-ink"><ArrowLeft className="size-4 flip-rtl" /> {t(locale, 'allNews')}</Link>
          <div className="rise mt-8 flex flex-wrap items-center gap-3 text-sm">
            <time className="font-semibold uppercase tracking-wider text-bronze-600">{fmtDateL(post.published_at, locale)}</time>
            {post.categories.map(c => { const n = cats.find(x => x.slug === c); return n && <Link key={c} href={lhref(locale, `/news/category/${c}`)} className="rounded-full bg-sand-100 px-3 py-1 text-stone-500 hover:bg-sand-200">{pick(n, 'name', locale)}</Link>; })}
          </div>
          <h1 className="rise rise-2 font-display mt-5 text-4xl font-medium leading-[1.1] md:text-5xl">{pick(post, 'title', locale)}</h1>
        </div>
        {post.cover_image && (
          <div className="container-x mt-10 max-w-5xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-sand-100">
              <Image src={post.cover_image} alt="" fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
            </div>
          </div>
        )}
        <div className="container-x max-w-3xl py-12 md:py-16"><RichText html={pick(post, 'content', locale)} locale={locale} /></div>
      </article>
      {more.length > 0 && (
        <section className="border-t border-line bg-sand-100/60 py-16 md:py-20">
          <div className="container-x">
            <h2 className="font-display text-3xl">{t(locale, 'moreNews')}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{more.map(p => <NewsCard key={p.slug} post={p} cats={cats} locale={locale} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
