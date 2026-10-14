/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { Badge, PageTitleStatic, Pager, SearchBar } from '@/components/admin/static';
import { fmtDate } from '@/lib/format';

export default async function NewsList({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; page?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const per = 30, page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from('posts').select('id,title,slug,status,cover_image,published_at,categories', { count: 'exact' })
    .order('published_at', { ascending: false, nullsFirst: true }).range((page - 1) * per, page * per - 1);
  if (sp.q) q = q.ilike('title', `%${sp.q}%`);
  if (sp.cat) q = q.contains('categories', [sp.cat]);
  const [{ data, count }, cats] = await Promise.all([q, supabase.from('categories').select('slug,name').order('sort_order')]);
  return (
    <>
      <PageTitleStatic title="News & Events" subtitle={`${count ?? 0} articles`} actions={<Link href="/admin/news/new" className="btn btn-dark !py-2.5"><Plus className="size-4" />New article</Link>} />
      <SearchBar q={sp.q} placeholder="Search articles">
        <select name="cat" defaultValue={sp.cat ?? ''} className="rounded-xl border border-line bg-white px-3 py-2.5"><option value="">All categories</option>{cats.data?.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
      </SearchBar>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {data?.map(p => (
          <li key={p.id}>
            <Link href={`/admin/news/${p.id}`} className="flex items-center gap-4 p-3 hover:bg-sand-50">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-sand-100">{p.cover_image && <img src={p.cover_image} alt="" className="size-full object-cover" loading="lazy" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.title}</p><p className="text-sm text-stone-500">{fmtDate(p.published_at) || 'Not published yet'}</p></div>
              <Badge status={p.status} />
            </Link>
          </li>
        ))}
      </ul>
      <Pager page={page} pages={Math.ceil((count ?? 0) / per)} base={`/admin/news?q=${encodeURIComponent(sp.q ?? '')}&cat=${sp.cat ?? ''}`} />
    </>
  );
}
