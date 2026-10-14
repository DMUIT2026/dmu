import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { lhref, t, type Locale } from '@/lib/i18n';

export interface Crumb { label: string; href?: string }

/** Page banner: title on a calm dark panel, photo shown beside it as a framed picture (never under the text). */
export default function PageHero({ locale = 'en', title, image, crumbs = [], eyebrow, subtitle, compact = false, children }: {
  locale?: Locale; title: string; image?: string | null; crumbs?: Crumb[]; eyebrow?: string; subtitle?: string | null; compact?: boolean; children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-espresso text-white">
      <div aria-hidden className="absolute -start-40 -top-20 -z-10 size-[560px] rounded-full bg-gold-500/15 blur-[120px]" />
      <div aria-hidden className="absolute -bottom-40 end-0 -z-10 size-[480px] rounded-full bg-bronze-600/20 blur-[120px]" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.06] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]" />
      <div className={`container-x grid items-center gap-10 ${compact ? 'pt-36 pb-12 md:pt-40' : 'pt-36 pb-14 md:pt-44 md:pb-16'} ${image ? 'lg:grid-cols-[1.1fr_1fr] lg:gap-14' : ''}`}>
        <div>
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="rise mb-6 flex flex-wrap items-center gap-1.5 text-sm text-white/60">
              <Link href={lhref(locale, '/')} className="hover:text-white">{t(locale, 'home')}</Link>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 opacity-60 flip-rtl" />
                  {c.href ? <Link href={lhref(locale, c.href)} className="hover:text-white">{c.label}</Link> : <span className="text-white/85">{c.label}</span>}
                </span>
              ))}
            </nav>
          )}
          {eyebrow && <p className="rise eyebrow !text-gold-400 mb-4">{eyebrow}</p>}
          <h1 className="rise rise-2 font-display max-w-3xl text-4xl font-medium leading-[1.08] md:text-5xl xl:text-6xl">{title}</h1>
          {subtitle && <p className="rise rise-3 mt-5 max-w-2xl text-lg text-white/75">{subtitle}</p>}
          {children && <div className="rise rise-3 mt-8">{children}</div>}
        </div>
        {image && (
          <div className="rise rise-3 relative aspect-[16/9] overflow-hidden rounded-[1.5rem] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
            <Image src={image} alt="" fill priority sizes="(min-width:1024px) 600px, 100vw" quality={90} className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
