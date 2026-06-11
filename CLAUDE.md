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
- `sort_order` column exists in `tasks` table but is no longer used — kept to avoid migration
