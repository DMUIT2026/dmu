// Preview mode: serve the copied content straight from migration/data (used before Supabase is filled).
import 'server-only';
import { buildRows, type Rows } from './migration-rows';
import type { Settings } from './types';

let rows: Rows | null = null;
const r = () => (rows ??= buildRows());

export const settings = () => r().settings as unknown as Settings;
export const menu = (key: string) => r().menus.find(m => m.key === key) ?? null;
export const pages = () => r().pages;
export const page = (path: string) => r().pages.find(p => p.path === path && p.status === 'published') ?? null;
export const categories = () => r().categories;
export const post = (slug: string) => r().posts.find(p => p.slug === slug) ?? null;
export const programs = () => r().programs;
export const people = () => r().people;

export function posts({ categories, page = 1, perPage = 12, q }: { categories?: string[]; page?: number; perPage?: number; q?: string }) {
  let list = [...r().posts].sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
  if (categories?.length) list = list.filter(p => p.categories.some(c => categories.includes(c)));
  if (q) list = list.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
  return { posts: list.slice((page - 1) * perPage, page * perPage), total: list.length };
}

export function search(q: string) {
  const t = q.toLowerCase();
  const strip = (h: string) => h.replace(/<[^>]+>/g, ' ').toLowerCase();
  return [
    ...r().pages.filter(p => p.status === 'published' && (p.title.toLowerCase().includes(t) || strip(p.content).includes(t))).slice(0, 25)
      .map(p => ({ title: p.title, url: '/' + p.path, kind: 'Page' as const, snippet: p.seo_description ?? undefined })),
    ...r().people.filter(p => p.slug && p.name.toLowerCase().includes(t)).slice(0, 10)
      .map(p => ({ title: p.name, url: '/people/' + p.slug, kind: 'Person' as const, snippet: p.title ?? undefined })),
    ...r().posts.filter(p => p.title.toLowerCase().includes(t) || strip(p.content).includes(t)).slice(0, 25)
      .map(p => ({ title: p.title, url: '/news/' + p.slug, kind: 'News' as const, snippet: p.excerpt ?? undefined })),
  ];
}
