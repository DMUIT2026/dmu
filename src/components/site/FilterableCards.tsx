'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { collegeName, type Locale } from '@/lib/i18n';

/** A grid of profile cards with search, college and A–Z filters. colleges[i] belongs to the i-th card. */
export default function FilterableCards({ html, colleges, locale }: { html: string; colleges: string[]; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [college, setCollege] = useState('All');
  const [letter, setLetter] = useState('');
  const [shown, setShown] = useState(colleges.length);
  const [letters, setLetters] = useState<string[]>([]);
  const options = useMemo(() => ['All', ...Array.from(new Set(colleges)).sort()], [colleges]);
  const bare = (n: string) => n.replace(/^(Prof\.?|Dr\.?|Mr\.?|Ms\.?|Mrs\.?|أ\.د\.|د\.|السيد|السيدة)\s*/i, '').trim();

  useEffect(() => {
    const cards = Array.from(ref.current?.querySelectorAll<HTMLElement>('.card') ?? []);
    setLetters(Array.from(new Set(cards.map(c => bare(c.querySelector('strong')?.textContent ?? '')[0]?.toUpperCase()).filter(Boolean))).sort());
  }, [html]);
  useEffect(() => {
    const cards = Array.from(ref.current?.querySelectorAll<HTMLElement>('.card') ?? []);
    let n = 0;
    cards.forEach((c, i) => {
      const name = c.querySelector('strong')?.textContent ?? '';
      const ok = (college === 'All' || colleges[i] === college)
        && (!q || c.textContent!.toLowerCase().includes(q.toLowerCase()))
        && (!letter || bare(name).toUpperCase().startsWith(letter));
      c.style.display = ok ? '' : 'none';
      if (ok) n++;
    });
    setShown(n);
  }, [q, college, letter, colleges]);

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
      <div ref={ref} className="prose-dmu" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
