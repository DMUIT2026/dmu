import { getEvent } from '@/lib/content';

// "Add to my calendar": a standard calendar file that opens in Outlook, Google Calendar or Apple Calendar.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await getEvent(id);
  if (!e) return new Response('Not found', { status: 404 });
  const d = (s: string) => s.replace(/-/g, '');
  const next = (s: string) => { const x = new Date(s + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
  const esc = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/([,;\\])/g, '\\$1').replace(/\s+/g, ' ').trim();
  const timed = e.start_time
    ? [`DTSTART;TZID=Asia/Dubai:${d(e.starts_on)}T${e.start_time.slice(0, 5).replace(':', '')}00`, `DTEND;TZID=Asia/Dubai:${d(e.ends_on ?? e.starts_on)}T${(e.end_time ?? e.start_time).slice(0, 5).replace(':', '')}00`]
    : [`DTSTART;VALUE=DATE:${d(e.starts_on)}`, `DTEND;VALUE=DATE:${d(next(e.ends_on ?? e.starts_on))}`];
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dubai Medical University//Events//EN', 'BEGIN:VEVENT', `UID:${e.id}@dmu.ae`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, ...timed, `SUMMARY:${esc(e.title)}`,
    e.location ? `LOCATION:${esc(e.location)}` : '', e.description ? `DESCRIPTION:${esc(e.description).slice(0, 900)}` : '', 'END:VEVENT', 'END:VCALENDAR']
    .filter(Boolean).join('\r\n');
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="dmu-event.ics"` } });
}
