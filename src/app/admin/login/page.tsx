'use client';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<'password' | 'reset'>('password');
  const [msg, setMsg] = useState<string | null>(params.get('error') === 'not-admin' ? 'This account does not have admin access. Ask an owner to add you.' : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email'));
    const supabase = browserClient();
    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: String(f.get('password')) });
      if (error) { setMsg('Email or password is incorrect.'); setBusy(false); return; }
      router.replace('/admin'); router.refresh();
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/admin/auth/callback?next=/admin/account` });
      setMsg(error ? error.message : 'Check your inbox for a link to set a new password.');
      setBusy(false);
    }
  }
  const input = 'w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-gold-500';
  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-[1.5rem] border border-line bg-white p-8 shadow-[var(--shadow-lift)]">
      <Image src="/brand/logo.png" alt="Dubai Medical University" width={200} height={65} className="h-12 w-auto" />
      <h1 className="font-display mt-8 text-3xl">{mode === 'password' ? 'Website admin' : 'Reset password'}</h1>
      <p className="mt-2 text-sm text-stone-500">{mode === 'password' ? 'Sign in to edit and publish website content.' : 'We will email you a secure link.'}</p>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className={input} /></label>
        {mode === 'password' && <label className="grid gap-1.5 text-sm font-medium">Password<input name="password" type="password" required autoComplete="current-password" className={input} /></label>}
      </div>
      {msg && <p className="mt-4 rounded-lg bg-sand-100 px-3 py-2 text-sm">{msg}</p>}
      <button disabled={busy} className="btn btn-dark mt-6 w-full justify-center disabled:opacity-60">{busy ? 'Please wait…' : mode === 'password' ? 'Sign in' : 'Send link'}</button>
      <button type="button" onClick={() => { setMode(mode === 'password' ? 'reset' : 'password'); setMsg(null); }} className="mt-4 w-full text-center text-sm text-stone-500 hover:text-ink">
        {mode === 'password' ? 'Forgot your password?' : 'Back to sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,rgb(187_159_82/0.18),transparent_60%)] p-6">
      <Suspense><LoginForm /></Suspense>
    </main>
  );
}
