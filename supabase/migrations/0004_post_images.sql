-- Up to 3 extra photos per news article, each with its own position, alignment, size and caption
alter table public.posts add column if not exists images jsonb not null default '[]'::jsonb;
