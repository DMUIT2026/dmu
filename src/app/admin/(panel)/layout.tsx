import AdminNav from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
// saving can include an automatic translation, which may take a little longer
export const maxDuration = 60;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdmin();
  const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('read', false);
  return (
    <>
      <AdminNav email={user.email ?? ''} unread={count ?? 0} />
      <div className="lg:pl-64"><div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</div></div>
    </>
  );
}
