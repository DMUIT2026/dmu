-- Scopus author ID for each person (used to show live research metrics and publications)
alter table public.people add column if not exists scopus_author_id text;
