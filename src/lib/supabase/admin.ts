import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

/** Full-access client. Only used on the server for inviting admins. */
export const adminClient = () => {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
};
