-- Private settings (e.g. the Gemini translation key). Only signed-in admins can read or change them; never public.
create table if not exists public.private_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table public.private_settings enable row level security;
drop policy if exists "admin manage private settings" on public.private_settings;
create policy "admin manage private settings" on public.private_settings for all using (public.is_admin()) with check (public.is_admin());
