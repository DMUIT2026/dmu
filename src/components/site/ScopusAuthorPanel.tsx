import { ExternalLink } from 'lucide-react';
import { authorProfile } from '@/lib/scopus';
import type { Locale } from '@/lib/i18n';

const T = {
  en: { title: 'Research profile', source: 'Live from Scopus · updated daily', docs: 'Publications', cites: 'Citations', h: 'h-index', recent: 'Latest publications', cited: 'Cited', open: 'Full Scopus profile' },
  ar: { title: 'الملف البحثي', source: 'مباشرة من Scopus · يُحدَّث يوميًا', docs: 'المنشورات', cites: 'الاستشهادات', h: 'مؤشر h', recent: 'أحدث المنشورات', cited: 'الاستشهادات', open: 'الملف الكامل على Scopus' },
};

/** A researcher's live Scopus metrics and latest publications. Shows only a link when no Scopus key is saved. */
export default async function ScopusAuthorPanel({ authorId, locale }: { authorId?: string | null; locale: Locale }) {
  if (!authorId || !/^\d{6,}$/.test(authorId)) return null;
  const t = T[locale];
  const url = `https://www.scopus.com/authid/detail.uri?authorId=${authorId}`;
  const p = await authorProfile(authorId);
  const stats = p ? ([[t.docs, p.documents], [t.cites, p.citations], [t.h, p.hIndex]] as [string, number | null][]).filter(([, v]) => v != null) : [];
  return (
    <section className="not-prose mt-12 rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl">{t.title}</h2>
        {p && <p className="text-xs text-stone-500">{t.source}</p>}
      </div>
      {stats.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-3">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-sand-100 p-4 text-center">
              <dd className="font-display text-3xl text-bronze-700">{v!.toLocaleString('en')}</dd>
              <dt className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-500">{k}</dt>
            </div>
          ))}
        </dl>
      )}
      {p && p.recent.length > 0 && (
        <>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-widest text-bronze-600">{t.recent}</h3>
          <ol className="mt-3 divide-y divide-line">
            {p.recent.map((r, i) => (
              <li key={i} className="py-3">
                <p dir="ltr" className="text-start font-medium leading-snug">
                  {r.doi ? <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener" className="hover:text-bronze-700 hover:underline">{r.title}</a> : r.title}
                </p>
                <p dir="ltr" className="mt-1 text-start text-sm text-stone-500">{[r.journal, r.year, r.cited ? `${t.cited}: ${r.cited}` : ''].filter(Boolean).join(' · ')}</p>
              </li>
            ))}
          </ol>
        </>
      )}
      <a href={url} target="_blank" rel="noopener" className="btn btn-outline mt-6 !py-2">{t.open} <ExternalLink className="size-4" /></a>
    </section>
  );
}
