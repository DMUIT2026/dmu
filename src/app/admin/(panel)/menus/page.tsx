import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { PageTitleStatic } from '@/components/admin/static';

const KIND: Record<string, string> = { menu: 'Website menus', college: 'College menu bars', side: 'Side menus (shown beside pages)' };

export default async function MenusPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('menus').select('key,title,kind,items').order('title');
  return (
    <>
      <PageTitleStatic title="Menus" subtitle="Change the links shown in the top menu, the footer, college menu bars and side menus." />
      {Object.entries(KIND).map(([k, label]) => (
        <section key={k} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-bronze-600">{label}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data?.filter(m => m.kind === k).map(m => (
              <li key={m.key}><Link href={`/admin/menus/${m.key}`} className="block rounded-xl border border-line bg-white p-4 hover:border-gold-500">
                <p className="font-medium">{m.title || m.key}</p><p className="text-sm text-stone-500">{(m.items as unknown[]).length} {k === 'menu' ? 'items' : 'groups'}</p>
              </Link></li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
