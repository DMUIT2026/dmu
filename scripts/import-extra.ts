/**
 * Loads the merged Research, AI & Smart Education and Sustainability sites (migration/data/extra.json) into Supabase.
 * Downloads their images/videos, stores them in Supabase Storage and points the content at the stored copies.
 */
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { lookup } from 'mime-types';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
type P = { path: string; title: string; subtitle: string | null; hero_image: string | null; template: string; content: string; meta: Record<string, unknown>; section: string; original_url: string };
type Po = { slug: string; title: string; excerpt: string; cover_image: string | null; content: string; categories: string[]; published_at: string | null; original_url: string };
const data = JSON.parse(fs.readFileSync('migration/data/extra.json', 'utf8')) as { pages: P[]; posts: Po[]; assets: string[] };
const MEDIA = 'migration/media/extra';

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); })); }

async function uploadAll(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data: existing } = await sb.from('media').select('original_url,url').like('path', 'uploads/extra/%').range(0, 4999);
  for (const r of existing ?? []) if (r.original_url) map.set(r.original_url, r.url);
  const todo = [...new Set(data.assets.map(a => a.split('#')[0]))].filter(u => /^https?:\/\//.test(u) && !map.has(u));
  let ok = 0, skip = 0;
  await pool(todo, 6, async u => {
    const url = new URL(u);
    const key = `uploads/extra/${url.hostname.split('.')[0]}${decodeURIComponent(url.pathname).replace(/[^\w./-]+/g, '-')}`;
    const local = path.join(MEDIA, key.replace(/^uploads\/extra\//, ''));
    try {
      if (!fs.existsSync(local)) {
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 DMU-migration' } });
        if (!r.ok) { skip++; return; }
        fs.mkdirSync(path.dirname(local), { recursive: true });
        fs.writeFileSync(local, Buffer.from(await r.arrayBuffer()));
      }
      const body = fs.readFileSync(local);
      if (body.length > 49 * 1024 * 1024) { skip++; return; } // too big for the free plan: keep the original link
      const mime = lookup(local) || 'application/octet-stream';
      const { error } = await sb.storage.from('media').upload(key, body, { contentType: mime, upsert: true, cacheControl: '31536000' });
      if (error) { skip++; return; }
      const pub = sb.storage.from('media').getPublicUrl(key).data.publicUrl;
      await sb.from('media').upsert({ path: key, url: pub, name: path.basename(key), mime, size: body.length, original_url: u }, { onConflict: 'path' });
      map.set(u, pub); ok++;
    } catch { skip++; }
  });
  console.log(`files: ${ok} uploaded, ${skip} kept as original links, ${map.size} total`);
  return map;
}

const LAB_HERO = 'https://research.dmu.ae/home/wp-content/uploads/2025/10/lab_dmuho3.jpg';
const SE_HERO = 'https://smarteducation.dmu.ae/dmu-assets/dmu_students_lab.jpg';

(async () => {
  data.assets.push(LAB_HERO, SE_HERO);
  const map = await uploadAll();
  const fix = (s: string | null) => s ? s.replace(/https?:\/\/[^"'\s)<>]+/g, m => map.get(m.split('#')[0]) ?? m) : s;

  // ---- section menu bars ----
  const ar = (en: string, a: string) => ({ label: en, label_ar: a });
  const labs = data.pages.filter(p => /^research\/.+(lab|laboratory|labs)$/.test(p.path));
  const menus = [
    { key: 'college-research', title: 'Research', title_ar: 'البحث العلمي', url: '/research', kind: 'college', items: [
      { title: 'About', title_ar: 'عن البحث العلمي', links: [{ ...ar('About Research', 'عن البحث العلمي'), url: '/research/about-us' }, { ...ar('Research Areas', 'مجالات البحث'), url: '/research/research-areas' }, { ...ar('Contact the Research Office', 'التواصل مع مكتب البحث'), url: '/research/contact' }] },
      { title: 'Faculty Profiles', title_ar: 'ملفات الباحثين', url: '/research/faculty-profile', links: [] },
      { title: 'Publications', title_ar: 'المنشورات', url: '/research/research-publications', links: [] },
      { title: 'Laboratories', title_ar: 'المختبرات', links: [{ ...ar('All laboratories', 'جميع المختبرات'), url: '/research/laboratories' }, ...labs.map(l => ({ label: l.title, url: '/' + l.path }))] },
      { title: 'News & Events', title_ar: 'الأخبار والفعاليات', url: '/research/news-events', links: [] },
    ] },
    { key: 'college-ai-smart-education', title: 'AI & Smart Education Unit', title_ar: 'وحدة الذكاء الاصطناعي والتعليم الذكي', url: '/ai-smart-education', kind: 'college', items: [
      { title: 'About the Unit', title_ar: 'عن الوحدة', url: '/ai-smart-education/who-we-are', links: [] },
      { title: 'Innovation Ecosystem', title_ar: 'منظومة الابتكار', url: '/ai-smart-education/initiatives', links: [] },
      { title: 'Training & Courses', title_ar: 'التدريب والدورات', url: '/ai-smart-education/learning', links: [] },
      { title: 'MedEdAI Lab', title_ar: 'مختبر MedEdAI', url: '/ai-smart-education/mededai-lab', links: [] },
      { title: 'News & Updates', title_ar: 'الأخبار والمستجدات', url: '/ai-smart-education/news-events', links: [] },
    ] },
    { key: 'college-sustainability', title: 'Sustainability', title_ar: 'الاستدامة', url: '/sustainability', kind: 'college', items: [
      { title: 'About', title_ar: 'نبذة', links: [{ ...ar('Strategic direction', 'التوجه الاستراتيجي'), url: '/sustainability#about' }, { ...ar('Three pillars', 'الركائز الثلاث'), url: '/sustainability#pillars' }, { ...ar('Sustainability goals', 'أهداف الاستدامة'), url: '/sustainability-goals' }, { ...ar('UN SDGs', 'أهداف الأمم المتحدة للتنمية المستدامة'), url: '/sustainability#sdgs' }] },
      { title: 'Initiatives', title_ar: 'المبادرات', links: [{ ...ar('Our initiatives', 'مبادراتنا'), url: '/sustainability#initiatives' }, { ...ar('Green campus', 'الحرم الأخضر'), url: '/sustainability#green-campus' }, { ...ar('Sustainable projects', 'المشاريع المستدامة'), url: '/sustainable-projects' }, { ...ar('All initiatives', 'جميع المبادرات'), url: '/sustainability-initiatives' }] },
      { title: 'People', title_ar: 'الفريق', links: [{ ...ar('Sustainability committee', 'لجنة الاستدامة'), url: '/sustainability#committee' }, { ...ar('Sustainability team', 'فريق الاستدامة'), url: '/sustainability-team' }] },
      { title: 'News & Events', title_ar: 'الأخبار والفعاليات', url: '/sustainability-news-events', links: [] },
      { title: 'Get Involved', title_ar: 'شارك معنا', url: '/sustainability#get-involved', links: [] },
    ] },
  ];
  for (const m of menus) { const { error } = await sb.from('menus').upsert(m); if (error) throw error; }

  // ---- pages ----
  const navFor = (p: string) => p.startsWith('research') ? 'college-research' : p.startsWith('ai-smart-education') ? 'college-ai-smart-education' : 'college-sustainability';
  const rows = data.pages.map((p, i) => {
    let hero = p.hero_image || (p.path.startsWith('research') ? LAB_HERO : p.path.startsWith('ai-smart') ? SE_HERO : null);
    const meta = { ...p.meta, collegenav: navFor(p.path), ...(p.path === 'research/research-publications' ? { widget: 'scopus' } : {}) };
    const content = p.path === 'research/research-publications' ? '' : p.content;
    hero = fix(hero);
    return { path: p.path, title: p.title, subtitle: p.subtitle, hero_image: hero, template: p.template, content: fix(content), meta, section: p.section, status: 'published', sort_order: 2000 + i, original_url: p.original_url, published_at: new Date().toISOString() };
  });
  for (let i = 0; i < rows.length; i += 50) { const { error } = await sb.from('pages').upsert(rows.slice(i, i + 50), { onConflict: 'path' }); if (error) throw error; }
  // the main site's sustainability pages join the new sustainability menu bar
  for (const p of ['sustainability-goals', 'sustainability-initiatives', 'sustainability-news-events', 'sustainability-team', 'sustainable-projects']) {
    const { data: row } = await sb.from('pages').select('meta').eq('path', p).maybeSingle();
    if (row) await sb.from('pages').update({ meta: { ...(row.meta as object), collegenav: 'college-sustainability' } }).eq('path', p);
  }
  console.log(`pages: ${rows.length}`);

  // ---- research news ----
  await sb.from('categories').upsert({ slug: 'research', name: 'Research', name_ar: 'البحث العلمي', sort_order: 9 });
  const { data: existing } = await sb.from('posts').select('slug').range(0, 4999);
  const have = new Set((existing ?? []).map(r => r.slug));
  const posts = data.posts.map(p => ({ ...p, slug: have.has(p.slug) && !p.original_url.includes(p.slug) ? 'research-' + p.slug : p.slug, cover_image: fix(p.cover_image), content: fix(p.content), status: 'published' }));
  for (let i = 0; i < posts.length; i += 50) { const { error } = await sb.from('posts').upsert(posts.slice(i, i + 50), { onConflict: 'slug' }); if (error) throw error; }
  console.log(`research news: ${posts.length}`);

  // ---- main menu: open inside the website ----
  const { data: main } = await sb.from('menus').select('items').eq('key', 'main').single();
  type L = { label: string; label_ar?: string; url?: string | null; children?: L[] };
  const items = main!.items as L[];
  const walk = (l: L[]) => l.forEach(i => {
    if (i.url === 'https://research.dmu.ae') i.url = '/research';
    if (i.url && /smarteducation\.dmu\.ae/.test(i.url)) i.url = '/ai-smart-education';
    if (i.url && /sustainability\.dmu\.ae/.test(i.url)) i.url = '/sustainability';
    if (i.children) walk(i.children);
  });
  walk(items);
  await sb.from('menus').update({ items }).eq('key', 'main');
  console.log('main menu now links inside the website');
})();
