'use client';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

// Live list of DMU publications from Scopus (through the website's own cached Scopus connection).
const FEED = '/api/scopus/publications';
const COLLEGES: [string, string, string][] = [
  ['Dubai Medical University', 'All of DMU', 'جامعة دبي الطبية'],
  ['Dubai Medical College', 'College of Medicine', 'كلية الطب'],
  ['Dubai Pharmacy College', 'College of Pharmacy', 'كلية الصيدلة'],
  ['College of Nursing', 'College of Nursing', 'كلية التمريض'],
];
type Entry = { 'dc:title'?: string; 'prism:publicationName'?: string; 'prism:coverDate'?: string; 'prism:doi'?: string; 'dc:creator'?: string; 'citedby-count'?: string; subtypeDescription?: string; 'prism:volume'?: string; 'prism:pageRange'?: string };
const T = {
  en: { college: 'College', year: 'Year', all: 'All years', results: 'publications found', more: 'Load more', loading: 'Loading publications…', error: 'Publications could not be loaded right now. Please try again later.', cited: 'Cited', source: 'Source: Scopus' },
  ar: { college: 'الكلية', year: 'السنة', all: 'جميع السنوات', results: 'منشورًا', more: 'تحميل المزيد', loading: 'جارٍ تحميل المنشورات…', error: 'تعذّر تحميل المنشورات حاليًا. يُرجى المحاولة لاحقًا.', cited: 'الاستشهادات', source: 'المصدر: Scopus' },
};

export default function ScopusPublications({ locale, initialCollege }: { locale: Locale; initialCollege?: string }) {
  const t = T[locale];
  const [college, setCollege] = useState(initialCollege ?? COLLEGES[0][0]);
  const [year, setYear] = useState('');
  const [items, setItems] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const years = Array.from({ length: new Date().getFullYear() + 1 - 2014 }, (_, i) => String(new Date().getFullYear() + 1 - i));

  const load = useCallback(async (start: number) => {
    setBusy(true); setError(false);
    try {
      const r = await fetch(`${FEED}?college=${encodeURIComponent(college)}&year=${encodeURIComponent(year)}&start=${start}`);
      const d = await r.json();
      const sr = d['search-results'] ?? {};
      const entries: Entry[] = (sr.entry ?? []).filter((e: Entry & { error?: string }) => !e.error);
      setTotal(Number(sr['opensearch:totalResults'] ?? 0));
      setItems(prev => (start === 0 ? entries : [...prev, ...entries]));
    } catch { setError(true); }
    finally { setBusy(false); }
  }, [college, year]);
  useEffect(() => { load(0); }, [load]);

  const sel = 'rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-gold-500';
  return (
    <div className="not-prose">
      <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4">
        <label className="grid gap-1 text-xs font-semibold text-stone-500">{t.college}
          <select value={college} onChange={e => setCollege(e.target.value)} className={sel}>{COLLEGES.map(([v, en, ar]) => <option key={v} value={v}>{locale === 'ar' ? ar : en}</option>)}</select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-stone-500">{t.year}
          <select value={year} onChange={e => setYear(e.target.value)} className={sel}><option value="">{t.all}</option>{years.map(y => <option key={y}>{y}</option>)}</select>
        </label>
        <p className="ms-auto text-sm text-stone-500">{total ? `${total.toLocaleString('en')} ${t.results}` : ''} · {t.source}</p>
      </div>
      {error && <p className="mt-6 rounded-xl bg-sand-100 p-4 text-sm">{t.error}</p>}
      <ol className="mt-6 space-y-3">
        {items.map((e, i) => (
          <li key={(e['prism:doi'] ?? '') + i} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {e.subtypeDescription && <span className="rounded-full bg-sand-100 px-2.5 py-1 font-medium text-bronze-700">{e.subtypeDescription}</span>}
              {e['prism:coverDate'] && <span className="text-stone-500">{e['prism:coverDate'].slice(0, 4)}</span>}
              {Number(e['citedby-count']) > 0 && <span className="text-stone-500">· {t.cited}: {e['citedby-count']}</span>}
            </div>
            <p dir="ltr" className="mt-2 text-start font-medium leading-snug text-ink">{e['dc:title']}</p>
            <p dir="ltr" className="mt-1 text-start text-sm text-stone-500">{[e['dc:creator'], e['prism:publicationName'], e['prism:volume'] && `vol. ${e['prism:volume']}`, e['prism:pageRange']].filter(Boolean).join(' · ')}</p>
            {e['prism:doi'] && <a href={`https://doi.org/${e['prism:doi']}`} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-sm text-bronze-700 hover:underline" dir="ltr">doi.org/{e['prism:doi']} <ExternalLink className="size-3.5" /></a>}
          </li>
        ))}
      </ol>
      {busy && <p className="mt-6 flex items-center gap-2 text-stone-500"><Loader2 className="size-4 animate-spin" />{t.loading}</p>}
      {!busy && items.length < total && <button onClick={() => load(items.length)} className="btn btn-outline mt-6">{t.more}</button>}
    </div>
  );
}
