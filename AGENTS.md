<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Marathon Tracker — Agent Guide

## What this is

A personal, mobile-first training tracker for Ishaan's Sub-3:45 NYC Marathon plan
(race day: Sunday Nov 1, 2026). Single user. The plan spans May 25 → Nov 1, 2026:
3 Base Building bridge weeks (BB-1..BB-3) then 20 numbered training weeks across phases
Base → Hills → Intervals → Tempo/MP → Peak → Taper → Race.

Source of truth for the plan: `~/Desktop/Sub_3-45_NYC_Marathon_Plan.xlsx` (5 sheets),
converted once into structured JSON in `src/data/` by `scripts/convert_xlsx.py`.
**Never edit `src/data/plan.json` by hand for content fixes — fix the converter or the
xlsx and re-run.** (Exception: documented manual corrections noted in docs/DATA_MODEL.md.)

## Core design principle

Planned workouts are **static JSON committed to the repo**. User adjustments (check-offs,
logged actuals, workout edits/swaps/skips, travel scenario picks) live in **Supabase** and
are **merged on top at render time**. The original plan is never mutated; every adjustment
is revertible.

## Stack

- Next.js 16 (App Router, `src/` dir) + TypeScript + Tailwind CSS v4
- Supabase Postgres (free tier) for dynamic data, accessed **only from API routes**
  (service key stays server-side)
- PIN-gate auth: middleware checks an httpOnly cookie; PIN lives in env var `APP_PIN`
- Deployed on Vercel; PWA manifest for iPhone Add-to-Home-Screen

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build (run before pushing significant changes)
- `npm run lint` — eslint
- `python3 scripts/convert_xlsx.py` — regenerate `src/data/*.json` from the xlsx

## Layout

- `src/app/` — App Router pages and API routes
- `src/components/` — React components
- `src/lib/` — plan loading, override merge logic, date utils, supabase client
- `src/data/` — generated plan + reference JSON (committed)
- `scripts/` — xlsx converter
- `supabase/schema.sql` — database schema
- `docs/` — see below

## Documentation map (keep these updated)

- `docs/ARCHITECTURE.md` — stack, data flow, merge logic
- `docs/DATA_MODEL.md` — JSON schemas, Supabase schema, xlsx parsing notes
- `docs/ROADMAP.md` — **living progress tracker**; phases with checkboxes. Update at the
  end of every work session, then commit.
- `docs/DECISIONS.md` — decision log; append a dated entry for any non-obvious choice

## Conventions for agents

- Mobile-first: design at 390px width first, then widen. The primary device is an iPhone.
- Dates are plan-local: use `YYYY-MM-DD` strings in **America/New_York** semantics; never
  use raw `Date` UTC parsing for plan dates (see `src/lib/dates.ts` once it exists).
- All Supabase access goes through API routes under `src/app/api/`; client components call
  those routes. Never expose the service key to the client.
- After finishing a unit of work: update `docs/ROADMAP.md`, run `npm run build`, commit
  with a clear message, push.
- Pace/HR/fueling strings are athlete-facing — preserve exact numbers from the plan
  (e.g. MP 8:35/mi, easy HR 135–145, tempo 7:55–8:05, intervals 7:25–7:40).
