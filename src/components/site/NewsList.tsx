import Link from 'next/link';
import { getCategories, getPosts } from '@/lib/content';
import NewsCard from './NewsCard';
import Pagination from './Pagination';
import { lhref, pick, t, type Locale } from '@/lib/i18n';

/** Grid of news filtered by categories, with category chips and pagination. */
export default async function NewsList({ locale, categories, page, basePath, showChips = true, activeChip }: {
  locale: Locale; categories?: string[]; page: number; basePath: string; showChips?: boolean; activeChip?: string;
}) {
  const perPage = 12;
  const [{ posts, total }, cats] = await Promise.all([getPosts({ categories, page, perPage }), getCategories()]);
  const chips = cats.filter(c => (c.sort_order ?? 50) < 50);
  return (
    <div>
      {showChips && (
        <div className="mb-10 flex flex-wrap gap-2">
          <Link href={lhref(locale, '/news')} className={`rounded-full border px-4 py-2 text-sm transition ${!activeChip ? 'border-espresso bg-espresso text-white' : 'border-line bg-white hover:border-gold-500'}`}>{t(locale, 'allNews')}</Link>
          {chips.map(c => (
            <Link key={c.slug} href={lhref(locale, `/news/category/${c.slug}`)} className={`rounded-full border px-4 py-2 text-sm transition ${activeChip === c.slug ? 'border-espresso bg-espresso text-white' : 'border-line bg-white hover:border-gold-500'}`}>{pick(c, 'name', locale)}</Link>
          ))}
        </div>
      )}
      {posts.length === 0 ? <p className="text-stone-500">{t(locale, 'noNews')}</p> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => <NewsCard key={p.slug} post={p} cats={cats} locale={locale} />)}
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total / perPage)} href={p => lhref(locale, p === 1 ? basePath : `${basePath}?page=${p}`)} />
    </div>
  );
}
