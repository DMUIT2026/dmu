export type Status = 'draft' | 'published';

export interface Page {
  original_url?: string | null;
  id?: string;
  path: string;
  title: string;
  subtitle?: string | null;
  hero_image?: string | null;
  template: 'default' | 'college' | 'program' | 'news' | 'contact' | 'directory' | 'form';
  content: string;
  meta: PageMeta;
  section?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  status: Status;
  sort_order?: number;
  updated_at?: string;
}

export interface PageMeta {
  facts?: { label: string; value: string }[];
  sidenav?: string;
  collegenav?: string;
  categories?: string[];
  [k: string]: unknown;
}

export interface Post {
  original_url?: string | null;
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image?: string | null;
  content: string;
  categories: string[];
  status: Status;
  featured?: boolean;
  published_at?: string | null;
  updated_at?: string;
}

export interface Category { slug: string; name: string; sort_order?: number }

export interface Person {
  id?: string;
  slug?: string | null;
  name: string;
  title?: string | null;
  department?: string | null;
  college?: string | null;
  email?: string | null;
  phone?: string | null;
  photo?: string | null;
  bio: string;
  in_directory: boolean;
  status: Status;
  sort_order?: number;
}

export interface Program {
  id?: string;
  title: string;
  page_path?: string | null;
  college: string;
  level: string;
  start_date?: string | null;
  image?: string | null;
  summary?: string | null;
  status: Status;
  sort_order?: number;
}

export interface MenuLink { label: string; url?: string | null; children?: MenuLink[] }
export interface MenuGroup { title: string; links: MenuLink[] }
export interface Menu {
  key: string;
  title?: string | null;
  url?: string | null;
  kind: 'menu' | 'college' | 'side';
  items: MenuLink[] | MenuGroup[];
}

export interface Settings {
  contact: { phone: string; phone_link: string; email: string; address: string; map_embed?: string };
  social: { label: string; url: string }[];
  home_hero: { eyebrow?: string; title?: string; text?: string; slides: { image: string; title?: string; text?: string; link?: string }[] };
  home_colleges: { title: string; url: string; icon: string; text?: string }[];
  home_stats: { title: string; items: { value: string; label: string }[] };
  home_alumni: { title: string; logos: string[] };
  home_intro?: { title: string; text: string; image?: string; link?: string };
  portal_links?: { label: string; url: string }[];
}
