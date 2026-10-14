import Link from 'next/link';
import Image from 'next/image';
import type { Category, Post } from '@/lib/types';
import { fmtDate, truncate } from '@/lib/format';

export default function NewsCard({ post, cats, large = false }: { post: Post; cats: Category[]; large?: boolean }) {
  const catNames = post.categories.map(c => cats.find(x => x.slug === c)?.name).filter(Boolean).slice(0, 2);
  return (
    <Link href={`/news/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-gold-200 hover:shadow-[var(--shadow-lift)]">
      <div className={`relative overflow-hidden bg-sand-100 ${large ? 'aspect-[4/3] lg:aspect-auto lg:min-h-[340px] lg:flex-1' : 'aspect-[16/10]'}`}>
        {post.cover_image && <Image src={post.cover_image} alt="" fill sizes={large ? '(min-width:1024px) 50vw, 100vw' : '(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'} className="object-cover transition duration-700 group-hover:scale-105" />}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <time className="font-semibold uppercase tracking-wider text-bronze-600">{fmtDate(post.published_at, { day: 'numeric', month: 'short', year: 'numeric' })}</time>
          {catNames.map(n => <span key={n} className="rounded-full bg-sand-100 px-2.5 py-1 text-stone-500">{n}</span>)}
        </div>
        <h3 className={`font-display mt-3 leading-snug text-ink group-hover:text-bronze-700 ${large ? 'text-2xl' : 'text-xl'}`}>{post.title}</h3>
        {post.excerpt && <p className="mt-3 text-[.94rem] leading-relaxed text-stone-500">{truncate(post.excerpt, large ? 220 : 130)}</p>}
      </div>
    </Link>
  );
}
