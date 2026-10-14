import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Header from '@/components/site/Header';
import NewsCard from '@/components/site/NewsCard';
import HeroMosaic from '@/components/home/HeroMosaic';
import ProgramExplorer from '@/components/home/ProgramExplorer';
import { getCategories, getPage, getPosts, getPrograms, getSettings } from '@/lib/content';
import { BookOpen, GraduationCap, Users, UserRoundSearch } from 'lucide-react';

export const revalidate = 300;

export default async function Home() {
  const [s, programs, { posts }, cats] = await Promise.all([getSettings(), getPrograms(), getPosts({ perPage: 5 }), getCategories()]);
  const lifePaths = ['learning-resource-centre', 'simulation-centre', 'student-affairs', 'hostel-facilities'];
  const life = (await Promise.all(lifePaths.map(p => getPage(p)))).filter(Boolean);
  const hero = s.home_hero;
  const [lead, ...rest] = posts;
  return (
    <>
      <Header overlay />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden bg-espresso text-white">
        <div aria-hidden className="absolute -left-40 top-10 -z-10 size-[620px] rounded-full bg-gold-500/20 blur-[120px]" />
        <div aria-hidden className="absolute -right-32 bottom-0 -z-10 size-[520px] rounded-full bg-bronze-600/25 blur-[120px]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="container-x grid items-center gap-14 pb-16 pt-40 md:pt-48 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
          <div>
            <p className="rise eyebrow !text-gold-400">{hero.eyebrow}</p>
            <h1 className="rise rise-2 font-display mt-5 text-[2.6rem] font-medium leading-[1.04] sm:text-6xl xl:text-7xl">{hero.title}</h1>
            {hero.text && <p className="rise rise-3 mt-6 max-w-xl text-lg text-white/75">{hero.text}</p>}
            <div className="rise rise-4 mt-9 flex flex-wrap gap-3">
              <Link href="#programmes" className="btn btn-gold">Find your programme <ArrowRight className="size-4" /></Link>
              <Link href="/admissions" className="btn btn-ghost">Apply to DMU</Link>
            </div>
          </div>
          <HeroMosaic images={hero.slides.map(x => x.image).filter(Boolean)} />
        </div>
        <div className="container-x pb-16 md:pb-20">
          <div className="rise rise-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {s.home_colleges.map(c => (
              <Link key={c.url} href={c.url} className="group flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[.05] p-4 transition hover:border-gold-400/60 hover:bg-white/[.1]">
                <span className="relative grid size-14 shrink-0 place-items-center rounded-xl bg-gold-500">
                  <Image src={c.icon} alt="" width={40} height={40} className="size-9 object-contain brightness-0 invert" />
                </span>
                <span className="font-display text-lg leading-tight">{c.title}</span>
                <ArrowUpRight className="ml-auto size-5 shrink-0 text-white/50 transition group-hover:text-gold-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Audience quick links ---------- */}
      <section className="border-b border-line bg-white">
        <div className="container-x grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {[
            { label: 'Prospective students', text: 'Programmes, admissions, fees & scholarships', href: '/admissions', icon: GraduationCap },
            { label: 'Current students', text: 'Academic calendar, advising, student affairs', href: '/student-affairs', icon: BookOpen },
            { label: 'Faculty & staff', text: 'Directory, QAIE, publications', href: '/dmu-faculty-and-staff-directory', icon: UserRoundSearch },
            { label: 'Alumni', text: 'Stay connected with the DMU community', href: 'https://alumni.dmu.ae/', icon: Users },
          ].map(a => (
            <Link key={a.label} href={a.href} className="group flex items-start gap-4 px-2 py-7 transition hover:bg-sand-50 lg:px-6">
              <a.icon className="mt-0.5 size-6 shrink-0 text-gold-500" />
              <span>
                <span className="flex items-center gap-1.5 font-semibold text-ink">{a.label}<ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span>
                <span className="mt-1 block text-sm text-stone-500">{a.text}</span>
              </span>
            </Link>
          ))}
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
              <Image src={s.home_intro.image} alt="Dubai Medical University" fill sizes="(min-width:1024px) 50vw, 100vw" quality={90} className="object-cover" />
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

      {/* ---------- Life at DMU ---------- */}
      {life.length > 0 && (
        <section className="bg-espresso py-20 text-white md:py-28">
          <div className="container-x">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow !text-gold-400">Life at DMU</p>
                <h2 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">A campus built for learning, practice and wellbeing.</h2>
              </div>
              <Link href="/facilities-services" className="btn btn-ghost self-start md:self-auto">Facilities &amp; services <ArrowRight className="size-4" /></Link>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {life.map(p => (
                <Link key={p!.path} href={'/' + p!.path} className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-bronze-800">
                  {p!.hero_image && <Image src={p!.hero_image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="font-display text-2xl leading-tight">{p!.title}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold-400">Explore <ArrowUpRight className="size-4" /></span>
                  </div>
                </Link>
              ))}
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
