import { notFound } from 'next/navigation';
import PageEditor from '@/components/admin/PageEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { Page } from '@/lib/types';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [menus, cats] = await Promise.all([
    supabase.from('menus').select('key,title,kind').in('kind', ['college', 'side']).order('title'),
    supabase.from('categories').select('slug,name').order('sort_order'),
  ]);
  let page: Page = { path: '', title: '', template: 'default', content: '', meta: {}, status: 'draft' };
  if (id !== 'new') {
    const { data } = await supabase.from('pages').select('*').eq('id', id).maybeSingle();
    if (!data) notFound();
    page = data as Page;
  }
  return <PageEditor initial={page} menus={menus.data ?? []} categories={cats.data ?? []} />;
}
