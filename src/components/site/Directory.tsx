'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Mail, Phone, Search, UserRound } from 'lucide-react';
import type { Person } from '@/lib/types';
import { collegeName, lhref, pick, t, type Locale } from '@/lib/i18n';

const norm = (s?: string | null) => (s ?? '').toLowerCase();

export default function Directory({ people, locale }: { people: Person[]; locale: Locale }) {
  const [q, setQ] = useState('');
  const [college, setCollege] = useState('All');
  const [letter, setLetter] = useState('');
  const colleges = useMemo(() => ['All', ...Array.from(new Set(people.map(p => p.college).filter(Boolean) as string[])).sort()], [people]);
  const letters = useMemo(() => Array.from(new Set(people.map(p => p.name.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')[0]?.toUpperCase()))).sort(), [people]);
  const list = people.filter(p =>
    (college === 'All' || p.college === college) &&
    (!q || [p.name, p.title, p.department, p.name_ar, p.title_ar, p.department_ar].some(x => norm(x).includes(norm(q)))) &&
    (!letter || p.name.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').toUpperCase().startsWith(letter)));
  return (
    <div>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-4 md:p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-full border border-line bg-sand-50 px-4">
            <Search className="size-4 text-stone-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t(locale, 'searchPeople')} className="w-full bg-transparent py-3 outline-none" />
          </label>
          <select value={college} onChange={e => setCollege(e.target.value)} className="rounded-full border border-line bg-sand-50 px-4 py-3 outline-none">
            {colleges.map(c => <option key={c} value={c}>{c === 'All' ? t(locale, 'allDepartments') : collegeName(c, locale)}</option>)}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          <button onClick={() => setLetter('')} className={`rounded-full px-3 py-1.5 text-sm ${!letter ? 'bg-espresso text-white' : 'hover:bg-sand-100'}`}>{t(locale, 'all')}</button>
          {letters.map(l => <button key={l} onClick={() => setLetter(l === letter ? '' : l)} className={`size-8 rounded-full text-sm ${letter === l ? 'bg-espresso text-white' : 'hover:bg-sand-100'}`}>{l}</button>)}
        </div>
      </div>
      <p className="mt-6 text-sm text-stone-500">{list.length} {list.length === 1 ? t(locale, 'person') : t(locale, 'people')}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(p => {
          const inner = (
            <>
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-sand-100">
                {p.photo ? <Image src={p.photo} alt="" fill sizes="80px" className="object-cover object-top" /> : <UserRound className="m-auto mt-5 size-10 text-stone-500/50" />}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight text-ink">{pick(p, 'name', locale)}</p>
                {p.title && <p className="mt-1 text-sm text-ink/75">{pick(p, 'title', locale)}</p>}
                {p.department && <p className="mt-1 text-xs uppercase tracking-wider text-bronze-600">{pick(p, 'department', locale)}</p>}
                <div className="mt-3 flex flex-col gap-1 text-sm text-stone-500">
                  {p.email && <span className="ltr flex items-center gap-2 truncate"><Mail className="size-3.5 shrink-0" />{p.email}</span>}
                  {p.phone && <span className="ltr flex items-center gap-2"><Phone className="size-3.5 shrink-0" />{p.phone}</span>}
                </div>
              </div>
            </>
          );
          const cls = 'flex gap-4 rounded-[var(--radius-card)] border border-line bg-white p-5 transition';
          return p.slug
            ? <Link key={p.name} href={lhref(locale, `/people/${p.slug}`)} className={`${cls} hover:-translate-y-0.5 hover:border-gold-200 hover:shadow-[var(--shadow-soft)]`}>{inner}</Link>
            : <div key={p.name} className={cls}>{inner}</div>;
        })}
      </div>
    </div>
  );
}
