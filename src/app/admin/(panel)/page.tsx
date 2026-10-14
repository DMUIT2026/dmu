import Link from 'next/link';
import { FileText, Mail, Newspaper, Plus, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { PageTitleStatic } from '@/components/admin/static';
import { fmtDate } from '@/lib/format';

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const count = async (t: string, f?: [string, unknown]) => {
    let q = supabase.from(t).select('id', { count: 'exact', head: true });
    if (f) q = q.eq(f[0], f[1]);
    return (await q).count ?? 0;
  };
  const [pages, drafts, posts, people, unread, recentPages, recentPosts] = await Promise.all([
    count('pages'), count('pages', ['status', 'draft']), count('posts'), count('people'), count('messages', ['read', false]),
    supabase.from('pages').select('id,title,path,updated_at,status').order('updated_at', { ascending: false }).limit(6),
    supabase.from('posts').select('id,title,published_at,status').order('updated_at', { ascending: false }).limit(6),
  ]);
  const stat = (label: string, n: number, href: string, Icon: typeof FileText, note?: string) => (
    <Link href={href} className="rounded-2xl border border-line bg-white p-5 transition hover:border-gold-500">
      <Icon className="size-5 text-bronze-600" />
      <p className="font-display mt-4 text-4xl">{n}</p>
      <p className="mt-1 text-sm text-stone-500">{label}{note && <span className="ml-1 text-amber-700">· {note}</span>}</p>
    </Link>
  );
  return (
    <>
      <PageTitleStatic title="Welcome back" subtitle="Edit pages, publish news and keep the website up to date." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat('Pages', pages, '/admin/pages', FileText, drafts ? `${drafts} drafts` : undefined)}
        {stat('News & events', posts, '/admin/news', Newspaper)}
        {stat('Faculty & staff', people, '/admin/people', Users)}
        {stat('Unread messages', unread, '/admin/messages', Mail)}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/news/new" className="btn btn-dark !py-2.5"><Plus className="size-4" />New article</Link>
        <Link href="/admin/pages/new" className="btn btn-outline !py-2.5"><Plus className="size-4" />New page</Link>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-bronze-600">Recently edited pages</h2>
          <ul className="mt-3 divide-y divide-line">
            {recentPages.data?.map(p => <li key={p.id}><Link href={`/admin/pages/${p.id}`} className="flex justify-between gap-4 py-3 hover:text-bronze-700"><span className="truncate">{p.title}</span><span className="shrink-0 text-sm text-stone-500">{fmtDate(p.updated_at, { day: 'numeric', month: 'short' })}</span></Link></li>)}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-bronze-600">Recent news</h2>
          <ul className="mt-3 divide-y divide-line">
            {recentPosts.data?.map(p => <li key={p.id}><Link href={`/admin/news/${p.id}`} className="flex justify-between gap-4 py-3 hover:text-bronze-700"><span className="truncate">{p.title}</span><span className="shrink-0 text-sm text-stone-500">{fmtDate(p.published_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span></Link></li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
