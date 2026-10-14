import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, CalendarPlus, Clock, ExternalLink, MapPin } from 'lucide-react';
import Header from '@/components/site/Header';
import RichText from '@/components/site/RichText';
import { catColor } from '@/components/events/EventsCalendar';
import { getEvent } from '@/lib/content';
import { fmtDateL, isLocale, lhref, pick, t, type Locale } from '@/lib/i18n';

export const revalidate = 300;
type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params; const l: Locale = isLocale(locale) ? locale : 'en';
  const e = await getEvent(id);
  return e ? { title: pick(e, 'title', l) } : {};
}

export default async function EventPage({ params }: Props) {
  const { id, locale: lc } = await params;
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const e = await getEvent(id);
  if (!e) notFound();
  const fmt = (d: string) => fmtDateL(d + 'T12:00:00', locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const when = e.ends_on && e.ends_on !== e.starts_on ? `${fmt(e.starts_on)} – ${fmt(e.ends_on)}` : fmt(e.starts_on);
  const desc = pick(e, 'description', locale);
  return (
    <>
      <Header locale={locale} />
      <section className="bg-sand-100/70 pt-36 pb-12 md:pt-44">
        <div className="container-x max-w-4xl">
          <Link href={lhref(locale, `/events?month=${e.starts_on.slice(0, 7)}`)} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-ink"><ArrowLeft className="size-4 flip-rtl" /> {t(locale, 'eventsTitle')}</Link>
          <p className="mt-8 flex items-center gap-2 text-sm font-semibold text-bronze-700"><span className={`size-2.5 rounded-full ${catColor(e.category)}`} />{t(locale, `cat_${e.category}` as 'cat_event')}</p>
          <h1 className="font-display mt-3 text-4xl font-medium leading-tight md:text-5xl">{pick(e, 'title', locale)}</h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-ink/80">
            <span className="flex items-center gap-2"><CalendarDays className="size-5 text-gold-500" />{when}</span>
            {e.start_time && <span className="ltr flex items-center gap-2"><Clock className="size-5 text-gold-500" />{e.start_time.slice(0, 5)}{e.end_time ? ` – ${e.end_time.slice(0, 5)}` : ''}</span>}
            {e.location && <span className="flex items-center gap-2"><MapPin className="size-5 text-gold-500" />{pick(e, 'location', locale)}</span>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`/api/events/${e.id}/ics`} className="btn btn-dark !py-2.5"><CalendarPlus className="size-4" />{t(locale, 'addToCalendar')}</a>
            {e.link && <a href={e.link} target="_blank" rel="noopener" className="btn btn-outline !py-2.5">{t(locale, 'moreInfo')} <ExternalLink className="size-4" /></a>}
          </div>
        </div>
      </section>
      <section className="container-x max-w-4xl py-12">
        {e.image && <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-[1.5rem]"><Image src={e.image} alt="" fill sizes="(min-width:1024px) 900px, 100vw" className="object-cover" /></div>}
        {desc && <RichText html={desc} locale={locale} />}
      </section>
    </>
  );
}
