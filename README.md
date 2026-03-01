# Image Bookmarker

Image URL bookmarking app with Supabase auth + per-user Postgres storage.

## Setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Install deps and run:

```bash
npm install
npm run dev
```

## Notes

- Authentication uses email/password via Supabase Auth.
- Bookmarks and custom categories are stored in Supabase tables with RLS.
- On first login, legacy localStorage bookmarks/categories can be imported.
- CSV import/export, duplicate detection, bulk edit, and drag/drop still work.
