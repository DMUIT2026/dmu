'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { adminClient } from '@/lib/supabase/admin';
import { serverClient } from '@/lib/supabase/server';
import { autoTranslate, translateFields, translatorConfig, DEFAULT_MODEL } from '@/lib/translate';

type Result = { ok: boolean; error?: string; id?: string; translated?: number; warning?: string; row?: Record<string, unknown> };
const refresh = () => revalidatePath('/', 'layout');
const clean = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !['created_at', 'updated_at'].includes(k))) as T;
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s/-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');

// ---------- pages ----------
export async function savePage(input: Record<string, unknown>): Promise<Result> {
  const { supabase } = await requireAdmin();
  const row = clean({ ...input });
  row.path = slugify(String(row.path ?? '')).replace(/^\/+|\/+$/g, '');
  if (!row.path || !row.title) return { ok: false, error: 'Title and web address are required.' };
  if (row.status === 'published' && !row.published_at) row.published_at = new Date().toISOString();
  const before = row.id ? (await supabase.from('pages').select('*').eq('id', row.id as string).maybeSingle()).data : null;
  const tr = await autoTranslate(supabase, row, before, [['title', 'title_ar'], ['subtitle', 'subtitle_ar'], ['content', 'content_ar'], ['seo_description', 'seo_description_ar']], { force: !!input.__translate });
  const out = tr.row as Record<string, unknown>;
  delete out.__translate;
  const facts = (out.meta as { facts?: { label: string; value: string }[] } | undefined)?.facts;
  if (tr.translated && facts?.length) {
    const cfg = await translatorConfig(supabase);
    try {
      const flat = Object.fromEntries(facts.flatMap((f, i) => [[`l${i}`, f.label], [`v${i}`, f.value]]));
      const t = await translateFields(cfg.apiKey, cfg.model, flat);
      out.meta_ar = { facts: facts.map((f, i) => ({ label: t[`l${i}`] ?? f.label, value: t[`v${i}`] ?? f.value })) };
    } catch { /* keep previous Arabic facts */ }
  }
  const q = out.id ? supabase.from('pages').update(out).eq('id', out.id as string) : supabase.from('pages').insert(out);
  const { data, error } = await q.select('*').single();
  if (error) return { ok: false, error: error.code === '23505' ? 'Another page already uses this web address.' : error.message };
  refresh();
  return { ok: true, id: data.id, translated: tr.translated, warning: tr.warning, row: data };
}
export async function deletePage(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from('pages').delete().eq('id', id);
  refresh(); redirect('/admin/pages');
}

// ---------- news ----------
export async function savePost(input: Record<string, unknown>): Promise<Result> {
  const { supabase } = await requireAdmin();
  const row = clean({ ...input });
  row.slug = slugify(String(row.slug || row.title || '')).replace(/\//g, '-');
  if (!row.slug || !row.title) return { ok: false, error: 'A title is required.' };
  if (row.status === 'published' && !row.published_at) row.published_at = new Date().toISOString();
  const before = row.id ? (await supabase.from('posts').select('*').eq('id', row.id as string).maybeSingle()).data : null;
  const tr = await autoTranslate(supabase, row, before, [['title', 'title_ar'], ['excerpt', 'excerpt_ar'], ['content', 'content_ar']], { force: !!input.__translate });
  const out = tr.row as Record<string, unknown>; delete out.__translate;
  const q = out.id ? supabase.from('posts').update(out).eq('id', out.id as string) : supabase.from('posts').insert(out);
  const { data, error } = await q.select('*').single();
  if (error) return { ok: false, error: error.code === '23505' ? 'Another article already uses this web address.' : error.message };
  refresh();
  return { ok: true, id: data.id, translated: tr.translated, warning: tr.warning, row: data };
}
export async function deletePost(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from('posts').delete().eq('id', id);
  refresh(); redirect('/admin/news');
}

// ---------- people ----------
export async function savePerson(input: Record<string, unknown>): Promise<Result> {
  const { supabase } = await requireAdmin();
  const row = clean({ ...input });
  row.slug = row.slug ? slugify(String(row.slug)).replace(/\//g, '-') : null;
  if (!row.name) return { ok: false, error: 'A name is required.' };
  const before = row.id ? (await supabase.from('people').select('*').eq('id', row.id as string).maybeSingle()).data : null;
  const tr = await autoTranslate(supabase, row, before, [['name', 'name_ar'], ['title', 'title_ar'], ['department', 'department_ar'], ['bio', 'bio_ar']], { force: !!input.__translate });
  const out = tr.row as Record<string, unknown>; delete out.__translate;
  const q = out.id ? supabase.from('people').update(out).eq('id', out.id as string) : supabase.from('people').insert(out);
  const { data, error } = await q.select('*').single();
  if (error) return { ok: false, error: error.code === '23505' ? 'Another profile already uses this web address.' : error.message };
  refresh();
  return { ok: true, id: data.id, translated: tr.translated, warning: tr.warning, row: data };
}
export async function deletePerson(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from('people').delete().eq('id', id);
  refresh(); redirect('/admin/people');
}

// ---------- programmes ----------
export async function saveProgram(input: Record<string, unknown>): Promise<Result> {
  const { supabase } = await requireAdmin();
  const row = clean({ ...input });
  if (!row.title) return { ok: false, error: 'A title is required.' };
  if (row.start_date !== undefined) {
    const before = row.id ? (await supabase.from('programs').select('*').eq('id', row.id as string).maybeSingle()).data : null;
    Object.assign(row, (await autoTranslate(supabase, row, before, [['title', 'title_ar'], ['start_date', 'start_date_ar']])).row);
  }
  const q = row.id ? supabase.from('programs').update(row).eq('id', row.id as string) : supabase.from('programs').insert(row);
  const { data, error } = await q.select('id').single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: data.id };
}
export async function deleteProgram(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('programs').delete().eq('id', id);
  refresh();
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---------- menus & settings ----------
export async function saveMenu(input: { key: string; title?: string | null; title_ar?: string | null; url?: string | null; kind: string; items: unknown }): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('menus').upsert(input);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
export async function saveSetting(key: string, value: unknown): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// ---------- messages ----------
export async function setMessageRead(id: string, read: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from('messages').update({ read }).eq('id', id);
  revalidatePath('/admin/messages');
}
export async function deleteMessage(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from('messages').delete().eq('id', id);
  revalidatePath('/admin/messages');
}

// ---------- admin users ----------
export async function inviteAdmin(_: unknown, form: FormData): Promise<Result> {
  const { role } = await requireAdmin();
  if (role !== 'owner') return { ok: false, error: 'Only owners can add people.' };
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const newRole = form.get('role') === 'owner' ? 'owner' : 'editor';
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
  const admin = adminClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let userId: string | undefined;
  const invited = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/admin/auth/callback?next=/admin/account` });
  if (invited.error) {
    // already has an account: look it up
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = data.users.find(u => u.email?.toLowerCase() === email)?.id;
    if (!userId) return { ok: false, error: invited.error.message };
  } else userId = invited.data.user?.id;
  const { error } = await admin.from('admins').upsert({ user_id: userId, email, role: newRole });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/users');
  return { ok: true };
}
export async function removeAdmin(userId: string) {
  const { role, user } = await requireAdmin();
  if (role !== 'owner' || user.id === userId) return;
  await adminClient().from('admins').delete().eq('user_id', userId);
  revalidatePath('/admin/users');
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

// ---------- events ----------
export async function saveEvent(input: Record<string, unknown>): Promise<Result> {
  const { supabase } = await requireAdmin();
  const row = clean({ ...input });
  if (!row.title || !row.starts_on) return { ok: false, error: 'A title and a start date are required.' };
  for (const k of ['ends_on', 'start_time', 'end_time', 'location', 'image', 'link']) if (row[k] === '') row[k] = null;
  const before = row.id ? (await supabase.from('events').select('*').eq('id', row.id as string).maybeSingle()).data : null;
  const tr = await autoTranslate(supabase, row, before, [['title', 'title_ar'], ['description', 'description_ar'], ['location', 'location_ar']], { force: !!input.__translate });
  const out = tr.row as Record<string, unknown>; delete out.__translate;
  const q = out.id ? supabase.from('events').update(out).eq('id', out.id as string) : supabase.from('events').insert(out);
  const { data, error } = await q.select('*').single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: data.id, translated: tr.translated, warning: tr.warning, row: data };
}
export async function deleteEvent(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from('events').delete().eq('id', id);
  refresh(); redirect('/admin/events');
}

// ---------- translation settings ----------
export async function saveTranslationSettings(_: unknown, form: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const key = String(form.get('api_key') ?? '').trim();
  const model = String(form.get('model') ?? '').trim() || DEFAULT_MODEL;
  const auto = form.get('auto') === 'on' ? 'on' : 'off';
  const rows: { key: string; value: string }[] = [{ key: 'gemini_model', value: model }, { key: 'auto_translate', value: auto }];
  if (key) {
    try { await translateFields(key, model, { t: 'Welcome to Dubai Medical University' }); }
    catch (e) { return { ok: false, error: (e as Error).message }; }
    rows.push({ key: 'gemini_api_key', value: key });
  }
  if (form.get('remove') === '1') rows.push({ key: 'gemini_api_key', value: '' });
  const { error } = await supabase.from('private_settings').upsert(rows);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/translation');
  return { ok: true };
}
