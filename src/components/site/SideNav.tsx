'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MenuGroup } from '@/lib/types';
import { label as lbl, lhref, type Locale } from '@/lib/i18n';

const norm = (u: string) => u.replace(/\/+$/, '').toLowerCase();

export default function SideNav({ groups, locale }: { groups: MenuGroup[]; locale: Locale }) {
  const pathname = norm(usePathname());
  return (
    <nav aria-label="Section" className="space-y-6 lg:sticky lg:top-44">
      {groups.map(g => (
        <div key={g.title} className="rounded-[var(--radius-card)] border border-line bg-white p-2">
          {g.title && <p className="px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-[.16em] text-bronze-600">{lbl(g, locale)}</p>}
          <ul>
            {g.links.map(l => {
              const active = l.url && norm(lhref(locale, l.url)) === pathname;
              const cls = `flex items-center justify-between rounded-xl px-3 py-2.5 text-[.93rem] transition ${active ? 'bg-espresso text-white' : 'text-ink/80 hover:bg-sand-100 hover:text-ink'}`;
              return (
                <li key={l.label + l.url}>
                  {!l.url ? <span className={cls}>{lbl(l, locale)}</span>
                    : /^https?:/.test(l.url) ? <a href={l.url} target="_blank" rel="noopener" className={cls}>{lbl(l, locale)}</a>
                      : <Link href={lhref(locale, l.url)} className={cls} aria-current={active ? 'page' : undefined}>{lbl(l, locale)}</Link>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
