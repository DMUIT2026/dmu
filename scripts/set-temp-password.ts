// Gives an admin a one-time temporary password (written to admin-temp-password.txt, never printed).
// usage: npx tsx scripts/set-temp-password.ts someone@dmu.ae
import { config } from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
(async () => {
  const email = process.argv[2].toLowerCase();
  const { data } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const u = data.users.find(x => x.email?.toLowerCase() === email);
  if (!u) { console.log('no account for', email); return; }
  const pw = 'Dmu-' + crypto.randomBytes(9).toString('base64url');
  const { error } = await sb.auth.admin.updateUserById(u.id, { password: pw, email_confirm: true });
  if (error) { console.log('failed:', error.message); return; }
  fs.writeFileSync('admin-temp-password.txt', `DMU website admin – temporary sign-in\n\nAddress:  https://dmu-three.vercel.app/admin/login\nEmail:    ${email}\nPassword: ${pw}\n\nAfter signing in, open "My account" (bottom left) and choose your own password.\nThen delete this file.\n`, { mode: 0o600 });
  console.log('temporary password set for', email, '— saved to admin-temp-password.txt');
})();
