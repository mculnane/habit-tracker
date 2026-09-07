# Habit Tracker

## Project
- React 19 + TypeScript + Tailwind v4 + Vite PWA app
- Backend: Supabase (auth + Postgres)
- Deployed to GitHub Pages at https://mculnane.github.io/habit-tracker/
- Repo: https://github.com/mculnane/habit-tracker (public)
- Despite `netlify.toml` existing, the app is NOT deployed on Netlify

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run lint` — ESLint
- npm is at `/usr/local/bin/npm` — prefix Bash calls with `export PATH="/usr/local/bin:$PATH"` if npm is not found

## Architecture
- Uses `HashRouter` (not BrowserRouter) for GitHub Pages compatibility
- Base path: `/habit-tracker/`
- Auth: Supabase OTP code entry (8-digit) with `implicit` flow type — works in standalone PWA context
- Email template customized in Supabase dashboard to include `{{ .Token }}` for OTP code
- `AuthenticatedApp` component ensures data hooks only run after session is confirmed (RLS needs `auth.uid()`)
- Supabase client configured in `src/lib/supabase.ts`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- DoNow sort: `src/lib/deadlinePressure.ts` `getUrgencyScore()` returns `remaining / daysLeft` — higher = more urgent. Tasks you must do today sort first.
- Manage sort: `src/lib/sortTasks.ts` `getUrgencyWeight()` — static frequency-based (no completion data available)
- Both paths go through `sortByUrgency()` which uses urgencyScore when available, falls back to weight
- Preview server requires auth — can't visually verify authenticated views in preview

## Known Issues
- Supabase free tier: 2 auth emails/hour — be careful with testing
- PWA standalone mode opens links in Safari (different context) — magic links won't work, hence OTP
- User data is private (Supabase RLS) despite public repo — source code is visible but data is not
- `npm run lint` should pass cleanly (0 errors, 0 warnings)

## Data
- `user_id` column exists on both tables with `DEFAULT auth.uid()` — backfill complete
- RLS policies scoped to `auth.uid() = user_id` — queries auto-filter by user, no explicit `.eq()` needed in code
- Supabase project ID: `fujsrzbfxtbiiycejaxd`
- **The project is shared — this app does not own it.** The free tier allows two projects across the whole account, so four apps live here: habit-tracker (`tasks`, `completions`), fabian's arena (`fabians_arena_progress`) and the world cup sweepstake (`sweep_*`) all share `public`, and Occupation Road has its own `occupation_road` schema. Consequences: `public` is not yours alone, so prefix or namespace anything new; **never run `supabase db push`** against it, since the CLI would treat the other apps' migrations as remote-only (apply DDL via the Supabase MCP `apply_migration`, prefixed per-app, as the others do); and storage buckets and `storage.objects` policy names are project-global, so both need an app-specific name. A new schema also has to be added by hand to Settings → API → Exposed schemas — no migration can do it, and until it is every anon query returns `PGRST106`.
- Capacity is the thing to watch, and it is not database size — 13 MB against 500 MB. The limits that bite are per-project and **pool across every app and schema here**: 1 GB storage and 5 GB egress a month. Occupation Road is an image-carrying essay site and two more of its kind are planned in this project, so egress is the number to check if anything starts failing. Moving images to Vercel Blob is the cheaper fix before upgrading the plan.
- `sort_order` column exists in `tasks` table but is no longer used — kept to avoid migration
- `tasks.frequency_type` is enforced by a DB CHECK constraint (`tasks_frequency_type_check`) as well as the `FrequencyType` union in `src/lib/types.ts` — adding a frequency type needs a migration that drops and re-adds the constraint (see `habit_tracker_allow_weekdays_frequency`) plus the mirror in `supabase-setup.sql`
