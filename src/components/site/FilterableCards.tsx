'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { collegeName, type Locale } from '@/lib/i18n';

/** A grid of profile cards with search, college and A–Z filters. colleges[i] belongs to the i-th card. */
export default function FilterableCards({ html, colleges, locale }: { html: string; colleges: string[]; locale: Locale }) {
  const [q, setQ] = useState('');
  const [college, setCollege] = useState('All');
  const [letter, setLetter] = useState('');
  const options = useMemo(() => ['All', ...Array.from(new Set(colleges)).sort()], [colleges]);
  // Name without titles (Dr., Prof., د., الدكتورة …); Arabic hamza forms count as ا for the A–Z buttons.
  const bare = (n: string) => n.trim().replace(/^((Prof\.?|Dr\.?|Mr\.?|Ms\.?|Mrs\.?|أ\.\s?د\.|د\.|الأستاذة|الأستاذ|الدكتورة|الدكتور|السيدة|السيد)\s*)+/i, '').trim().replace(/^[أإآ]/, 'ا');
  const plain = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

  // Split the page text into: what comes before the card grid, each card, and what comes after.
  const parts = useMemo(() => {
    const open = html.indexOf('<div class="cards">');
    if (open < 0) return { before: html, cards: [] as { html: string; name: string; text: string }[], after: '' };
    const found = [...html.slice(open).matchAll(/<(a|div) class="card"[\s\S]*?<\/\1>/g)];
    const last = found.at(-1);
    const close = last ? open + last.index! + last[0].length : open;
    const rest = html.slice(close).replace(/^\s*<\/div>/, '');
    return {
      before: html.slice(0, open),
      cards: found.map(m => ({ html: m[0], name: plain(m[0].match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? ''), text: plain(m[0]).toLowerCase() })),
      after: rest,
    };
  }, [html]);
  const letters = useMemo(() => Array.from(new Set(parts.cards.map(c => bare(c.name)[0]?.toUpperCase()).filter(Boolean))).sort(), [parts]);
  const visible = parts.cards.map((c, i) =>
    (college === 'All' || colleges[i] === college)
    && (!q || c.text.includes(q.toLowerCase().trim()))
    && (!letter || bare(c.name).toUpperCase().startsWith(letter)));
  const shown = visible.filter(Boolean).length;

  const ar = locale === 'ar';
  return (
    <div>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-full border border-line bg-sand-50 px-4">
            <Search className="size-4 text-stone-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={ar ? 'ابحث بالاسم أو القسم' : 'Search by name or department'} className="w-full bg-transparent py-3 outline-none" />
          </label>
          <select value={college} onChange={e => setCollege(e.target.value)} className="rounded-full border border-line bg-sand-50 px-4 py-3 outline-none">
            {options.map(c => <option key={c} value={c}>{c === 'All' ? (ar ? 'جميع الكليات' : 'All colleges') : collegeName(c, locale)}</option>)}
          </select>
        </div>
        {letters.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-1">
            <button onClick={() => setLetter('')} className={`rounded-full px-3 py-1.5 text-sm ${!letter ? 'bg-espresso text-white' : 'hover:bg-sand-100'}`}>{ar ? 'الكل' : 'All'}</button>
            {letters.map(l => <button key={l} onClick={() => setLetter(l === letter ? '' : l)} className={`size-8 rounded-full text-sm ${letter === l ? 'bg-espresso text-white' : 'hover:bg-sand-100'}`}>{l}</button>)}
          </div>
        )}
      </div>
      <p className="mt-6 text-sm text-stone-500">{shown} {ar ? 'شخصًا' : shown === 1 ? 'person' : 'people'}</p>
      <div className="prose-dmu">
        {parts.before && <div dangerouslySetInnerHTML={{ __html: parts.before }} />}
        <div className="cards">
          {parts.cards.map((c, i) => <div key={i} className={visible[i] ? "contents" : "hidden"} dangerouslySetInnerHTML={{ __html: c.html }} />)}
        </div>
        {parts.after && <div dangerouslySetInnerHTML={{ __html: parts.after }} />}
      </div>
    </div>
  );
}
