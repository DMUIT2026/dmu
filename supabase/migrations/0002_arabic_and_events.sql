-- Arabic versions of all content + events calendar

-- Arabic fields. ar_status tracks whether a person has checked the (AI) translation.
alter table public.pages
  add column if not exists title_ar text,
  add column if not exists subtitle_ar text,
  add column if not exists content_ar text,
  add column if not exists meta_ar jsonb not null default '{}'::jsonb,
  add column if not exists seo_title_ar text,
  add column if not exists seo_description_ar text,
  add column if not exists ar_status text not null default 'needs_review' check (ar_status in ('needs_review','reviewed'));

alter table public.posts
  add column if not exists title_ar text,
  add column if not exists excerpt_ar text,
  add column if not exists content_ar text,
  add column if not exists ar_status text not null default 'needs_review' check (ar_status in ('needs_review','reviewed'));

alter table public.people
  add column if not exists name_ar text,
  add column if not exists title_ar text,
  add column if not exists department_ar text,
  add column if not exists bio_ar text;

alter table public.programs
  add column if not exists title_ar text,
  add column if not exists start_date_ar text;

alter table public.categories add column if not exists name_ar text;
alter table public.menus add column if not exists title_ar text;

-- Events calendar
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_ar text,
  description text not null default '',
  description_ar text,
  starts_on date not null,
  ends_on date,
  start_time time,
  end_time time,
  location text,
  location_ar text,
  category text not null default 'event' check (category in ('academic','event','conference','workshop','open-day','holiday','deadline')),
  image text,
  link text,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events (status, starts_on);

drop trigger if exists touch_events on public.events;
create trigger touch_events before update on public.events for each row execute function public.touch_updated_at();

alter table public.events enable row level security;
drop policy if exists "public read events" on public.events;
create policy "public read events" on public.events for select using (status = 'published' or public.is_admin());
drop policy if exists "admin write events" on public.events;
create policy "admin write events" on public.events for all using (public.is_admin()) with check (public.is_admin());
