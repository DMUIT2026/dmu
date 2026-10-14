import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Header from '@/components/site/Header';
import NewsCard from '@/components/site/NewsCard';
import HeroSlider from '@/components/home/HeroSlider';
import ProgramExplorer from '@/components/home/ProgramExplorer';
import { getCategories, getPosts, getPrograms, getSettings } from '@/lib/content';

export const revalidate = 300;

export default async function Home() {
  const [s, programs, { posts }, cats] = await Promise.all([getSettings(), getPrograms(), getPosts({ perPage: 5 }), getCategories()]);
  const hero = s.home_hero;
  const [lead, ...rest] = posts;
  return (
    <>
      <Header overlay />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden bg-espresso text-white">
        <HeroSlider slides={hero.slides} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso/90 via-espresso/55 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso via-espresso/10 to-espresso/50" />
        <div className="container-x pb-14 pt-48 md:pb-20">
          <p className="rise eyebrow !text-gold-400">{hero.eyebrow}</p>
          <h1 className="rise rise-2 font-display mt-5 max-w-4xl text-[2.6rem] font-medium leading-[1.04] sm:text-6xl lg:text-7xl">{hero.title}</h1>
          {hero.text && <p className="rise rise-3 mt-6 max-w-xl text-lg text-white/80">{hero.text}</p>}
          <div className="rise rise-4 mt-9 flex flex-wrap gap-3">
            <Link href="#programmes" className="btn btn-gold">Find your programme <ArrowRight className="size-4" /></Link>
            <Link href="/admissions" className="btn btn-ghost">Apply to DMU</Link>
          </div>

          {/* colleges */}
          <div className="rise rise-4 mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {s.home_colleges.map(c => (
              <Link key={c.url} href={c.url} className="group flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[.07] p-4 backdrop-blur-md transition hover:border-gold-400/60 hover:bg-white/[.13]">
                <span className="relative grid size-14 shrink-0 place-items-center rounded-xl bg-gold-500/90">
                  <Image src={c.icon} alt="" width={40} height={40} className="size-9 object-contain brightness-0 invert" />
                </span>
                <span className="font-display text-lg leading-tight">{c.title}</span>
                <ArrowUpRight className="ml-auto size-5 shrink-0 text-white/50 transition group-hover:text-gold-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- About + stats ---------- */}
      <section className="container-x grid gap-14 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">{s.home_intro?.title ?? 'About DMU'}</p>
          <h2 className="font-display mt-4 text-4xl leading-tight md:text-5xl">A legacy of healthcare education, <em className="text-bronze-600">since 1986</em>.</h2>
          <div className="gold-rule mt-6" />
          {s.home_intro?.text && <p className="mt-6 text-lg leading-relaxed text-ink/75">{s.home_intro.text}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={s.home_intro?.link ?? '/vision-and-mission'} className="btn btn-dark">Our vision &amp; mission <ArrowRight className="size-4" /></Link>
            <Link href="/vca-message" className="btn btn-outline">VCA message</Link>
          </div>
        </div>
        <div className="relative">
          {s.home_intro?.image && (
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lift)]">
              <Image src={s.home_intro.image} alt="Dubai Medical University" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
          )}
          <div className="relative -mt-16 ml-6 mr-6 grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] bg-white/10 shadow-[var(--shadow-lift)] sm:ml-12 sm:mr-0 sm:grid-cols-4 lg:-ml-16">
            {s.home_stats.items.map(st => (
              <div key={st.label} className="bg-espresso p-5 text-white">
                <p className="font-display text-3xl text-gold-400">{st.value}</p>
                <p className="mt-1.5 text-[.8rem] leading-snug text-white/75">{st.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Programmes ---------- */}
      <section id="programmes" className="scroll-mt-28 bg-sand-100 py-20 md:py-28">
        <div className="container-x">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Programmes at DMU</p>
              <h2 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">Find the programme that fits your future.</h2>
            </div>
            <Link href="/admissions" className="btn btn-outline self-start md:self-auto">Admissions <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-12"><ProgramExplorer programs={programs} /></div>
        </div>
      </section>

      {/* ---------- News ---------- */}
      {lead && (
        <section className="container-x py-20 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Latest news &amp; events</p>
              <h2 className="font-display mt-4 text-4xl md:text-5xl">What’s happening at DMU</h2>
            </div>
            <Link href="/news" className="btn btn-outline self-start md:self-auto">All news <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <NewsCard post={lead} cats={cats} large />
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map(p => <NewsCard key={p.slug} post={{ ...p, excerpt: null }} cats={cats} />)}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Alumni ---------- */}
      {s.home_alumni?.logos?.length > 0 && (
        <section className="border-y border-line bg-white py-16">
          <div className="container-x"><p className="text-center eyebrow">{s.home_alumni.title}</p></div>
          <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div className="marquee flex w-max gap-6">
              {[...s.home_alumni.logos, ...s.home_alumni.logos].map((l, i) => (
                <div key={i} className="relative h-24 w-48 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
                  <Image src={l} alt="" fill sizes="192px" className="object-contain p-3" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- CTA ---------- */}
      <section className="container-x py-20 md:py-28">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-espresso px-8 py-14 text-white md:px-16 md:py-20">
          <div aria-hidden className="absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-gold-500/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 left-10 -z-10 size-80 rounded-full bg-bronze-600/30 blur-3xl" />
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow !text-gold-400">Join DMU</p>
              <h2 className="font-display mt-4 text-4xl leading-tight md:text-5xl">Discover the perfect academic programme — and start your journey in healthcare.</h2>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/admissions" className="btn btn-gold">Apply now <ArrowRight className="size-4" /></Link>
              <Link href="/fees-and-scholarships" className="btn btn-ghost">Fees &amp; scholarships</Link>
              <Link href="/contact-us" className="btn btn-ghost">Contact us</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
