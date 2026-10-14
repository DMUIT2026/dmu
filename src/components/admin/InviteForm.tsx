'use client';
import { useActionState } from 'react';
import { inviteAdmin } from '@/app/admin/actions';
import { inputCls } from './ui';

export default function InviteForm() {
  const [state, action, pending] = useActionState(inviteAdmin, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-5">
      <label className="grid flex-1 gap-1.5 text-sm font-medium">Email address<input name="email" type="email" required className={inputCls} /></label>
      <label className="grid gap-1.5 text-sm font-medium">Role<select name="role" className={inputCls}><option value="editor">Editor – can edit and publish</option><option value="owner">Owner – can also manage admins</option></select></label>
      <button disabled={pending} className="btn btn-dark !py-2.5">{pending ? 'Sending…' : 'Send invitation'}</button>
      {state && <p className={`w-full text-sm ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>{state.ok ? 'Invitation sent. They will receive an email to set their password.' : state.error}</p>}
    </form>
  );
}
