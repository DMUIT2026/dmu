import { notFound } from 'next/navigation';
import MenuEditor from '@/components/admin/MenuEditor';
import { requireAdmin } from '@/lib/admin-auth';
import type { Menu } from '@/lib/types';

export default async function EditMenu({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('menus').select('key,title,url,kind,items').eq('key', key).maybeSingle();
  if (!data) notFound();
  return <MenuEditor initial={data as Menu} />;
}
