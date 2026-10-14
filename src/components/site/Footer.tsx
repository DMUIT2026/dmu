import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';
import { getMenu, getSettings } from '@/lib/content';
import type { MenuLink } from '@/lib/types';
import { label as lbl, lhref, t, type Locale } from '@/lib/i18n';
import { SocialIcon } from './SocialIcon';

export default async function Footer({ locale }: { locale: Locale }) {
  const [settings, quick, colleges] = await Promise.all([getSettings(locale), getMenu('footer_quick'), getMenu('footer_colleges')]);
  const c = settings.contact;
  const col = (title: string, links: MenuLink[]) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold-400">{title}</p>
      <ul className="mt-5 space-y-3">
        {links.map(l => (
          <li key={l.label}>
            {l.url && /^https?:/.test(l.url)
              ? <a href={l.url} target="_blank" rel="noopener" className="text-white/75 transition hover:text-white">{lbl(l, locale)}</a>
              : <Link href={lhref(locale, l.url)} className="text-white/75 transition hover:text-white">{lbl(l, locale)}</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="relative overflow-hidden bg-espresso text-white">
      <div aria-hidden className="pointer-events-none absolute -end-40 -top-40 size-[520px] rounded-full bg-gold-500/10 blur-3xl" />
      <div className="container-x relative py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image src="/brand/logo-white.png" alt={locale === "ar" ? "جامعة دبي الطبية" : "Dubai Medical University"} width={220} height={71} className="h-14 w-auto" />
            <p className="mt-6 max-w-sm text-white/70 leading-relaxed">{t(locale, 'tagline')}</p>
            <div className="mt-6 flex gap-2">
              {settings.social?.map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener" aria-label={s.label} className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-gold-400 hover:text-gold-400">
                  <SocialIcon name={s.label} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold-400">{t(locale, 'getInTouch')}</p>
            <ul className="mt-5 space-y-4 text-white/75">
              {c?.phone && <li><a href={c.phone_link} className="ltr flex gap-3 hover:text-white"><Phone className="mt-0.5 size-4 shrink-0 text-gold-400" />{c.phone}</a></li>}
              {c?.email && <li><a href={`mailto:${c.email}`} className="flex gap-3 hover:text-white"><Mail className="mt-0.5 size-4 shrink-0 text-gold-400" />{c.email}</a></li>}
              {c?.address && <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" /><span className="whitespace-pre-line">{c.address}</span></li>}
            </ul>
          </div>
          {col(t(locale, 'quickLinks'), (quick?.items as MenuLink[]) ?? [])}
          {col(t(locale, 'colleges'), (colleges?.items as MenuLink[]) ?? [])}
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {t(locale, 'rights')}</p>
          <div className="flex gap-6">
            <Link href={lhref(locale, '/contact-us')} className="hover:text-white">{t(locale, 'contact')}</Link>
            <Link href={lhref(locale, '/news')} className="hover:text-white">{t(locale, 'news')}</Link>
            <Link href={lhref(locale, '/events')} className="hover:text-white">{t(locale, 'events')}</Link>
            <Link href={lhref(locale, '/search')} className="hover:text-white">{t(locale, 'search')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
