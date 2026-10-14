import 'server-only';
import { cache } from 'react';
import { publicClient } from './supabase/public';
import { CONTENT_SOURCE } from './supabase/env';
import type { Category, Menu, Page, Person, Post, Program, Settings } from './types';
import * as local from './local-content';

const db = () => publicClient();
const isLocal = CONTENT_SOURCE === 'local';

export const getSettings = cache(async (): Promise<Settings> => {
  if (isLocal) return local.settings();
  const { data } = await db().from('settings').select('key,value');
  const out: Record<string, unknown> = {};
  for (const r of data ?? []) out[r.key] = r.value;
  return out as unknown as Settings;
});

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
    .select('slug,title,excerpt,cover_image,categories,published_at,status', { count: 'exact' })
    .eq('status', 'published').order('published_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);
  if (categories?.length) query = query.overlaps('categories', categories);
  if (q) query = query.ilike('title', `%${q}%`);
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
  const { data } = await db().from('people').select('slug,name,title,department,college,email,phone,photo,in_directory,status,sort_order')
    .eq('status', 'published').eq('in_directory', true).order('name');
  return (data as Person[]) ?? [];
}

export const getPerson = cache(async (slug: string): Promise<Person | null> => {
  if (isLocal) return local.people().find(p => p.slug === slug) ?? null;
  const { data } = await db().from('people').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Person) ?? null;
});

export interface SearchHit { title: string; url: string; kind: 'Page' | 'News' | 'Person'; snippet?: string }
export async function search(q: string): Promise<SearchHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  if (isLocal) return local.search(term);
  const like = `%${term.replace(/[%_]/g, '')}%`;
  const [pages, posts, people] = await Promise.all([
    db().from('pages').select('path,title,seo_description').eq('status', 'published').or(`title.ilike.${like},content.ilike.${like}`).limit(25),
    db().from('posts').select('slug,title,excerpt').eq('status', 'published').or(`title.ilike.${like},content.ilike.${like}`).order('published_at', { ascending: false }).limit(25),
    db().from('people').select('slug,name,title').eq('status', 'published').not('slug', 'is', null).ilike('name', like).limit(10),
  ]);
  return [
    ...(pages.data ?? []).map(p => ({ title: p.title, url: '/' + p.path, kind: 'Page' as const, snippet: p.seo_description ?? undefined })),
    ...(people.data ?? []).map(p => ({ title: p.name, url: '/people/' + p.slug, kind: 'Person' as const, snippet: p.title ?? undefined })),
    ...(posts.data ?? []).map(p => ({ title: p.title, url: '/news/' + p.slug, kind: 'News' as const, snippet: p.excerpt ?? undefined })),
  ];
}
