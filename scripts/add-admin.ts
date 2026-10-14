// Gives people admin (owner) access without sending an email. They then use "Forgot your password?" on /admin/login.
// usage: npx tsx scripts/add-admin.ts someone@dmu.ae other@dmu.ae
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await sb.auth.admin.listUsers({ perPage: 1000 });
  for (const email of process.argv.slice(2)) {
    let id = data.users.find(u => u.email?.toLowerCase() === email)?.id;
    if (!id) { const r = await sb.auth.admin.createUser({ email, email_confirm: true }); if (r.error) { console.log(email, r.error.message); continue; } id = r.data.user!.id; }
    const { error } = await sb.from('admins').upsert({ user_id: id, email, role: 'owner' });
    console.log(email, error ? error.message : 'account ready (owner)');
  }
})();
