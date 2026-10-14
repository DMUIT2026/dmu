'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ChevronDown, Menu as MenuIcon, Phone, Search, X } from 'lucide-react';
import type { MenuLink } from '@/lib/types';

const isExternal = (u?: string | null) => !!u && /^https?:\/\//.test(u);

function NavLink({ item, className, onClick }: { item: MenuLink; className?: string; onClick?: () => void }) {
  if (!item.url) return <span className={className}>{item.label}</span>;
  if (isExternal(item.url))
    return (
      <a href={item.url} target="_blank" rel="noopener" className={className} onClick={onClick}>
        {item.label} <ArrowUpRight className="inline size-3.5 opacity-60" />
      </a>
    );
  return <Link href={item.url} className={className} onClick={onClick}>{item.label}</Link>;
}

export default function HeaderClient({ items, overlay, phone, phoneLink, portals }: {
  items: MenuLink[]; overlay: boolean; phone?: string; phoneLink?: string; portals: { label: string; url: string }[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setOpen(null); setMobile(false); setSearching(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = mobile ? 'hidden' : ''; }, [mobile]);

  const solid = !overlay || scrolled || open !== null || searching;
  const enter = (i: number) => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(i); };
  const leave = () => { closeTimer.current = setTimeout(() => setOpen(null), 160); };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_0_var(--color-line)]' : 'bg-transparent'}`}>
      {/* utility bar */}
      <div className={`hidden lg:block border-b transition-colors ${solid ? 'border-line bg-sand-100/60 text-stone-500' : 'border-white/15 text-white/80'}`}>
        <div className="container-x flex h-9 items-center justify-between text-[.8rem]">
          <div className="flex items-center gap-5">
            {phone && <a href={phoneLink} className="flex items-center gap-1.5 hover:opacity-80"><Phone className="size-3.5" /> {phone}</a>}
            <Link href="/contact-us" className="hover:opacity-80">Contact</Link>
            <Link href="/dmu-faculty-and-staff-directory" className="hover:opacity-80">Directory</Link>
          </div>
          <div className="flex items-center gap-5">
            {portals.map(p => <a key={p.url} href={p.url} target="_blank" rel="noopener" className="hover:opacity-80">{p.label}</a>)}
            <Link href="/academic-calendar-2" className="hover:opacity-80">Academic Calendar</Link>
          </div>
        </div>
      </div>

      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link href="/" aria-label="Dubai Medical University — home" className="shrink-0">
          <Image src={solid ? '/brand/logo.png' : '/brand/logo-white.png'} alt="Dubai Medical University" width={200} height={65} priority className="h-11 w-auto" />
        </Link>

        <nav className="hidden xl:flex items-center gap-1" aria-label="Main">
          {items.map((it, i) => (
            <div key={it.label} className="relative" onMouseEnter={() => it.children?.length && enter(i)} onMouseLeave={leave}>
              {it.children?.length ? (
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                  className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-[.92rem] font-medium transition-colors ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'} ${open === i ? (solid ? 'bg-sand-100' : 'bg-white/10') : ''}`}
                >
                  {it.label}<ChevronDown className={`size-4 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <NavLink item={it} className={`block rounded-full px-3.5 py-2 text-[.92rem] font-medium transition-colors ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'}`} />
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" aria-label="Search" onClick={() => setSearching(s => !s)} className={`grid size-10 place-items-center rounded-full transition-colors ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'}`}>
            {searching ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
          <Link href="/admissions" className="btn btn-gold hidden sm:inline-flex !py-2.5">Apply Now</Link>
          <button type="button" aria-label="Open menu" onClick={() => setMobile(true)} className={`xl:hidden grid size-10 place-items-center rounded-full ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'}`}>
            <MenuIcon className="size-6" />
          </button>
        </div>
      </div>

      {/* mega menu panel */}
      {open !== null && items[open]?.children?.length ? (
        <div className="absolute inset-x-0 top-full hidden xl:block" onMouseEnter={() => enter(open)} onMouseLeave={leave}>
          <div className="border-t border-line bg-white shadow-[0_30px_60px_-30px_rgb(36_28_19/0.35)]">
            <div className="container-x grid grid-cols-[260px_1fr] gap-10 py-10">
              <div>
                <p className="eyebrow">{items[open].label}</p>
                <p className="font-display mt-3 text-3xl leading-tight">{items[open].label}</p>
                <div className="gold-rule mt-5" />
              </div>
              <div className="columns-3 gap-x-8">
                {items[open].children!.map(c => c.children?.length ? (
                  <div key={c.label} className="break-inside-avoid py-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-bronze-600">{c.label}</p>
                    <ul className="space-y-1">
                      {c.children.map(g => <li key={g.label}><NavLink item={g} className="block rounded-lg px-2 py-1.5 -mx-2 text-[.95rem] text-ink/80 hover:bg-sand-100 hover:text-ink" /></li>)}
                    </ul>
                  </div>
                ) : (
                  <NavLink key={c.label} item={c} className="block break-inside-avoid rounded-lg px-3 py-2.5 -mx-3 text-[.98rem] text-ink hover:bg-sand-100" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* search panel */}
      {searching && (
        <div className="absolute inset-x-0 top-full border-t border-line bg-white shadow-lg">
          <form
            className="container-x flex items-center gap-3 py-5"
            onSubmit={e => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q'); router.push('/search?q=' + encodeURIComponent(String(q ?? ''))); }}
          >
            <Search className="size-5 text-stone-500" />
            <input name="q" autoFocus placeholder="Search programmes, pages, news, people…" className="w-full bg-transparent text-lg outline-none placeholder:text-stone-500/70" />
            <button className="btn btn-dark !py-2">Search</button>
          </form>
        </div>
      )}

      {/* mobile drawer (rendered on <body> so the header's blur doesn't clip it) */}
      {mobile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-espresso/50 backdrop-blur-sm" onClick={() => setMobile(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
              <Image src="/brand/logo.png" alt="Dubai Medical University" width={160} height={52} className="h-10 w-auto" />
              <button type="button" aria-label="Close menu" onClick={() => setMobile(false)} className="grid size-10 place-items-center rounded-full hover:bg-sand-100"><X className="size-6" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              {items.map((it, i) => (
                <div key={it.label} className="border-b border-line/70">
                  {it.children?.length ? (
                    <>
                      <button type="button" onClick={() => setMobileOpen(mobileOpen === i ? null : i)} className="flex w-full items-center justify-between px-2 py-4 text-left text-lg font-medium">
                        {it.label}<ChevronDown className={`size-5 transition-transform ${mobileOpen === i ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileOpen === i && (
                        <ul className="pb-3">
                          {it.children.map(c => (
                            <li key={c.label}>
                              {c.url ? <NavLink item={c} className="block rounded-lg px-4 py-2.5 text-ink/80 hover:bg-sand-100" /> : <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-bronze-600">{c.label}</p>}
                              {c.children?.map(g => <NavLink key={g.label} item={g} className="block rounded-lg px-6 py-2 text-[.95rem] text-ink/70 hover:bg-sand-100" />)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : <NavLink item={it} className="block px-2 py-4 text-lg font-medium" />}
                </div>
              ))}
              <div className="mt-6 grid gap-2 px-2">
                <Link href="/admissions" className="btn btn-gold justify-center">Apply Now</Link>
                <Link href="/contact-us" className="btn btn-outline justify-center">Contact Us</Link>
                {portals.map(p => <a key={p.url} href={p.url} target="_blank" rel="noopener" className="btn btn-outline justify-center">{p.label}</a>)}
              </div>
            </nav>
          </div>
        </div>
      , document.body)}
    </header>
  );
}
