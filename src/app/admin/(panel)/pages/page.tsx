import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { Badge, PageTitleStatic, Pager, SearchBar } from '@/components/admin/static';
import { fmtDate } from '@/lib/format';

const SECTIONS: Record<string, string> = { '': 'All sections', 'college-of-medicine': 'College of Medicine', 'college-of-pharmacy': 'College of Pharmacy', 'college-of-nursing': 'College of Nursing', 'college-of-health-sciences': 'College of Health Sciences', general: 'University pages' };

export default async function PagesList({ searchParams }: { searchParams: Promise<{ q?: string; section?: string; status?: string; page?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const per = 40, page = Math.max(1, Number(sp.page) || 1);
  let q = supabase.from('pages').select('id,title,path,status,template,updated_at', { count: 'exact' }).order('path').range((page - 1) * per, page * per - 1);
  if (sp.q) q = q.or(`title.ilike.%${sp.q}%,path.ilike.%${sp.q}%`);
  if (sp.section === 'general') q = q.is('section', null);
  else if (sp.section) q = q.eq('section', sp.section);
  if (sp.status) q = q.eq('status', sp.status);
  const { data, count } = await q;
  const base = `/admin/pages?q=${encodeURIComponent(sp.q ?? '')}&section=${sp.section ?? ''}&status=${sp.status ?? ''}`;
  const sel = 'rounded-xl border border-line bg-white px-3 py-2.5';
  return (
    <>
      <PageTitleStatic title="Pages" subtitle={`${count ?? 0} pages`} actions={<Link href="/admin/pages/new" className="btn btn-dark !py-2.5"><Plus className="size-4" />New page</Link>} />
      <SearchBar q={sp.q} placeholder="Search by title or address">
        <select name="section" defaultValue={sp.section ?? ''} className={sel}>{Object.entries(SECTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ''} className={sel}><option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option></select>
      </SearchBar>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-sand-100/70 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3">Title</th><th className="hidden px-4 py-3 md:table-cell">Address</th><th className="px-4 py-3">Status</th><th className="hidden px-4 py-3 sm:table-cell">Updated</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.map(p => (
              <tr key={p.id} className="hover:bg-sand-50">
                <td className="px-4 py-3"><Link href={`/admin/pages/${p.id}`} className="font-medium hover:text-bronze-700">{p.title}</Link></td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-stone-500 md:table-cell">/{p.path}</td>
                <td className="px-4 py-3"><Badge status={p.status} /></td>
                <td className="hidden px-4 py-3 text-stone-500 sm:table-cell">{fmtDate(p.updated_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={Math.ceil((count ?? 0) / per)} base={base} />
    </>
  );
}
