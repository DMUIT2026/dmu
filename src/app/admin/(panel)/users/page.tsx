import { requireAdmin } from '@/lib/admin-auth';
import { PageTitleStatic } from '@/components/admin/static';
import InviteForm from '@/components/admin/InviteForm';
import { removeAdmin } from '@/app/admin/actions';

export default async function Users() {
  const { supabase, role, user } = await requireAdmin();
  const { data } = await supabase.from('admins').select('*').order('created_at');
  return (
    <>
      <PageTitleStatic title="Admin users" subtitle="People who can sign in and edit the website." />
      {role === 'owner' ? <InviteForm /> : <p className="rounded-xl bg-sand-100 p-4 text-sm">Only owners can add or remove admin users.</p>}
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {data?.map(a => (
          <li key={a.user_id} className="flex items-center justify-between gap-4 p-4">
            <div><p className="font-medium">{a.email}</p><p className="text-sm capitalize text-stone-500">{a.role}</p></div>
            {role === 'owner' && a.user_id !== user.id && <form action={removeAdmin.bind(null, a.user_id)}><button className="text-sm text-red-700 hover:underline">Remove access</button></form>}
          </li>
        ))}
      </ul>
    </>
  );
}
