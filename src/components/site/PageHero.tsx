import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export interface Crumb { label: string; href?: string }

export default function PageHero({ title, image, crumbs = [], eyebrow, subtitle, compact = false, children }: {
  title: string; image?: string | null; crumbs?: Crumb[]; eyebrow?: string; subtitle?: string | null; compact?: boolean; children?: React.ReactNode;
}) {
  return (
    <section className={`relative isolate overflow-hidden bg-espresso text-white ${compact ? 'pt-40 pb-14' : 'pt-44 pb-20 md:pt-52 md:pb-28'}`}>
      {image ? (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="kenburns -z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso/95 via-espresso/75 to-espresso/30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso/80 via-transparent to-espresso/40" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgb(187_159_82/0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgb(132_100_62/0.35),transparent_50%)]" />
      )}
      <div className="container-x">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="rise mb-6 flex flex-wrap items-center gap-1.5 text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5 opacity-60" />
                {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span className="text-white/90">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="rise eyebrow !text-gold-400 mb-4">{eyebrow}</p>}
        <h1 className="rise rise-2 font-display max-w-4xl text-4xl font-medium leading-[1.08] md:text-6xl">{title}</h1>
        {subtitle && <p className="rise rise-3 mt-5 max-w-2xl text-lg text-white/80">{subtitle}</p>}
        {children && <div className="rise rise-3 mt-8">{children}</div>}
      </div>
    </section>
  );
}
