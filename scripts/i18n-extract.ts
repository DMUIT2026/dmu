/**
 * Pulls every piece of visible text out of the website content (from Supabase) so it can be translated.
 * Writes migration/i18n/segments.json: [{ id, text }] with duplicates removed.
 */
import { config } from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

export const segId = (t: string) => crypto.createHash('sha1').update(t).digest('hex').slice(0, 12);
export const norm = (t: string) => t.replace(/\s+/g, ' ').trim();
/** Text worth translating: has letters, is not a link, email, code or number. */
export const translatable = (t: string) => /[A-Za-z]{2,}/.test(t) && !/^(https?:\/\/|www\.|\S+@\S+\.\S+$)/.test(t) && !/^[A-Z]{2,5}\s?-?\d{3,4}[A-Z]?$/.test(t);

const BLOCK = new Set(['p', 'li', 'td', 'th', 'h2', 'h3', 'h4', 'h5', 'summary', 'figcaption', 'blockquote', 'dt', 'dd', 'strong', 'span', 'a', 'em', 'caption']);
/** Text units of an HTML fragment: each text node, trimmed. */
export function htmlTexts(html: string): string[] {
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  const out: string[] = [];
  $('#r').find('*').addBack().contents().each((_, n) => {
    if (n.type === 'text') { const t = norm((n as unknown as { data: string }).data); if (t && translatable(t)) out.push(t); }
  });
  $('img[alt]').each((_, i) => { const t = norm($(i).attr('alt') ?? ''); if (translatable(t)) out.push(t); });
  void BLOCK;
  return out;
}

async function all<T>(table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from(table).select(cols).range(f, f + 999);
    if (error) throw error;
    rows.push(...(data as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function walkStrings(v: unknown, out: string[], key = '') {
  if (typeof v === 'string') { if (!/url|image|icon|href|link|logo|phone|email|map/i.test(key) && translatable(v)) out.push(norm(v)); }
  else if (Array.isArray(v)) v.forEach(x => walkStrings(x, out, key));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walkStrings(x, out, k);
}

const onlyMissing = process.argv.includes('--missing');
(async () => {
  const texts: string[] = [];
  const pages = (await all<{ title: string; subtitle: string | null; content: string; seo_description: string | null; meta: { facts?: { label: string; value: string }[] }; content_ar: string | null }>('pages', 'title,subtitle,content,seo_description,meta,content_ar')).filter(p => !onlyMissing || !p.content_ar);
  for (const p of pages) { texts.push(norm(p.title)); if (p.subtitle) texts.push(norm(p.subtitle)); if (p.seo_description) texts.push(norm(p.seo_description)); texts.push(...htmlTexts(p.content)); for (const f of p.meta?.facts ?? []) texts.push(norm(f.label), norm(f.value)); }
  const posts = (await all<{ title: string; excerpt: string | null; content: string; content_ar: string | null }>('posts', 'title,excerpt,content,content_ar')).filter(p => !onlyMissing || !p.content_ar);
  for (const p of posts) { texts.push(norm(p.title)); if (p.excerpt) texts.push(norm(p.excerpt)); texts.push(...htmlTexts(p.content)); }
  const people = onlyMissing ? [] : await all<{ name: string; title: string | null; department: string | null; college: string | null; bio: string }>('people', 'name,title,department,college,bio');
  for (const p of people) { for (const x of [p.name, p.title, p.department, p.college]) if (x) texts.push(norm(x)); texts.push(...htmlTexts(p.bio)); }
  const programs = onlyMissing ? [] : await all<{ title: string; college: string; level: string; start_date: string | null }>('programs', 'title,college,level,start_date');
  for (const p of programs) for (const x of [p.title, p.college, p.level, p.start_date]) if (x) texts.push(norm(x));
  const cats = onlyMissing ? [] : await all<{ name: string }>('categories', 'name'); cats.forEach(c => texts.push(norm(c.name)));
  const menus = onlyMissing ? [] : await all<{ title: string | null; items: unknown }>('menus', 'title,items'); menus.forEach(m => { if (m.title) texts.push(norm(m.title)); walkStrings(m.items, texts); });
  const settings = onlyMissing ? [] : await all<{ key: string; value: unknown }>('settings', 'key,value'); settings.forEach(s => walkStrings(s.value, texts));
  const seen = new Map<string, string>();
  for (const t of texts) if (t && translatable(t) && !seen.has(t)) seen.set(t, segId(t));
  const segs = [...seen].map(([text, id]) => ({ id, text }));
  const outFile = onlyMissing ? 'migration/i18n/segments-new.json' : 'migration/i18n/segments.json';
  fs.writeFileSync(outFile, JSON.stringify(segs));
  const chars = segs.reduce((n, s) => n + s.text.length, 0);
  console.log(`${texts.length} text pieces → ${segs.length} unique, ${Math.round(chars / 1000)}k characters`);
})();
