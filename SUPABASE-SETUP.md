# Supabase setup — CASE FILE (assignment vlog)

This connects the site to a free Supabase project so every subject, entry,
journal post, progress mark, and photo upload lives in a real database and is
visible to all visitors — not just in your browser.

The site keeps working **without** a database (localStorage + IndexedDB, exactly
like before), so you can do this whenever you're ready.

> **Note:** there is no sign-in on this site by design. Everything is editable
> by anyone who visits, and all edits save straight to the database. If you
> ever want owner-only editing again, that history lives in the git history
> (commit `c7dedb8`).

---

## 1 · Create the project

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign up.
2. **New project** → give it a name (e.g. `case-file`) → set a database password
   (you won't need it day-to-day) → pick a region close to you → **Create**.
3. Wait ~1 minute for it to provision.

## 2 · Run the SQL (creates all tables + security)

1. In the Supabase sidebar open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy **all** of it, paste, **Run**.
   → Creates: `subjects`, `entries`, `entry_progress`, `journal_posts`,
   `profile`, `photos`, row-level-security rules, and the public
   `site-photos` storage bucket.
3. **New query** again: copy **all** of `supabase/seed.sql`, paste, **Run**.
   → Fills the database with your 5 subjects, 30 entries, 3 journal posts and
   your profile row (safe to re-run; it never duplicates).

## 3 · Connect the site

1. Copy **.env.example** to a new file named **.env** (project root).
2. In Supabase → **Project Settings** → **API Keys**, copy the publishable key
   (or the legacy anon key) into `.env`:

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

3. Restart the dev server (stop it, `npm run dev` again).

That's it — open the site and everything (entries, journal, progress, photo
uploads) saves directly to Supabase. No account, no sign-in.

---

## What is stored where

| Feature | Table / bucket | Notes |
|---|---|---|
| Course folders (subjects) | `subjects` | title, folder note, icon, case number |
| Entries (assignments) | `entries` | title, date, lede, description, key points, notes, **task**, wrap-up |
| Progress ("mark as done") | `entry_progress` | one row per done entry |
| Journal (life updates) | `journal_posts` | date, title, body |
| Profile (ID card, fandoms) | `profile` | single row, id = 1 |
| Photos (all upload slots) | `photos` + storage bucket `site-photos` | slot names: `me`, `entry-001-01`…, `course-<slug>`, `artwork-01…06` |

Photo slots fall back to `public/photos/<slot>.jpg` when nothing was uploaded
for them yet, so you can still ship photos with the build if you prefer.

## Everyday notes

- **Editing content**: use the normal edit buttons on the site, or edit rows
  directly in Supabase → **Table Editor**.
- **Changing the seed data**: edit `src/data/…`, then run
  `node scripts/gen-seed.mjs` to regenerate `supabase/seed.sql` (it only fills
  rows that don't exist yet).
- **Security reality check**: the anon key in `.env` is public by design and —
  because the site has no sign-in — anyone can read **and write** your database
  through it. That's the trade-off for zero-friction editing. If unwanted edits
  ever show up, re-add row-level security that only allows an authenticated
  owner (see git history for that version of `supabase/schema.sql`).
- **Storage quota**: the free tier includes 1 GB of storage — plenty for
  resized uploads (photos are shrunk to max 1280 px before upload).
- **No database?** Just delete `.env` — the site returns to fully-local mode.
