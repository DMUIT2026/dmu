import 'server-only';
import { redirect } from 'next/navigation';
import { serverClient } from './supabase/server';

/** Returns the signed-in admin (and a Supabase client acting as them), or sends them away. */
export async function requireAdmin() {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: admin } = await supabase.from('admins').select('role,email').eq('user_id', user.id).maybeSingle();
  if (!admin) redirect('/admin/login?error=not-admin');
  return { supabase, user, role: admin.role as 'owner' | 'editor' };
}
