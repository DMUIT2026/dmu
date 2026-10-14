import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Header from '@/components/site/Header';
import PageHero from '@/components/site/PageHero';
import { search } from '@/lib/content';
import { truncate } from '@/lib/format';
import { isLocale, lhref, t, type Locale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; return { title: t(isLocale(locale) ? locale : 'en', 'search') };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const [{ locale: lc }, sp] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const q = sp.q?.trim() ?? '';
  const hits = q ? await search(q, locale) : [];
  const kind = { Page: t(locale, 'kindPage'), News: t(locale, 'kindNews'), Person: t(locale, 'kindPerson') };
  return (
    <>
      <Header overlay locale={locale} />
      <PageHero locale={locale} title={q ? `${t(locale, 'resultsFor')} “${q}”` : t(locale, 'search')} crumbs={[{ label: t(locale, 'search') }]} compact>
        <form className="flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 ps-5 text-ink">
          <Search className="size-5 text-stone-500" />
          <input name="q" defaultValue={q} placeholder={t(locale, 'searchSite')} className="w-full bg-transparent py-2 outline-none" />
          <button className="btn btn-dark !py-2.5">{t(locale, 'search')}</button>
        </form>
      </PageHero>
      <section className="container-x max-w-4xl py-14">
        {q && <p className="mb-6 text-stone-500">{hits.length} {t(locale, 'results')}</p>}
        <ul className="divide-y divide-line">
          {hits.map(h => (
            <li key={h.url} className="py-5">
              <Link href={lhref(locale, h.url)} className="group block">
                <span className="text-xs font-semibold uppercase tracking-widest text-bronze-600">{kind[h.kind]}</span>
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
