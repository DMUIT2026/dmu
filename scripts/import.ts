/**
 * One-time import of the copied dmu.ae content into Supabase.
 *   npm run import            -> creates tables, uploads files, loads all content
 *   npm run import -- --owner you@dmu.ae   -> also makes that person the first admin owner
 * Safe to run again: it updates existing rows and skips files already uploaded.
 */
import 'dotenv/config';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { lookup } from 'mime-types';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { buildRows } from '../src/lib/migration-rows';

config({ path: '.env.local' });
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const DB = process.env.DATABASE_URL!;
if (!KEY || !DB || DB.includes('YOUR-PASSWORD')) { console.error('Please fill SUPABASE_SECRET_KEY and DATABASE_URL in .env.local first.'); process.exit(1); }
const sb = createClient(URL_, KEY, { auth: { persistSession: false } });
const MEDIA = path.join(process.cwd(), 'migration', 'media');
const ownerArg = process.argv.indexOf('--owner');
const ownerEmail = ownerArg > -1 ? process.argv[ownerArg + 1] : null;

async function schema() {
  const pg = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  for (const f of fs.readdirSync('supabase/migrations').sort()) {
    process.stdout.write(`schema ${f}… `);
    await pg.query(fs.readFileSync(path.join('supabase/migrations', f), 'utf8'));
    console.log('ok');
  }
  await pg.end();
}

async function pool<T>(items: T[], n: number, fn: (t: T, i: number) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

async function uploadMedia(): Promise<Map<string, string>> {
  const map = JSON.parse(fs.readFileSync('migration/data/media_map.json', 'utf8')) as Record<string, { status: string; file: string | null }>;
  const { data: existing } = await sb.from('media').select('original_url,url').limit(10000);
  const done = new Map((existing ?? []).filter(r => r.original_url).map(r => [r.original_url as string, r.url as string]));
  const urlMap = new Map<string, string>(done);
  const todo = Object.entries(map).filter(([u, v]) => v.file && !done.has(u));
  console.log(`files: ${done.size} already uploaded, ${todo.length} to upload`);
  let n = 0;
  await pool(todo, 6, async ([orig, v]) => {
    const local = path.join(MEDIA, v.file!);
    const key = 'uploads/' + v.file!.replace(/[^\w./-]+/g, '-');
    const mime = lookup(local) || 'application/octet-stream';
    const body = fs.readFileSync(local);
    const { error } = await sb.storage.from('media').upload(key, body, { contentType: mime, upsert: true, cacheControl: '31536000' });
    if (error) { console.warn('upload failed', key, error.message); return; }
    const pub = sb.storage.from('media').getPublicUrl(key).data.publicUrl;
    await sb.from('media').upsert({ path: key, url: pub, name: path.basename(key), mime, size: body.length, original_url: orig }, { onConflict: 'path' });
    urlMap.set(orig, pub);
    if (++n % 100 === 0) console.log(`  uploaded ${n}/${todo.length}`);
  });
  return urlMap;
}

function rewriter(urlMap: Map<string, string>) {
  // index by path after /uploads/ so http/https and resized variants all match
  const byPath = new Map<string, string>();
  for (const [o, u] of urlMap) { const k = o.split('#')[0].replace(/^https?:\/\/(www\.)?/, ''); byPath.set(k, u); }
  const re = /(?:https?:)?\/\/(?:www\.)?dmu\.ae\/home\/(?:wp-content\/uploads|downloads)\/[^"'\s)<>]+/g;
  return (s: string) => s.replace(re, m => {
    const k = m.split('#')[0].replace(/^(?:https?:)?\/\/(www\.)?/, '');
    return byPath.get(k) ?? byPath.get(k.replace(/-\d{2,4}x\d{2,4}(\.\w+)$/, '$1')) ?? m;
  });
}

async function upsert(table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 200), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`${table}: ${rows.length} rows`);
}

async function main() {
  await schema();
  const urlMap = await uploadMedia();
  const fix = rewriter(urlMap);
  const rows = JSON.parse(fix(JSON.stringify(buildRows()))) as ReturnType<typeof buildRows>;

  await upsert('categories', rows.categories, 'slug');
  await upsert('pages', rows.pages.map(p => ({ ...p, published_at: p.status === 'published' ? new Date().toISOString() : null })), 'path');
  await upsert('posts', rows.posts, 'slug');
  // people: no natural key for directory-only entries, so replace them all
  await sb.from('people').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await upsert('people', rows.people, 'id');
  await sb.from('programs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await upsert('programs', rows.programs, 'id');
  await upsert('menus', rows.menus, 'key');
  await upsert('settings', Object.entries(rows.settings).map(([key, value]) => ({ key, value })), 'key');

  const left = JSON.stringify(rows).match(/dmu\.ae\/home\/wp-content\/uploads\/[^"\\]+/g) ?? [];
  console.log(`links still pointing to old site files: ${new Set(left).size}`);

  if (ownerEmail) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let id: string | undefined;
    const inv = await sb.auth.admin.inviteUserByEmail(ownerEmail, { redirectTo: `${site}/admin/auth/callback?next=/admin/account` });
    if (inv.error) { const { data } = await sb.auth.admin.listUsers({ perPage: 1000 }); id = data.users.find(u => u.email?.toLowerCase() === ownerEmail.toLowerCase())?.id; }
    else id = inv.data.user?.id;
    if (!id) throw new Error('Could not create the owner account: ' + inv.error?.message);
    await sb.from('admins').upsert({ user_id: id, email: ownerEmail.toLowerCase(), role: 'owner' });
    console.log(`owner: ${ownerEmail} ${inv.error ? '(existing account)' : '(invitation email sent)'}`);
  }
  console.log('Import finished.');
}

main().catch(e => { console.error(e); process.exit(1); });
