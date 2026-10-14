// One-time fill of Scopus author IDs: from the Scopus links already in each profile, then from a
// tab-separated list (name, email, scopus id). usage: npx tsx scripts/fill-scopus-ids.ts list.tsv [--apply]
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const apply = process.argv.includes('--apply');
const list = readFileSync(process.argv[2], 'utf8').trim().split('\n').map(l => { const [name, email, id] = l.split('\t'); return { name, email: email === '-' ? '' : email.toLowerCase(), id }; });

const STOP = new Set(['dr', 'prof', 'professor', 'mr', 'mrs', 'ms', 'al', 'el', 'abd', 'abdul', 'mohamed', 'mohammed', 'muhammad', 'ahmed', 'ahmad']);
const toks = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\b(el|al)\s+/g, '$1').split(/\s+/).filter(t => t.length > 1 && !STOP.has(t));
const fromLink = (html?: string | null) => html?.match(/authorId=(\d{6,})/)?.[1] ?? null;
function byName(name: string) {
  const a = toks(name);
  if (!a.length) return null;
  const hits = list.filter(r => { const b = toks(r.name); const [s, l] = a.length <= b.length ? [a, b] : [b, a]; return s.length >= 2 ? s.every(t => l.includes(t)) : s.length === 1 && l.length === 1 && s[0] === l[0]; });
  return hits.length === 1 ? hits[0] : null;
}

(async () => {
  const { data: people } = await sb.from('people').select('id,name,email,bio,scopus_author_id');
  for (const p of people ?? []) {
    let id = fromLink(p.bio), how = 'profile link';
    if (!id) { const r = list.find(x => x.email && x.email === p.email?.toLowerCase() && toks(x.name).some(t => toks(p.name).includes(t))) ?? byName(p.name); if (r) { id = r.id; how = `QA Hub (${r.name})`; } }
    if (!id || id === p.scopus_author_id) { if (!id) console.log('  none  person', p.name); continue; }
    console.log('  set   person', p.name, id, '←', how);
    if (apply) await sb.from('people').update({ scopus_author_id: id }).eq('id', p.id);
  }
  const { data: pages } = await sb.from('pages').select('id,path,title,content,meta').like('path', 'research/%');
  for (const p of pages ?? []) {
    if (!/^(dr|prof)\b/i.test(p.title)) continue;
    let id = fromLink(p.content), how = 'profile link';
    if (!id) { const r = byName(p.title); if (r) { id = r.id; how = `QA Hub (${r.name})`; } }
    if (!id || id === p.meta?.scopus_author_id) { if (!id) console.log('  none  page  ', p.title); continue; }
    console.log('  set   page  ', p.title, id, '←', how);
    if (apply) await sb.from('pages').update({ meta: { ...(p.meta ?? {}), scopus_author_id: id } }).eq('id', p.id);
  }
})();
