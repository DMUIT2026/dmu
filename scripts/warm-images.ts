// Pre-converts every page banner photo on the live site so the first visitor does not wait.
// usage: npx tsx scripts/warm-images.ts https://dmu-three.vercel.app
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const site = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL!;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data: pages } = await sb.from('pages').select('hero_image').eq('status', 'published').range(0, 999);
  const { data: s } = await sb.from('settings').select('value').in('key', ['home_hero', 'home_intro']);
  const urls = new Set<string>((pages ?? []).map(p => p.hero_image).filter(Boolean));
  for (const r of s ?? []) { const v = r.value as { slides?: { image: string }[]; image?: string }; v.slides?.forEach(x => urls.add(x.image)); if (v.image) urls.add(v.image); }
  const jobs = [...urls].flatMap(u => [640, 828, 1080, 1280, 1600, 1920].flatMap(w => [80, 90].map(q => `${site}/_next/image?url=${encodeURIComponent(u)}&w=${w}&q=${q}`)));
  let i = 0, ok = 0, t0 = Date.now();
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < jobs.length) { const j = jobs[i++]; try { const r = await fetch(j, { headers: { Accept: 'image/webp,image/*' } }); if (r.ok) { await r.arrayBuffer(); ok++; } } catch { /* skip */ } }
  }));
  console.log(`${urls.size} photos, ${ok}/${jobs.length} sizes ready in ${Math.round((Date.now() - t0) / 1000)}s`);
})();
