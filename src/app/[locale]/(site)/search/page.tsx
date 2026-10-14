import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Header from '@/components/site/Header';
import PageHero from '@/components/site/PageHero';
import { search } from '@/lib/content';
import { truncate } from '@/lib/format';

export const metadata: Metadata = { title: 'Search' };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? '';
  const hits = q ? await search(q) : [];
  return (
    <>
      <Header overlay />
      <PageHero title={q ? `Results for “${q}”` : 'Search'} crumbs={[{ label: 'Search' }]} compact>
        <form className="flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-5 text-ink">
          <Search className="size-5 text-stone-500" />
          <input name="q" defaultValue={q} placeholder="Search the website" className="w-full bg-transparent py-2 outline-none" />
          <button className="btn btn-dark !py-2.5">Search</button>
        </form>
      </PageHero>
      <section className="container-x max-w-4xl py-14">
        {q && <p className="mb-6 text-stone-500">{hits.length} result{hits.length === 1 ? '' : 's'}</p>}
        <ul className="divide-y divide-line">
          {hits.map(h => (
            <li key={h.url} className="py-5">
              <Link href={h.url} className="group block">
                <span className="text-xs font-semibold uppercase tracking-widest text-bronze-600">{h.kind}</span>
                <p className="font-display mt-1 text-xl group-hover:text-bronze-700">{h.title}</p>
                {h.snippet && <p className="mt-1 text-sm text-stone-500">{truncate(h.snippet, 180)}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
