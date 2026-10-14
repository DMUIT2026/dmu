'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MenuGroup } from '@/lib/types';
import { label as lbl, lhref, type Locale } from '@/lib/i18n';

/** Secondary bar for a college's own pages (Discover, Programs, Admissions, Research...). */
export default function CollegeNav({ title, url, groups, locale }: { title: string; url?: string | null; groups: MenuGroup[]; locale: Locale }) {
  const [open, setOpen] = useState<number | null>(null);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return (
    <div ref={ref} className="sticky top-[72px] lg:top-[108px] z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="container-x flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Link href={lhref(locale, url ?? '#')} className="font-display shrink-0 py-3.5 pe-4 text-[1.05rem] text-bronze-700 border-e border-line me-2 hover:text-ink">
          {title.replace(/\s*\(.*\)\s*/, '')}
        </Link>
        {groups.map((g, i) => !g.links?.length && g.url ? (
          <Link key={g.title} href={lhref(locale, g.url)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition ${pathname === lhref(locale, g.url) ? 'bg-sand-100 text-ink' : 'text-ink/75 hover:bg-sand-100 hover:text-ink'}`}>{lbl(g, locale)}</Link>
        ) : (
          <div key={g.title} className="relative shrink-0">
            <button type="button" onClick={e => { e.stopPropagation(); setOpen(open === i ? null : i); }} aria-expanded={open === i}
              className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition ${open === i ? 'bg-sand-100 text-ink' : 'text-ink/75 hover:text-ink hover:bg-sand-100'}`}>
              {lbl(g, locale)}<ChevronDown className={`size-3.5 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
          </div>
        ))}
      </div>
      {open !== null && groups[open] && (
        <div className="absolute inset-x-0 top-full border-t border-line bg-white shadow-[0_30px_50px_-30px_rgb(36_28_19/0.35)]">
          <div className="container-x grid gap-1 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups[open].links.map(l => (
              <div key={l.label}>
                {l.url ? (
                  /^https?:/.test(l.url)
                    ? <a href={l.url} target="_blank" rel="noopener" className="block rounded-lg px-3 py-2 text-[.95rem] hover:bg-sand-100">{lbl(l, locale)}</a>
                    : <Link href={lhref(locale, l.url)} className={`block rounded-lg px-3 py-2 text-[.95rem] hover:bg-sand-100 ${pathname === lhref(locale, l.url) ? 'text-bronze-700 font-semibold' : ''}`}>{lbl(l, locale)}</Link>
                ) : <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-bronze-600">{lbl(l, locale)}</p>}
                {l.children?.map(c => c.url && (
                  <Link key={c.label} href={lhref(locale, c.url)} className="block rounded-lg px-6 py-1.5 text-sm text-ink/70 hover:bg-sand-100">{lbl(c, locale)}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
