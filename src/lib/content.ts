import 'server-only';
import { cache } from 'react';
import { publicClient } from './supabase/public';
import { CONTENT_SOURCE } from './supabase/env';
import type { Category, DmuEvent, Menu, Page, Person, Post, Program, Settings } from './types';
import type { Locale } from './i18n';
import * as local from './local-content';

const db = () => publicClient();
const isLocal = CONTENT_SOURCE === 'local';

const allSettings = cache(async (): Promise<Record<string, unknown>> => {
  if (isLocal) return local.settings() as unknown as Record<string, unknown>;
  const { data } = await db().from('settings').select('key,value');
  const out: Record<string, unknown> = {};
  for (const r of data ?? []) out[r.key] = r.value;
  return out;
});
/** Settings that are the same in every language (social links: their labels pick the icons). */
const SAME_IN_ALL_LANGUAGES = new Set(['social']);

/** Site settings; for Arabic, any "<key>_ar" setting replaces the English one. */
export async function getSettings(l: Locale = 'en'): Promise<Settings> {
  const all = await allSettings();
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(all)) if (!k.endsWith('_ar')) out[k] = l === 'ar' && all[k + '_ar'] && !SAME_IN_ALL_LANGUAGES.has(k) ? all[k + '_ar'] : v;
  return out as unknown as Settings;
}

export const getMenu = cache(async (key: string): Promise<Menu | null> => {
  if (isLocal) return local.menu(key);
  const { data } = await db().from('menus').select('*').eq('key', key).maybeSingle();
  return (data as Menu) ?? null;
});

export const getPage = cache(async (path: string): Promise<Page | null> => {
  if (isLocal) return local.page(path);
  const { data } = await db().from('pages').select('*').eq('path', path).eq('status', 'published').maybeSingle();
  return (data as Page) ?? null;
});

export async function getAllPagePaths(): Promise<string[]> {
  if (isLocal) return local.pages().filter(p => p.status === 'published').map(p => p.path);
  const { data } = await db().from('pages').select('path').eq('status', 'published');
  return (data ?? []).map(r => r.path);
}

export const getCategories = cache(async (): Promise<Category[]> => {
  if (isLocal) return local.categories();
  const { data } = await db().from('categories').select('*').order('sort_order');
  return (data as Category[]) ?? [];
});

export interface PostQuery { categories?: string[]; page?: number; perPage?: number; q?: string }
export async function getPosts({ categories, page = 1, perPage = 12, q }: PostQuery = {}): Promise<{ posts: Post[]; total: number }> {
  if (isLocal) return local.posts({ categories, page, perPage, q });
  let query = db().from('posts')
    .select('slug,title,excerpt,title_ar,excerpt_ar,cover_image,categories,published_at,status', { count: 'exact' })
    .eq('status', 'published').order('published_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
  if (categories?.length) query = query.overlaps('categories', categories);
  if (q) query = query.or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`);
  const { data, count } = await query;
  return { posts: (data as Post[]) ?? [], total: count ?? 0 };
}

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  if (isLocal) return local.post(slug);
  const { data } = await db().from('posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Post) ?? null;
});

export async function getPrograms(): Promise<Program[]> {
  if (isLocal) return local.programs();
  const { data } = await db().from('programs').select('*').eq('status', 'published').order('sort_order');
  return (data as Program[]) ?? [];
}

export async function getDirectory(): Promise<Person[]> {
  if (isLocal) return local.people().filter(p => p.in_directory);
  const { data } = await db().from('people').select('slug,name,title,department,college,email,phone,photo,in_directory,status,sort_order,name_ar,title_ar,department_ar')
    .eq('status', 'published').eq('in_directory', true).order('name');
  return (data as Person[]) ?? [];
}

export const getPerson = cache(async (slug: string): Promise<Person | null> => {
  if (isLocal) return local.people().find(p => p.slug === slug) ?? null;
  const { data } = await db().from('people').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Person) ?? null;
});

export interface SearchHit { title: string; url: string; kind: 'Page' | 'News' | 'Person'; snippet?: string }
export async function search(q: string, l: Locale = 'en'): Promise<SearchHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  if (isLocal) return local.search(term);
  const like = `%${term.replace(/[%_]/g, '')}%`;
  const [pages, posts, people] = await Promise.all([
    db().from('pages').select('path,title,title_ar,seo_description,seo_description_ar').eq('status', 'published').or(`title.ilike.${like},content.ilike.${like},title_ar.ilike.${like},content_ar.ilike.${like}`).limit(25),
    db().from('posts').select('slug,title,title_ar,excerpt,excerpt_ar').eq('status', 'published').or(`title.ilike.${like},content.ilike.${like},title_ar.ilike.${like},content_ar.ilike.${like}`).order('published_at', { ascending: false }).limit(25),
    db().from('people').select('slug,name,name_ar,title,title_ar').eq('status', 'published').not('slug', 'is', null).or(`name.ilike.${like},name_ar.ilike.${like}`).limit(10),
  ]);
  const ar = l === 'ar';
  return [
    ...(pages.data ?? []).map(p => ({ title: (ar && p.title_ar) || p.title, url: '/' + p.path, kind: 'Page' as const, snippet: ((ar && p.seo_description_ar) || p.seo_description) ?? undefined })),
    ...(people.data ?? []).map(p => ({ title: (ar && p.name_ar) || p.name, url: '/people/' + p.slug, kind: 'Person' as const, snippet: ((ar && p.title_ar) || p.title) ?? undefined })),
    ...(posts.data ?? []).map(p => ({ title: (ar && p.title_ar) || p.title, url: '/news/' + p.slug, kind: 'News' as const, snippet: ((ar && p.excerpt_ar) || p.excerpt) ?? undefined })),
  ];
}

// ---------- events ----------
export async function getEvents({ from, to, category }: { from?: string; to?: string; category?: string } = {}): Promise<DmuEvent[]> {
  if (isLocal) return [];
  let q = db().from('events').select('*').eq('status', 'published').order('starts_on').order('start_time', { nullsFirst: true });
  // an event belongs to a period if it starts before the period ends and ends after it starts
  if (to) q = q.lte('starts_on', to);
  if (from) q = q.or(`ends_on.gte.${from},and(ends_on.is.null,starts_on.gte.${from})`);
  if (category && category !== 'all') q = q.eq('category', category);
  const { data } = await q;
  return (data as DmuEvent[]) ?? [];
}
export const getEvent = cache(async (id: string): Promise<DmuEvent | null> => {
  if (isLocal || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db().from('events').select('*').eq('id', id).eq('status', 'published').maybeSingle();
  return (data as DmuEvent) ?? null;
});
