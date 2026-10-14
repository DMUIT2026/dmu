// Gives every live page without a real banner photo a campus photo (same rule as the import).
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { heroFor } from '../src/lib/migration-rows';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data: pages } = await sb.from('pages').select('id,path,hero_image');
  const { data: media } = await sb.from('media').select('original_url,url').like('original_url', '%header%').range(0, 999);
  const toNew = new Map((media ?? []).map(m => [m.original_url, m.url]));
  let n = 0;
  for (const p of pages ?? []) {
    const want = heroFor(p.path, p.hero_image);
    if (want === p.hero_image) continue;
    const url = toNew.get(want) ?? want;
    await sb.from('pages').update({ hero_image: url }).eq('id', p.id); n++;
  }
  console.log(`updated ${n} page banners`);
})();
