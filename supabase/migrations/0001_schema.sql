-- DMU website content schema

create extension if not exists pgcrypto;

-- Who may use the admin area
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner','editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Pages (About, Colleges, Programs, Admissions, ...)
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,              -- e.g. 'college-of-medicine/doctor-of-medicine'
  title text not null,
  subtitle text,
  hero_image text,
  template text not null default 'default' check (template in ('default','college','program','news','contact','directory','form')),
  content text not null default '',       -- clean HTML
  meta jsonb not null default '{}'::jsonb, -- template-specific data (program facts, etc.)
  section text,                           -- top menu group, used for breadcrumbs / side nav
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order int not null default 0,
  original_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pages_status_idx on public.pages (status);

-- News & events
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  sort_order int not null default 0
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  cover_image text,
  content text not null default '',
  categories text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  original_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (status, published_at desc);
create index if not exists posts_categories_idx on public.posts using gin (categories);

-- Degree programmes (cards on home page and program finder)
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  page_path text,                         -- links to pages.path
  college text not null,
  level text not null default 'Undergraduate',
  start_date text,
  image text,
  summary text,
  status text not null default 'published' check (status in ('draft','published')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- Menus: main navigation, footer link lists, college menus and page side-menus.
-- items = [{label, url, children:[...]}]  or for side/college menus [{title, links:[{label,url}]}]
create table if not exists public.menus (
  key text primary key,
  title text,
  url text,
  kind text not null default 'menu' check (kind in ('menu','college','side')),
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Faculty & staff (directory entries and full profile pages)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  slug text unique,                       -- set when the person has a profile page (/people/slug)
  name text not null,
  title text,
  department text,
  college text,
  email text,
  phone text,
  photo text,
  bio text not null default '',
  in_directory boolean not null default true,
  status text not null default 'published' check (status in ('draft','published')),
  sort_order int not null default 0,
  original_url text,
  updated_at timestamptz not null default now()
);

-- Site-wide settings (contact details, home page blocks, statistics ...)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Media library (every uploaded image/document, for searching and picking in the admin)
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,              -- path inside the "media" storage bucket
  url text not null,
  name text not null,
  mime text,
  size bigint,
  alt text,
  original_url text,
  created_at timestamptz not null default now()
);
create index if not exists media_name_idx on public.media (lower(name));
create index if not exists media_original_idx on public.media (original_url);

-- Contact form messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['pages','posts','programs','settings','menus','people'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s; create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- Row level security: the public sees only published content; admins see and change everything
alter table public.admins enable row level security;
alter table public.pages enable row level security;
alter table public.posts enable row level security;
alter table public.categories enable row level security;
alter table public.programs enable row level security;
alter table public.menus enable row level security;
alter table public.people enable row level security;
alter table public.settings enable row level security;
alter table public.messages enable row level security;
alter table public.media enable row level security;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "public read pages" on public.pages;
create policy "public read pages" on public.pages for select using (status = 'published' or public.is_admin());
drop policy if exists "admin write pages" on public.pages;
create policy "admin write pages" on public.pages for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read posts" on public.posts;
create policy "public read posts" on public.posts for select using (status = 'published' or public.is_admin());
drop policy if exists "admin write posts" on public.posts;
create policy "admin write posts" on public.posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read programs" on public.programs;
create policy "public read programs" on public.programs for select using (status = 'published' or public.is_admin());
drop policy if exists "admin write programs" on public.programs;
create policy "admin write programs" on public.programs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read menus" on public.menus;
create policy "public read menus" on public.menus for select using (true);
drop policy if exists "admin write menus" on public.menus;
create policy "admin write menus" on public.menus for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read people" on public.people;
create policy "public read people" on public.people for select using (status = 'published' or public.is_admin());
drop policy if exists "admin write people" on public.people;
create policy "admin write people" on public.people for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);
drop policy if exists "admin write settings" on public.settings;
create policy "admin write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read media rows" on public.media;
create policy "public read media rows" on public.media for select using (true);
drop policy if exists "admin write media rows" on public.media;
create policy "admin write media rows" on public.media for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can send message" on public.messages;
create policy "anyone can send message" on public.messages for insert with check (true);
drop policy if exists "admin manage messages" on public.messages;
create policy "admin manage messages" on public.messages for all using (public.is_admin()) with check (public.is_admin());

-- Public file storage for images and documents
insert into storage.buckets (id, name, public) values ('media','media', true)
  on conflict (id) do update set public = true;
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());
