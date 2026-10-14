import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import type { DmuEvent } from '@/lib/types';
import { fmtDateL, lhref, pick, t, type Locale } from '@/lib/i18n';

export const CATEGORIES = ['all', 'academic', 'event', 'conference', 'workshop', 'open-day', 'holiday', 'deadline'] as const;
const CAT_COLOR: Record<string, string> = {
  academic: 'bg-bronze-600', event: 'bg-gold-500', conference: 'bg-emerald-700', workshop: 'bg-sky-700', 'open-day': 'bg-rose-700', holiday: 'bg-stone-500', deadline: 'bg-red-700',
};
export const catColor = (c: string) => CAT_COLOR[c] ?? 'bg-gold-500';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addMonths = (ym: string, n: number) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return iso(d).slice(0, 7); };
const occurs = (e: DmuEvent, day: string) => e.starts_on <= day && (e.ends_on ?? e.starts_on) >= day;

/** Month grid + list. Server-rendered; month and category come from the address (?month=2026-10&cat=academic). */
export default function EventsCalendar({ events, month, cat, locale }: { events: DmuEvent[]; month: string; cat: string; locale: Locale }) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  // weeks start on Monday
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => iso(new Date(Date.UTC(y, m - 1, i + 1))))];
  while (cells.length % 7) cells.push(null);
  const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
  const q = (mm: string, c = cat) => lhref(locale, `/events?month=${mm}${c !== 'all' ? `&cat=${c}` : ''}`);
  const weekdays = Array.from({ length: 7 }, (_, i) => fmtDateL(iso(new Date(Date.UTC(2024, 0, 1 + i))) + 'T12:00:00', locale, { weekday: 'short' }));
  const monthEvents = events.filter(e => e.starts_on <= `${month}-31` && (e.ends_on ?? e.starts_on) >= `${month}-01`);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <Link key={c} href={q(month, c)} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${cat === c ? 'border-espresso bg-espresso text-white' : 'border-line bg-white hover:border-gold-500'}`}>
            {c !== 'all' && <span className={`size-2 rounded-full ${catColor(c)}`} />}{t(locale, `cat_${c}` as 'cat_all')}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        {/* month grid */}
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line p-4">
            <Link href={q(addMonths(month, -1))} aria-label={t(locale, 'previous')} className="grid size-10 place-items-center rounded-full border border-line hover:border-gold-500"><ChevronLeft className="size-4 flip-rtl" /></Link>
            <div className="text-center">
              <p className="font-display text-2xl">{fmtDateL(`${month}-15T12:00:00`, locale, { month: 'long', year: 'numeric' })}</p>
              {month !== today.slice(0, 7) && <Link href={q(today.slice(0, 7))} className="text-xs text-bronze-700 hover:underline">{t(locale, 'today')}</Link>}
            </div>
            <Link href={q(addMonths(month, 1))} aria-label={t(locale, 'next')} className="grid size-10 place-items-center rounded-full border border-line hover:border-gold-500"><ChevronRight className="size-4 flip-rtl" /></Link>
          </div>
          <div className="grid grid-cols-7 border-b border-line bg-sand-50 text-center text-xs font-semibold text-stone-500">
            {weekdays.map(w => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const evs = d ? events.filter(e => occurs(e, d)) : [];
              return (
                <div key={i} className={`min-h-[92px] border-b border-e border-line p-1.5 text-start sm:min-h-[110px] ${!d ? 'bg-sand-50/60' : ''} ${(i + 1) % 7 === 0 ? 'border-e-0' : ''}`}>
                  {d && (
                    <>
                      <span className={`grid size-7 place-items-center rounded-full text-xs ${d === today ? 'bg-gold-500 font-semibold text-espresso' : 'text-stone-500'}`}>{Number(d.slice(8))}</span>
                      <div className="mt-1 space-y-1">
                        {evs.slice(0, 3).map(e => (
                          <Link key={e.id} href={lhref(locale, `/events/${e.id}`)} title={pick(e, 'title', locale)}
                            className={`block truncate rounded-md px-1.5 py-0.5 text-[.7rem] leading-tight text-white ${catColor(e.category)} hover:opacity-85`}>
                            {pick(e, 'title', locale)}
                          </Link>
                        ))}
                        {evs.length > 3 && <span className="block px-1 text-[.7rem] text-stone-500">+{evs.length - 3}</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* list for the month */}
        <div>
          <h2 className="font-display text-2xl">{fmtDateL(`${month}-15T12:00:00`, locale, { month: 'long', year: 'numeric' })}</h2>
          {monthEvents.length === 0 ? <p className="mt-4 text-stone-500">{t(locale, 'noEvents')}</p> : (
            <ul className="mt-4 space-y-3">
              {monthEvents.map(e => <EventRow key={e.id} e={e} locale={locale} />)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventRow({ e, locale }: { e: DmuEvent; locale: Locale }) {
  const range = e.ends_on && e.ends_on !== e.starts_on
    ? `${fmtDateL(e.starts_on + 'T12:00:00', locale, { day: 'numeric', month: 'short' })} – ${fmtDateL(e.ends_on + 'T12:00:00', locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : fmtDateL(e.starts_on + 'T12:00:00', locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <li>
      <Link href={lhref(locale, `/events/${e.id}`)} className="group flex gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-gold-200 hover:shadow-[var(--shadow-soft)]">
        <span className={`w-1.5 shrink-0 rounded-full ${catColor(e.category)}`} />
        <span className="min-w-0">
          <span className="text-xs font-semibold text-bronze-600">{t(locale, `cat_${e.category}` as 'cat_event')}</span>
          <span className="mt-0.5 block font-medium leading-snug text-ink group-hover:text-bronze-700">{pick(e, 'title', locale)}</span>
          <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            <span>{range}</span>
            {e.start_time && <span className="ltr flex items-center gap-1"><Clock className="size-3.5" />{e.start_time.slice(0, 5)}{e.end_time ? `–${e.end_time.slice(0, 5)}` : ''}</span>}
            {e.location && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{pick(e, 'location', locale)}</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}
