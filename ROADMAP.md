# Image Bookmarker — Backend & Auth Roadmap

## Current State

- Pure client-side React + Vite SPA
- All bookmarks stored in `localStorage` under `imageBookmarks:v1`
- No backend, no database, no auth
- Bookmarks are **URL references** (not uploaded files), so we don't need file/blob storage — just a database for the bookmark metadata

---

## High-Level Roadmap

### Phase 0 — Choose an Architecture

There are two main paths:

**Option A: Backend-as-a-Service (Supabase)**
- Supabase gives you Postgres, auth (email/password, OAuth, magic link), and a client SDK — all in one
- Fastest path to "working auth + remote DB"
- Free tier is generous (50k monthly active users, 500MB DB)
- You keep Vite + React as-is, just add the Supabase JS client

**Option B: Custom Backend (Express/Fastify + PostgreSQL)**
- Full control, no vendor lock-in
- More boilerplate: you write auth, API routes, DB migrations yourself
- Better if you want to learn backend fundamentals or have specific requirements

**Option C: Migrate to Next.js (or similar full-stack framework)**
- Server components, API routes, and middleware built in
- Biggest upfront migration cost (rewrite routing, build pipeline, deployment)
- Overkill unless you want SSR/SEO benefits

The rest of this roadmap assumes **Option A (Supabase)** since it's the fastest path and fits a bookmark app well, but the phases apply conceptually to any approach.

---

### Phase 1 — Database Schema & Supabase Setup

1. **Create a Supabase project** (free tier)
2. **Design the database tables:**

   ```
   users (managed by Supabase Auth)
   ├── id (uuid, PK)
   ├── email
   └── created_at

   bookmarks
   ├── id (uuid, PK)
   ├── user_id (uuid, FK → users.id)
   ├── url (text, NOT NULL)
   ├── mime_type (text, nullable)
   ├── media_type (text, nullable — 'image' | 'video')
   ├── title (text, nullable)
   ├── source_url (text, nullable)
   ├── categories (text[], default '{}')
   ├── topics (text[], default '{}')
   ├── created_at (timestamptz)
   └── UNIQUE(user_id, url)  -- prevent per-user duplicates

   custom_categories
   ├── id (uuid, PK)
   ├── user_id (uuid, FK → users.id)
   ├── name (text, NOT NULL)
   └── UNIQUE(user_id, name)
   ```

3. **Set up Row Level Security (RLS):**
   - Users can only read/write their own rows
   - Policy: `auth.uid() = user_id`

---

### Phase 2 — Authentication

1. **Install Supabase client:** `@supabase/supabase-js`
2. **Create an auth context/provider** in React that wraps the app
3. **Build auth UI pages:**
   - Sign up (email + password)
   - Log in
   - (Optional) OAuth providers (Google, GitHub)
   - (Optional) Magic link / passwordless
   - Log out
4. **Protected routes:** redirect unauthenticated users to the login page
5. **Session management:** Supabase handles JWT refresh tokens automatically via its client SDK

---

### Phase 3 — Data Access Layer (Replace localStorage)

This is the biggest code change — swapping out `src/lib/storage.ts` to talk to Supabase instead of localStorage.

1. **Create a new data access module** (e.g., `src/lib/api.ts` or `src/lib/supabase.ts`)
2. **Reimplement each storage function** against the remote DB:

   | Current (localStorage)          | New (Supabase)                          |
   |---------------------------------|-----------------------------------------|
   | `loadBookmarks()`               | `supabase.from('bookmarks').select()`   |
   | `saveBookmarks()`               | Not needed (individual ops instead)     |
   | `addBookmark()`                 | `supabase.from('bookmarks').insert()`   |
   | `updateBookmark()`              | `supabase.from('bookmarks').update()`   |
   | `removeBookmark()`              | `supabase.from('bookmarks').delete()`   |
   | `removeBookmarks()`             | Bulk delete by IDs                      |
   | `isDuplicateUrl()`              | Query with `.eq('url', normalizedUrl)`  |
   | `addBookmarksFromImport()`      | Bulk upsert                             |

3. **Handle loading states & errors** — remote calls are async and can fail, unlike localStorage which is synchronous. You'll need loading spinners and error toasts.
4. **Move search tokens server-side** — or keep computing them client-side and store them (simpler), or use Postgres full-text search (`tsvector/tsquery`) for a proper solution.

---

### Phase 4 — Migrate Existing localStorage Data

Users who already have bookmarks locally need a migration path:

1. **On first login**, check if `localStorage` has existing bookmarks
2. **Prompt the user:** "You have X local bookmarks. Import them to your account?"
3. **Bulk insert** the local bookmarks into the remote DB (with dedup)
4. **Clear localStorage** after successful migration (or keep as offline cache)

---

### Phase 5 — State Management Refactor

Right now, `App.tsx` holds all state and passes it down as props. With remote data, you'll want:

1. **React Query (TanStack Query)** or similar for:
   - Caching remote data locally
   - Automatic refetching / stale-while-revalidate
   - Optimistic updates (UI updates instantly, syncs in background)
   - Loading/error states per query
2. **Alternatively**, keep it simpler with `useEffect` + `useState` and manual fetch calls — but this gets messy fast with multiple operations

---

### Phase 6 — Polish & Edge Cases

1. **Offline support** (optional): keep a localStorage fallback, sync when back online
2. **Pagination server-side**: right now all bookmarks load at once — with a DB, you can paginate with `.range(from, to)`
3. **Rate limiting / abuse prevention**: Supabase has built-in rate limits, but consider adding your own for import operations
4. **Account management**: password reset, email change, delete account (+ cascade delete bookmarks)
5. **Environment variables**: store Supabase URL and anon key in `.env` (they're safe to expose client-side since RLS protects data)

---

## Suggested Implementation Order

| Step | What                                            | Effort |
|------|-------------------------------------------------|--------|
| 1    | Supabase project + DB schema + RLS              | Small  |
| 2    | Auth context + login/signup pages               | Medium |
| 3    | Replace `storage.ts` with Supabase calls        | Large  |
| 4    | localStorage migration flow                     | Small  |
| 5    | Add TanStack Query for caching/loading states   | Medium |
| 6    | Polish (error handling, offline, account mgmt)  | Medium |
