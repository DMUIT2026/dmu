import Link from 'next/link';
import { Plus, UserRound } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { PageTitleStatic, Pager, SearchBar } from '@/components/admin/static';

export default async function PeopleList({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const per = 40, page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from('people').select('id,name,title,department,college,photo,slug,in_directory,status', { count: 'exact' }).order('name').range((page - 1) * per, page * per - 1);
  if (sp.q) q = q.or(`name.ilike.%${sp.q}%,title.ilike.%${sp.q}%,department.ilike.%${sp.q}%`);
  const { data, count } = await q;
  return (
    <>
      <PageTitleStatic title="Faculty & Staff" subtitle="People in the directory and their profile pages." actions={<Link href="/admin/people/new" className="btn btn-dark !py-2.5"><Plus className="size-4" />Add person</Link>} />
      <SearchBar q={sp.q} placeholder="Search by name, title or department" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {data?.map(p => (
          <li key={p.id}>
            <Link href={`/admin/people/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 hover:border-gold-500">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-sand-100">{p.photo ? <img src={p.photo} alt="" className="size-full object-cover object-top" loading="lazy" /> : <UserRound className="size-6 text-stone-500" />}</div>
              <div className="min-w-0"><p className="truncate font-medium">{p.name}</p><p className="truncate text-sm text-stone-500">{p.title}</p>
                <p className="mt-0.5 text-xs text-stone-500">{p.slug ? 'Has profile page' : 'Directory only'}{!p.in_directory && ' · hidden from directory'}{p.status === 'draft' && ' · draft'}</p></div>
            </Link>
          </li>
        ))}
      </ul>
      <Pager page={page} pages={Math.ceil((count ?? 0) / per)} base={`/admin/people?q=${encodeURIComponent(sp.q ?? '')}`} />
    </>
  );
}
