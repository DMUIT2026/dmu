'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';
import { PageTitle, inputCls } from '@/components/admin/ui';

export default function Account() {
  const [msg, setMsg] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const a = String(f.get('p1')), b = String(f.get('p2'));
    if (a.length < 10) return setMsg('Please use at least 10 characters.');
    if (a !== b) return setMsg('The two passwords do not match.');
    const { error } = await browserClient().auth.updateUser({ password: a });
    setMsg(error ? error.message : 'Your password has been updated.');
  }
  return (
    <>
      <PageTitle title="My account" subtitle="Welcome! Choose a password (at least 10 characters). You will use it with your email address to sign in." />
      <form method="post" onSubmit={submit} className="grid max-w-md gap-4 rounded-2xl border border-line bg-white p-6">
        <label className="grid gap-1.5 text-sm font-medium">New password<input name="p1" type="password" autoComplete="new-password" className={inputCls} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Repeat new password<input name="p2" type="password" autoComplete="new-password" className={inputCls} /></label>
        {msg && <p className="text-sm">{msg}</p>}
        <button className="btn btn-dark justify-self-start !py-2.5">Save password</button>
      </form>
    </>
  );
}
