// Preview mode: adds the Arabic translations (migration/i18n) to the local rows, the same way scripts/i18n-apply.ts fills Supabase.
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import type { Rows } from './migration-rows';

const DIR = path.join(process.cwd(), 'migration', 'i18n');
const norm = (t: string) => t.replace(/\s+/g, ' ').trim();

let AR: Map<string, string> | null = null;
function map() {
  if (AR) return AR;
  AR = new Map();
  if (!fs.existsSync(path.join(DIR, 'segments.json'))) return AR;
  const segs: { id: string; text: string }[] = JSON.parse(fs.readFileSync(path.join(DIR, 'segments.json'), 'utf8'));
  const byId: Record<string, string> = {};
  for (const f of fs.readdirSync(DIR).filter(f => /^out-\d+-\d+\.json$/.test(f))) Object.assign(byId, JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
  for (const s of segs) if (byId[s.id] !== undefined) AR.set(norm(s.text), byId[s.id].replace(/​/g, ''));
  return AR;
}

export const tr = (s: string | null | undefined) => (s ? map().get(norm(s)) ?? s : s ?? null);

export function trHtml(html: string | null | undefined) {
  if (!html) return html ?? null;
  const $ = cheerio.load(`<div id="r">${html}</div>`, null, false);
  $('#r').find('*').addBack().contents().each((_, n) => {
    if (n.type !== 'text') return;
    const node = n as unknown as { data: string };
    const t = map().get(norm(node.data));
    if (!t) return;
    node.data = (/^\s/.test(node.data) ? ' ' : '') + t + (/\s$/.test(node.data) ? ' ' : '');
  });
  $('img[alt]').each((_, i) => { const a = map().get(norm($(i).attr('alt') ?? '')); if (a) $(i).attr('alt', a); });
  return $('#r').html();
}

function deep(v: unknown, key = ''): unknown {
  if (typeof v === 'string') return /url|image|icon|href|link|logo|phone|email|map/i.test(key) ? v : tr(v);
  if (Array.isArray(v)) return v.map(x => deep(x, key));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x, k)]));
  return v;
}
function menuAr(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(menuAr);
  if (v && typeof v === 'object') {
    const o = { ...(v as Record<string, unknown>) };
    if (typeof o.label === 'string' && !o.label_ar) o.label_ar = tr(o.label);
    if (typeof o.title === 'string' && !o.title_ar) o.title_ar = tr(o.title);
    for (const k of ['children', 'links']) if (o[k]) o[k] = menuAr(o[k]);
    return o;
  }
  return v;
}

/** Fills the *_ar fields. Long HTML (content, bio) is translated on first use, see local-content.ts. */
export function addArabic(rows: Rows): Rows {
  for (const p of rows.pages) {
    p.title_ar ??= tr(p.title);
    if (p.subtitle) p.subtitle_ar ??= tr(p.subtitle);
    if (p.seo_description) p.seo_description_ar ??= tr(p.seo_description);
    if (p.meta?.facts?.length) p.meta_ar ??= { facts: p.meta.facts.map(f => ({ label: tr(f.label)!, value: tr(f.value)! })) };
  }
  for (const p of rows.posts) { p.title_ar ??= tr(p.title); if (p.excerpt) p.excerpt_ar ??= tr(p.excerpt); }
  for (const p of rows.people) {
    p.name_ar ??= tr(p.name);
    if (p.title) p.title_ar ??= tr(p.title);
    if (p.department) p.department_ar ??= tr(p.department);
  }
  for (const p of rows.programs) { p.title_ar ??= tr(p.title); if (p.start_date) p.start_date_ar ??= tr(p.start_date); }
  for (const c of rows.categories) c.name_ar ??= tr(c.name);
  for (const m of rows.menus) { m.items = menuAr(m.items) as typeof m.items; if (m.title) m.title_ar ??= tr(m.title); }
  // social links stay exactly as in English: their labels pick the icons
  for (const [k, v] of Object.entries(rows.settings)) if (!k.endsWith('_ar') && !(k + '_ar' in rows.settings)) rows.settings[k + '_ar'] = k === 'social' ? v : deep(v);
  return rows;
}
