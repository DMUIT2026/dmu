# Dubai Medical University — website

The new dmu.ae website. Built with Next.js, content stored in Supabase, hosted on Vercel.

## For editors

Go to **/admin** on the website and sign in.

| What you want to do | Where |
| --- | --- |
| Change text, images or tables on a page | Pages → click the page → edit → **Save & update live** |
| Add a news story or event | News & Events → New article → **Publish** |
| Hide something without deleting it | Open it → **Unpublish** (it becomes a draft) |
| Check a change before visitors see it | **Preview** button on any page or article |
| Update staff profiles or the directory | Faculty & Staff |
| Change the home page banner, numbers, logos, phone/email | Home page & contact |
| Change menu links | Menus |
| Upload photos or PDFs | Images & files (or the image button inside the editor) |
| Read contact-form messages | Messages |
| Give a colleague access | Admin users (owners only) |

Changes appear on the live website within a few seconds of saving.

## For developers

```bash
npm install
npm run dev            # http://localhost:3000
```

Settings live in `.env.local` (never committed):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # publishable key
SUPABASE_SECRET_KEY=...                # server only: inviting admins, import
DATABASE_URL=...                       # only for the one-time import
NEXT_PUBLIC_SITE_URL=https://dmu.ae
CONTENT_SOURCE=local                   # optional: preview from migration/data without Supabase
```

### Content migration (one time)

1. `scripts/migrate/extract.mjs` turned the crawled copy of the old site into clean JSON in `migration/data/`.
2. `scripts/migrate/download.py` downloaded every image/document into `migration/media/` (not committed).
3. `npm run import -- --owner someone@dmu.ae` creates the database tables (`supabase/migrations`), uploads all files to Supabase Storage, loads every page, article, person, menu and setting, and invites the first admin owner.

Old addresses (`dmu.ae/home/...`) are permanently redirected to the new ones (see `next.config.ts`).

### Structure

- `src/app/(site)` — public website (home, pages, news, people, search)
- `src/app/admin` — admin area
- `src/lib/content.ts` — all reads of published content
- `supabase/migrations` — database tables and access rules (public can only read published content; only admins can write)
