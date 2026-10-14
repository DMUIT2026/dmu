import type { Metadata } from 'next';
import Header from '@/components/site/Header';
import PageHero from '@/components/site/PageHero';
import EventsCalendar, { CATEGORIES } from '@/components/events/EventsCalendar';
import { getEvents } from '@/lib/content';
import { isLocale, t, type Locale } from '@/lib/i18n';

export const revalidate = 300;
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ month?: string; cat?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; const l: Locale = isLocale(locale) ? locale : 'en';
  return { title: t(l, 'eventsTitle'), description: t(l, 'eventsSub') };
}

export default async function EventsPage({ params, searchParams }: Props) {
  const [{ locale: lc }, sp] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(lc) ? lc : 'en';
  const now = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? '') ? sp.month! : now;
  const cat = (CATEGORIES as readonly string[]).includes(sp.cat ?? '') ? sp.cat! : 'all';
  const [y, m] = month.split('-').map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const events = await getEvents({ from, to, category: cat });
  return (
    <>
      <Header overlay locale={locale} />
      <PageHero locale={locale} title={t(locale, 'eventsTitle')} eyebrow={t(locale, 'events')} crumbs={[{ label: t(locale, 'events') }]} subtitle={t(locale, 'eventsSub')} compact />
      <section className="container-x py-12 md:py-16"><EventsCalendar events={events} month={month} cat={cat} locale={locale} /></section>
    </>
  );
}
