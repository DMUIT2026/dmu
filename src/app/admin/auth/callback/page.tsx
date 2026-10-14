'use client';
import { useEffect, useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';

// Finishes sign-in from email links (invitations and password resets), then continues to `next`.
export default function AuthCallback() {
  const [msg, setMsg] = useState('Signing you in…');
  useEffect(() => {
    (async () => {
      const supabase = browserClient();
      const url = new URL(window.location.href);
      const next = url.searchParams.get('next') || '/admin/account';
      const code = url.searchParams.get('code');
      const hash = new URLSearchParams(url.hash.slice(1));
      let error: { message: string } | null = null;
      if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
      else if (hash.get('access_token') && hash.get('refresh_token'))
        ({ error } = await supabase.auth.setSession({ access_token: hash.get('access_token')!, refresh_token: hash.get('refresh_token')! }));
      else if (hash.get('error_description')) error = { message: hash.get('error_description')! };
      if (error) { setMsg('This link has expired or was already used. Please ask for a new one from the sign-in page.'); return; }
      window.location.replace(next.startsWith('/') ? next : '/admin');
    })();
  }, []);
  return <main className="grid min-h-screen place-items-center p-6"><p className="text-stone-500">{msg}</p></main>;
}
