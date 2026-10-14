'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import type { Program } from '@/lib/types';
import { collegeName, lhref, pick, t, type Locale } from '@/lib/i18n';

export default function ProgramExplorer({ programs, locale }: { programs: Program[]; locale: Locale }) {
  const short = (c: string) => locale === 'ar' ? collegeName(c, locale).replace('كلية ', '') : c.replace('College of ', '');
  const [level, setLevel] = useState('All');
  const [college, setCollege] = useState('All');
  const colleges = useMemo(() => ['All', ...Array.from(new Set(programs.map(p => p.college)))], [programs]);
  const list = programs.filter(p => (level === 'All' || p.level === level) && (college === 'All' || p.college === college));
  const chip = (active: boolean) => `rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-espresso text-white' : 'bg-white text-ink/75 border border-line hover:border-gold-500 hover:text-ink'}`;
  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {['All', 'Undergraduate', 'Postgraduate'].map(l => <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>{l === 'All' ? t(locale, 'allLevels') : t(locale, l as 'Undergraduate')}</button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {colleges.map(c => <button key={c} onClick={() => setCollege(c)} className={chip(college === c)}>{c === 'All' ? t(locale, 'allColleges') : short(c)}</button>)}
        </div>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map(p => (
          <Link key={p.title + p.page_path} href={lhref(locale, '/' + (p.page_path ?? ''))} className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white border border-line transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
            <div className="relative aspect-[3/2] overflow-hidden bg-sand-100">
              {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1280px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
              <span className="absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-bronze-700 backdrop-blur">{t(locale, p.level as 'Undergraduate')}</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-bronze-600">{short(p.college)}</p>
              <h3 className="font-display mt-2 flex-1 text-lg leading-snug">{pick(p, 'title', locale)}</h3>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm text-stone-500">
                {p.start_date && <span className="flex items-center gap-2"><CalendarDays className="size-4 text-gold-500" />{t(locale, 'starts')} {pick(p, 'start_date', locale)}</span>}
                <ArrowUpRight className="flip-rtl size-5 text-ink/40 transition group-hover:text-bronze-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
