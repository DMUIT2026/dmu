import { requireAdmin } from '@/lib/admin-auth';
import { PageTitleStatic } from '@/components/admin/static';
import { deleteMessage, setMessageRead } from '@/app/admin/actions';
import { fmtDate } from '@/lib/format';

export default async function Messages() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(200);
  return (
    <>
      <PageTitleStatic title="Messages" subtitle="Sent through the contact form on the website." />
      {!data?.length && <p className="text-stone-500">No messages yet.</p>}
      <ul className="space-y-3">
        {data?.map(m => (
          <li key={m.id} className={`rounded-2xl border bg-white p-5 ${m.read ? 'border-line' : 'border-gold-400'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{!m.read && <span className="mr-2 inline-block size-2 rounded-full bg-gold-500" />}{m.subject || 'No subject'}</p>
                <p className="text-sm text-stone-500">{m.name} · <a href={`mailto:${m.email}`} className="underline">{m.email}</a>{m.phone && ` · ${m.phone}`}</p>
              </div>
              <span className="text-sm text-stone-500">{fmtDate(m.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-[.95rem]">{m.body}</p>
            <div className="mt-4 flex gap-3 text-sm">
              <form action={setMessageRead.bind(null, m.id, !m.read)}><button className="text-bronze-700 hover:underline">{m.read ? 'Mark as unread' : 'Mark as read'}</button></form>
              <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject ?? 'Your message to DMU'))}`} className="text-bronze-700 hover:underline">Reply by email</a>
              <form action={deleteMessage.bind(null, m.id)}><button className="text-red-700 hover:underline">Delete</button></form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
