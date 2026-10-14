import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { Badge, PageTitleStatic, SearchBar } from '@/components/admin/static';
import { fmtDate } from '@/lib/format';

const CATS: Record<string, string> = { academic: 'Academic date', event: 'Event', conference: 'Conference', workshop: 'Workshop', 'open-day': 'Open day', holiday: 'Holiday', deadline: 'Deadline' };

export default async function EventsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; past?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
  let q = supabase.from('events').select('id,title,starts_on,ends_on,category,status,location').order('starts_on', { ascending: !sp.past }).limit(300);
  q = sp.past ? q.lt('starts_on', today) : q.or(`starts_on.gte.${today},ends_on.gte.${today}`);
  if (sp.q) q = q.ilike('title', `%${sp.q}%`);
  const { data } = await q;
  return (
    <>
      <PageTitleStatic title="Events calendar" subtitle="Events, academic dates, conferences and open days shown on the website calendar."
        actions={<Link href="/admin/events/new" className="btn btn-dark !py-2.5"><Plus className="size-4" />Add event</Link>} />
      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/admin/events" className={`rounded-full px-4 py-1.5 ${!sp.past ? 'bg-espresso text-white' : 'border border-line bg-white'}`}>Upcoming</Link>
        <Link href="/admin/events?past=1" className={`rounded-full px-4 py-1.5 ${sp.past ? 'bg-espresso text-white' : 'border border-line bg-white'}`}>Past</Link>
      </div>
      <SearchBar q={sp.q} placeholder="Search events" />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {!data?.length && <li className="p-6 text-stone-500">No events.</li>}
        {data?.map(e => (
          <li key={e.id}>
            <Link href={`/admin/events/${e.id}`} className="flex items-center gap-4 p-4 hover:bg-sand-50">
              <div className="w-28 shrink-0 text-sm text-stone-500">{fmtDate(e.starts_on + 'T12:00:00', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{e.title}</p><p className="text-sm text-stone-500">{CATS[e.category] ?? e.category}{e.location ? ` · ${e.location}` : ''}</p></div>
              <Badge status={e.status} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
