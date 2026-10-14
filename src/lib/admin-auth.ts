import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { serverClient } from './supabase/server';

/**
 * Returns the signed-in admin (and a Supabase client acting as them), or sends them away.
 * Cached per request, so the layout and the page share one check. The login token is verified
 * locally (getClaims) instead of asking the login server on every click.
 */
export const requireAdmin = cache(async () => {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect('/admin/login');
  const { data: admin } = await supabase.from('admins').select('role,email').eq('user_id', claims.sub).maybeSingle();
  if (!admin) redirect('/admin/login?error=not-admin');
  return { supabase, user: { id: claims.sub as string, email: (claims.email as string) ?? admin.email }, role: admin.role as 'owner' | 'editor' };
});
