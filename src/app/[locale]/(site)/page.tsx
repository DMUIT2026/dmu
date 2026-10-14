import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, BookOpen, GraduationCap, MapPin, Users, UserRoundSearch } from 'lucide-react';
import Header from '@/components/site/Header';
import NewsCard from '@/components/site/NewsCard';
import HeroMosaic from '@/components/home/HeroMosaic';
import ProgramExplorer from '@/components/home/ProgramExplorer';
import { getCategories, getEvents, getPage, getPosts, getPrograms, getSettings } from '@/lib/content';
import { fmtDateL, isLocale, lhref, pick, t, type Locale } from '@/lib/i18n';

export const revalidate = 300;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: lc } = await params;
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const L = (p: string) => lhref(locale, p);
  const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
  const [s, programs, { posts }, cats, upcoming] = await Promise.all([
    getSettings(locale), getPrograms(), getPosts({ perPage: 5 }), getCategories(), getEvents({ from: today }),
  ]);
  const lifePaths = ['learning-resource-centre', 'simulation-centre', 'student-affairs', 'hostel-facilities'];
  const life = (await Promise.all(lifePaths.map(p => getPage(p)))).filter(Boolean);
  const hero = s.home_hero;
  const [lead, ...rest] = posts;
  const arrow = 'size-4 flip-rtl';
  return (
    <>
      <Header overlay locale={locale} />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden bg-espresso text-white">
        <div aria-hidden className="absolute -start-40 top-10 -z-10 size-[620px] rounded-full bg-gold-500/20 blur-[120px]" />
        <div aria-hidden className="absolute -end-32 bottom-0 -z-10 size-[520px] rounded-full bg-bronze-600/25 blur-[120px]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="container-x grid items-center gap-14 pb-16 pt-40 md:pt-48 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
          <div>
            <p className="rise eyebrow !text-gold-400">{hero.eyebrow}</p>
            <h1 className="rise rise-2 font-display mt-5 text-[2.6rem] font-medium leading-[1.04] sm:text-6xl xl:text-7xl">{hero.title}</h1>
            {hero.text && <p className="rise rise-3 mt-6 max-w-xl text-lg text-white/75">{hero.text}</p>}
            <div className="rise rise-4 mt-9 flex flex-wrap gap-3">
              <Link href="#programmes" className="btn btn-gold">{t(locale, 'findProgramme')} <ArrowRight className={arrow} /></Link>
              <Link href={L('/admissions')} className="btn btn-ghost">{t(locale, 'applyTo')}</Link>
            </div>
          </div>
          <HeroMosaic images={hero.slides.map(x => x.image).filter(Boolean)} />
        </div>
        <div className="container-x pb-16 md:pb-20">
          <div className="rise rise-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {s.home_colleges.map(c => (
              <Link key={c.url} href={L(c.url)} className="group flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[.05] p-4 transition hover:border-gold-400/60 hover:bg-white/[.1]">
                <span className="relative grid size-14 shrink-0 place-items-center rounded-xl bg-gold-500">
                  <Image src={c.icon} alt="" width={40} height={40} className="size-9 object-contain brightness-0 invert" />
                </span>
                <span className="font-display text-lg leading-tight">{c.title}</span>
                <ArrowUpRight className="ms-auto size-5 shrink-0 text-white/50 transition group-hover:text-gold-400 flip-rtl" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Audience quick links ---------- */}
      <section className="border-b border-line bg-white">
        <div className="container-x grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse">
          {[
            { label: t(locale, 'prospective'), text: t(locale, 'prospectiveText'), href: L('/admissions'), icon: GraduationCap },
            { label: t(locale, 'current'), text: t(locale, 'currentText'), href: L('/student-affairs'), icon: BookOpen },
            { label: t(locale, 'staff'), text: t(locale, 'staffText'), href: L('/dmu-faculty-and-staff-directory'), icon: UserRoundSearch },
            { label: t(locale, 'alumni'), text: t(locale, 'alumniText'), href: 'https://alumni.dmu.ae/', icon: Users },
          ].map(a => (
            <Link key={a.label} href={a.href} className="group flex items-start gap-4 px-2 py-7 transition hover:bg-sand-50 lg:px-6">
              <a.icon className="mt-0.5 size-6 shrink-0 text-gold-500" />
              <span>
                <span className="flex items-center gap-1.5 font-semibold text-ink">{a.label}<ArrowRight className="size-4 flip-rtl opacity-0 transition group-hover:opacity-100" /></span>
                <span className="mt-1 block text-sm text-stone-500">{a.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- About + stats ---------- */}
      <section className="container-x grid gap-14 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">{s.home_intro?.title || t(locale, 'aboutLabel')}</p>
          <h2 className="font-display mt-4 text-4xl leading-tight md:text-5xl">{t(locale, 'legacy')} <em className="text-bronze-600">{t(locale, 'since')}</em>.</h2>
          <div className="gold-rule mt-6" />
          {s.home_intro?.text && <p className="mt-6 text-lg leading-relaxed text-ink/75">{s.home_intro.text}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={L(s.home_intro?.link ?? '/vision-and-mission')} className="btn btn-dark">{t(locale, 'vision')} <ArrowRight className={arrow} /></Link>
            <Link href={L('/vca-message')} className="btn btn-outline">{t(locale, 'vca')}</Link>
          </div>
        </div>
        <div className="relative">
          {s.home_intro?.image && (
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lift)]">
              <Image src={s.home_intro.image} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" quality={90} className="object-cover object-[75%_center]" />
            </div>
          )}
          <div className="relative -mt-16 mx-6 grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] bg-white/10 shadow-[var(--shadow-lift)] sm:ms-12 sm:me-0 sm:grid-cols-4 lg:-ms-16">
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
              <p className="eyebrow">{t(locale, 'programmesAt')}</p>
              <h2 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">{t(locale, 'programmesTitle')}</h2>
            </div>
            <Link href={L('/admissions')} className="btn btn-outline self-start md:self-auto">{t(locale, 'admissions')} <ArrowRight className={arrow} /></Link>
          </div>
          <div className="mt-12"><ProgramExplorer programs={programs} locale={locale} /></div>
        </div>
      </section>

      {/* ---------- Upcoming events ---------- */}
      {upcoming.length > 0 && (
        <section className="container-x pt-20 md:pt-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">{t(locale, 'events')}</p>
              <h2 className="font-display mt-4 text-4xl md:text-5xl">{t(locale, 'upcomingEvents')}</h2>
            </div>
            <Link href={L('/events')} className="btn btn-outline self-start md:self-auto">{t(locale, 'allEvents')} <ArrowRight className={arrow} /></Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.slice(0, 4).map(e => (
              <Link key={e.id} href={L(`/events/${e.id}`)} className="group flex gap-4 rounded-[var(--radius-card)] border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-gold-200 hover:shadow-[var(--shadow-soft)]">
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-espresso text-center text-white">
                  <span>
                    <span className="block font-display text-2xl leading-none text-gold-400">{fmtDateL(e.starts_on + 'T12:00:00', locale, { day: 'numeric' })}</span>
                    <span className="mt-1 block text-[.7rem] uppercase">{fmtDateL(e.starts_on + 'T12:00:00', locale, { month: 'short' })}</span>
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-bronze-600">{t(locale, `cat_${e.category}` as 'cat_event')}</p>
                  <p className="mt-1 font-medium leading-snug text-ink group-hover:text-bronze-700">{pick(e, 'title', locale)}</p>
                  {e.location && <p className="mt-1.5 flex items-center gap-1 text-xs text-stone-500"><MapPin className="size-3.5" />{pick(e, 'location', locale)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- News ---------- */}
      {lead && (
        <section className="container-x py-20 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">{t(locale, 'latestNews')}</p>
              <h2 className="font-display mt-4 text-4xl md:text-5xl">{t(locale, 'happening')}</h2>
            </div>
            <Link href={L('/news')} className="btn btn-outline self-start md:self-auto">{t(locale, 'allNews')} <ArrowRight className={arrow} /></Link>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <NewsCard post={lead} cats={cats} large locale={locale} />
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map(p => <NewsCard key={p.slug} post={p} noExcerpt cats={cats} locale={locale} />)}
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
                <p className="eyebrow !text-gold-400">{t(locale, 'lifeAt')}</p>
                <h2 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">{t(locale, 'lifeTitle')}</h2>
              </div>
              <Link href={L('/facilities-services')} className="btn btn-ghost self-start md:self-auto">{t(locale, 'facilities')} <ArrowRight className={arrow} /></Link>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {life.map(p => (
                <Link key={p!.path} href={L('/' + p!.path)} className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-bronze-800">
                  {p!.hero_image && <Image src={p!.hero_image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="font-display text-2xl leading-tight">{pick(p!, 'title', locale)}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold-400">{t(locale, 'explore')} <ArrowUpRight className="size-4 flip-rtl" /></span>
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
          <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]" dir="ltr">
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
          <div aria-hidden className="absolute -end-24 -top-24 -z-10 size-96 rounded-full bg-gold-500/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 start-10 -z-10 size-80 rounded-full bg-bronze-600/30 blur-3xl" />
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow !text-gold-400">{t(locale, 'joinDmu')}</p>
              <h2 className="font-display mt-4 text-4xl leading-tight md:text-5xl">{t(locale, 'joinTitle')}</h2>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href={L('/admissions')} className="btn btn-gold">{t(locale, 'apply')} <ArrowRight className={arrow} /></Link>
              <Link href={L('/fees-and-scholarships')} className="btn btn-ghost">{t(locale, 'fees')}</Link>
              <Link href={L('/contact-us')} className="btn btn-ghost">{t(locale, 'contactUs')}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
