/**
 * Writes the Arabic translations (migration/i18n/out-*.json) into the *_ar fields in Supabase.
 * Only fills Arabic that is still empty, unless run with --overwrite (so reviewed Arabic is never lost).
 */
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const overwrite = process.argv.includes('--overwrite');
const DIR = 'migration/i18n';
const norm = (t: string) => t.replace(/\s+/g, ' ').trim();

const segs: { id: string; text: string }[] = JSON.parse(fs.readFileSync(path.join(DIR, 'segments.json'), 'utf8'));
const byId: Record<string, string> = {};
for (const f of fs.readdirSync(DIR).filter(f => /^out-\d+-\d+\.json$/.test(f))) Object.assign(byId, JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
const AR = new Map<string, string>();
for (const s of segs) if (byId[s.id] !== undefined) AR.set(s.text, byId[s.id].replace(/​/g, ''));

const tr = (s: string | null | undefined) => {
  if (!s) return s ?? null;
  const n = norm(s);
  return AR.has(n) ? AR.get(n)! : s;
};
function trHtml(html: string | null | undefined) {
  if (!html) return html ?? null;
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  $('#r').find('*').addBack().contents().each((_, n) => {
    if (n.type !== 'text') return;
    const node = n as unknown as { data: string };
    const n2 = norm(node.data);
    if (!n2 || !AR.has(n2)) return;
    const lead = node.data.match(/^\s*/)![0] ? ' ' : '', trail = node.data.match(/\s*$/)![0] ? ' ' : '';
    node.data = lead + AR.get(n2)! + trail;
  });
  $('img[alt]').each((_, i) => { const a = norm($(i).attr('alt') ?? ''); if (AR.has(a)) $(i).attr('alt', AR.get(a)!); });
  return $('#r').html();
}
function deep(v: unknown, key = ''): unknown {
  if (typeof v === 'string') return /url|image|icon|href|link|logo|phone|email|map/i.test(key) ? v : tr(v);
  if (Array.isArray(v)) return v.map(x => deep(x, key));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x, k)]));
  return v;
}
/** menus: keep the English and add label_ar / title_ar next to each label / title */
function menuAr(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(menuAr);
  if (v && typeof v === 'object') {
    const o = { ...(v as Record<string, unknown>) };
    if (typeof o.label === 'string' && (overwrite || !o.label_ar)) o.label_ar = tr(o.label);
    if (typeof o.title === 'string' && (overwrite || !o.title_ar)) o.title_ar = tr(o.title);
    for (const k of ['children', 'links']) if (o[k]) o[k] = menuAr(o[k]);
    return o;
  }
  return v;
}

async function all<T>(table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from(table).select(cols).range(f, f + 999);
    if (error) throw error; rows.push(...(data as T[])); if (!data || data.length < 1000) break;
  }
  return rows;
}
async function updateAll(table: string, rows: { id: string; patch: Record<string, unknown> }[], key = 'id') {
  let i = 0, n = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < rows.length) {
      const r = rows[i++];
      if (!Object.keys(r.patch).length) continue;
      const { error } = await sb.from(table).update(r.patch).eq(key, r.id);
      if (error) console.warn(table, r.id, error.message); else n++;
    }
  }));
  console.log(`${table}: ${n} updated`);
}
const fill = (cur: unknown, val: unknown) => overwrite || cur === null || cur === undefined || cur === '';

(async () => {
  console.log(`${AR.size} translations loaded`);
  type P = { id: string; title: string; subtitle: string | null; content: string; seo_description: string | null; meta: { facts?: { label: string; value: string }[] }; title_ar: string | null; subtitle_ar: string | null; content_ar: string | null; seo_description_ar: string | null };
  const pages = await all<P>('pages', 'id,title,subtitle,content,seo_description,meta,title_ar,subtitle_ar,content_ar,seo_description_ar');
  await updateAll('pages', pages.map(p => {
    const patch: Record<string, unknown> = {};
    if (fill(p.title_ar, 0)) patch.title_ar = tr(p.title);
    if (p.subtitle && fill(p.subtitle_ar, 0)) patch.subtitle_ar = tr(p.subtitle);
    if (fill(p.content_ar, 0)) patch.content_ar = trHtml(p.content);
    if (p.seo_description && fill(p.seo_description_ar, 0)) patch.seo_description_ar = tr(p.seo_description);
    if (p.meta?.facts?.length) patch.meta_ar = { facts: p.meta.facts.map(f => ({ label: tr(f.label), value: tr(f.value) })) };
    return { id: p.id, patch };
  }));
  type Po = { id: string; title: string; excerpt: string | null; content: string; title_ar: string | null; excerpt_ar: string | null; content_ar: string | null };
  const posts = await all<Po>('posts', 'id,title,excerpt,content,title_ar,excerpt_ar,content_ar');
  await updateAll('posts', posts.map(p => ({ id: p.id, patch: {
    ...(fill(p.title_ar, 0) ? { title_ar: tr(p.title) } : {}),
    ...(p.excerpt && fill(p.excerpt_ar, 0) ? { excerpt_ar: tr(p.excerpt) } : {}),
    ...(fill(p.content_ar, 0) ? { content_ar: trHtml(p.content) } : {}),
  } })));
  type Pe = { id: string; name: string; title: string | null; department: string | null; bio: string; name_ar: string | null; title_ar: string | null; department_ar: string | null; bio_ar: string | null };
  const people = await all<Pe>('people', 'id,name,title,department,bio,name_ar,title_ar,department_ar,bio_ar');
  await updateAll('people', people.map(p => ({ id: p.id, patch: {
    ...(fill(p.name_ar, 0) ? { name_ar: tr(p.name) } : {}),
    ...(p.title && fill(p.title_ar, 0) ? { title_ar: tr(p.title) } : {}),
    ...(p.department && fill(p.department_ar, 0) ? { department_ar: tr(p.department) } : {}),
    ...(p.bio && fill(p.bio_ar, 0) ? { bio_ar: trHtml(p.bio) } : {}),
  } })));
  const programs = await all<{ id: string; title: string; start_date: string | null; title_ar: string | null }>('programs', 'id,title,start_date,title_ar');
  await updateAll('programs', programs.map(p => ({ id: p.id, patch: fill(p.title_ar, 0) ? { title_ar: tr(p.title), start_date_ar: tr(p.start_date) } : {} })));
  const cats = await all<{ slug: string; name: string; name_ar: string | null }>('categories', 'slug,name,name_ar');
  await updateAll('categories', cats.map(c => ({ id: c.slug, patch: fill(c.name_ar, 0) ? { name_ar: tr(c.name) } : {} })), 'slug');
  const menus = await all<{ key: string; title: string | null; title_ar: string | null; items: unknown }>('menus', 'key,title,title_ar,items');
  await updateAll('menus', menus.map(m => ({ id: m.key, patch: { items: menuAr(m.items), ...(m.title && fill(m.title_ar, 0) ? { title_ar: tr(m.title) } : {}) } })), 'key');
  const settings = await all<{ key: string; value: unknown }>('settings', 'key,value');
  const have = new Set(settings.map(s => s.key));
  for (const s of settings) {
    if (s.key.endsWith('_ar') || (have.has(s.key + '_ar') && !overwrite)) continue;
    const { error } = await sb.from('settings').upsert({ key: s.key + '_ar', value: deep(s.value) });
    if (error) console.warn('settings', s.key, error.message);
  }
  console.log('settings: Arabic copies written');
})();
