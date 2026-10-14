'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ChevronDown, Globe, Menu as MenuIcon, Phone, Search, X } from 'lucide-react';
import { label as lbl, lhref, switchHref, t, type Locale } from '@/lib/i18n';
import type { MenuLink } from '@/lib/types';

const isExternal = (u?: string | null) => !!u && /^https?:\/\//.test(u);

function NavLink({ item, className, onClick, locale }: { item: MenuLink; className?: string; onClick?: () => void; locale: Locale }) {
  const text = lbl(item, locale);
  if (!item.url) return <span className={className}>{text}</span>;
  if (isExternal(item.url))
    return (
      <a href={item.url} target="_blank" rel="noopener" className={className} onClick={onClick}>
        {text} <ArrowUpRight className="inline size-3.5 opacity-60 flip-rtl" />
      </a>
    );
  return <Link href={lhref(locale, item.url)} className={className} onClick={onClick}>{text}</Link>;
}

export default function HeaderClient({ items, overlay, phone, phoneLink, portals, locale }: {
  items: MenuLink[]; overlay: boolean; phone?: string; phoneLink?: string; portals: { label: string; label_ar?: string; url: string }[]; locale: Locale;
}) {
  const L = (path: string) => lhref(locale, path);
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
            {phone && <a href={phoneLink} className="ltr flex items-center gap-1.5 hover:opacity-80"><Phone className="size-3.5" /> {phone}</a>}
            <Link href={L('/contact-us')} className="hover:opacity-80">{t(locale, 'contact')}</Link>
            <Link href={L('/dmu-faculty-and-staff-directory')} className="hover:opacity-80">{t(locale, 'directory')}</Link>
            <Link href={L('/events')} className="hover:opacity-80">{t(locale, 'events')}</Link>
          </div>
          <div className="flex items-center gap-5">
            {portals.map(p => <a key={p.url} href={p.url} target="_blank" rel="noopener" className="hover:opacity-80">{(locale === 'ar' && p.label_ar) || p.label}</a>)}
            <Link href={L('/academic-calendar-2')} className="hover:opacity-80">{t(locale, 'academicCalendar')}</Link>
            <Link href={switchHref(pathname, locale === 'ar' ? 'en' : 'ar')} lang={locale === 'ar' ? 'en' : 'ar'} className="flex items-center gap-1.5 rounded-full border border-current/30 px-3 py-0.5 font-medium hover:opacity-80"><Globe className="size-3.5" />{t(locale, 'language')}</Link>
          </div>
        </div>
      </div>

      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link href={L('/')} aria-label={locale === 'ar' ? 'جامعة دبي الطبية — الرئيسية' : 'Dubai Medical University — home'} className="shrink-0">
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
                  {lbl(it, locale)}<ChevronDown className={`size-4 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <NavLink locale={locale} item={it} className={`block rounded-full px-3.5 py-2 text-[.92rem] font-medium transition-colors ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'}`} />
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={switchHref(pathname, locale === 'ar' ? 'en' : 'ar')} lang={locale === 'ar' ? 'en' : 'ar'} className={`lg:hidden grid h-10 place-items-center rounded-full px-3 text-sm font-semibold ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'}`}>{locale === 'ar' ? 'EN' : 'ع'}</Link>
          <button type="button" aria-label={t(locale, 'search')} onClick={() => setSearching(s => !s)} className={`grid size-10 place-items-center rounded-full transition-colors ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'}`}>
            {searching ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
          <Link href={L('/admissions')} className="btn btn-gold hidden sm:inline-flex !py-2.5">{t(locale, 'apply')}</Link>
          <button type="button" aria-label={t(locale, 'openMenu')} onClick={() => setMobile(true)} className={`xl:hidden grid size-10 place-items-center rounded-full ${solid ? 'text-ink hover:bg-sand-100' : 'text-white hover:bg-white/10'}`}>
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
                <p className="eyebrow">{lbl(items[open], locale)}</p>
                <p className="font-display mt-3 text-3xl leading-tight">{lbl(items[open], locale)}</p>
                <div className="gold-rule mt-5" />
              </div>
              <div className="columns-3 gap-x-8">
                {items[open].children!.map(c => c.children?.length ? (
                  <div key={c.label} className="break-inside-avoid py-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-bronze-600">{lbl(c, locale)}</p>
                    <ul className="space-y-1">
                      {c.children.map(g => <li key={g.label}><NavLink locale={locale} item={g} className="block rounded-lg px-2 py-1.5 -mx-2 text-[.95rem] text-ink/80 hover:bg-sand-100 hover:text-ink" /></li>)}
                    </ul>
                  </div>
                ) : (
                  <NavLink locale={locale} key={c.label} item={c} className="block break-inside-avoid rounded-lg px-3 py-2.5 -mx-3 text-[.98rem] text-ink hover:bg-sand-100" />
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
            onSubmit={e => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q'); router.push(L('/search') + '?q=' + encodeURIComponent(String(q ?? ''))); }}
          >
            <Search className="size-5 text-stone-500" />
            <input name="q" autoFocus placeholder={t(locale, 'searchPlaceholder')} className="w-full bg-transparent text-lg outline-none placeholder:text-stone-500/70" />
            <button className="btn btn-dark !py-2">{t(locale, 'search')}</button>
          </form>
        </div>
      )}

      {/* mobile drawer (rendered on <body> so the header's blur doesn't clip it) */}
      {mobile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-espresso/50 backdrop-blur-sm" onClick={() => setMobile(false)} />
          <div className="absolute end-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
              <Image src="/brand/logo.png" alt={locale === 'ar' ? 'جامعة دبي الطبية' : 'Dubai Medical University'} width={160} height={52} className="h-10 w-auto" />
              <button type="button" aria-label={t(locale, 'closeMenu')} onClick={() => setMobile(false)} className="grid size-10 place-items-center rounded-full hover:bg-sand-100"><X className="size-6" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              {items.map((it, i) => (
                <div key={it.label} className="border-b border-line/70">
                  {it.children?.length ? (
                    <>
                      <button type="button" onClick={() => setMobileOpen(mobileOpen === i ? null : i)} className="flex w-full items-center justify-between px-2 py-4 text-left text-lg font-medium">
                        {lbl(it, locale)}<ChevronDown className={`size-5 transition-transform ${mobileOpen === i ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileOpen === i && (
                        <ul className="pb-3">
                          {it.children.map(c => (
                            <li key={c.label}>
                              {c.url ? <NavLink locale={locale} item={c} className="block rounded-lg px-4 py-2.5 text-ink/80 hover:bg-sand-100" /> : <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-bronze-600">{lbl(c, locale)}</p>}
                              {c.children?.map(g => <NavLink locale={locale} key={g.label} item={g} className="block rounded-lg px-6 py-2 text-[.95rem] text-ink/70 hover:bg-sand-100" />)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : <NavLink locale={locale} item={it} className="block px-2 py-4 text-lg font-medium" />}
                </div>
              ))}
              <div className="mt-6 grid gap-2 px-2">
                <Link href={L('/admissions')} className="btn btn-gold justify-center">{t(locale, 'apply')}</Link>
                <Link href={L('/contact-us')} className="btn btn-outline justify-center">{t(locale, 'contactUs')}</Link>
                <Link href={L('/events')} className="btn btn-outline justify-center">{t(locale, 'events')}</Link>
                <Link href={switchHref(pathname, locale === 'ar' ? 'en' : 'ar')} className="btn btn-outline justify-center">{t(locale, 'language')}</Link>
                {portals.map(p => <a key={p.url} href={p.url} target="_blank" rel="noopener" className="btn btn-outline justify-center">{(locale === 'ar' && p.label_ar) || p.label}</a>)}
              </div>
            </nav>
          </div>
        </div>
      , document.body)}
    </header>
  );
}
