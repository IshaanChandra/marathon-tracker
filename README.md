# NYC 26.2 — Marathon Tracker

Personal training tracker for a Sub-3:45 NYC Marathon plan (race day: **Sun Nov 1, 2026**).
Mobile-first, works on phone and laptop, progress syncs across devices.

Built from `Sub_3-45_NYC_Marathon_Plan.xlsx` (5 tabs → structured JSON). The plan itself is
immutable in git; check-offs, logged actuals, workout edits/swaps, and travel scenario picks
live in Supabase as a revertible override layer.

## Features

- **Today** — today's run (miles, pace/HR, workout structure, fueling cues), lift, one-tap
  check-offs, actual miles/pace/notes, race countdown
- **Plan** — Week / Month / Full views, phase-colored, planned-vs-done weekly bars
- **Progress** — miles done, run streak, % through plan, Strava-style weekly trend,
  Fitness check (Riegel marathon projection), race-day pacing + gel plan
- **Summary** — shareable week ⇄ month recap with history; Sunday-night recap push
- **Garmin auto-sync** — finished runs flow Garmin → Strava → webhook and check
  themselves off with distance + pace ([setup](docs/GARMIN_SYNC.md))
- **Run notifications** — Web Push to the installed iPhone PWA when a run syncs
- **Guide** — Travel adjustments (with A/B/C scenario pickers for the Italy and wedding
  weeks), Nutrition & Fueling, Paces & plan rationale
- **Edit any day** — change the workout, skip it, swap with another day this week; every
  edit shows an "Adjusted" badge and can be reverted to the original plan
- **Public to view, PIN to edit** — share the link with anyone; changes prompt for a
  one-time PIN per device
- **Offline-safe** — check-offs queue locally and sync when you're back online
- **Calendar feed** — subscribe via webcal and every workout (edits included) appears
  as a morning block in your phone calendar
- **Share-ready** — links unfurl with a branded card; share button in the nav
- **Light/dark mode** — Empire theme (NYC Marathon blue/orange), toggle in the nav
- **PWA** — add to iPhone home screen for an app-like feel

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase Postgres (or a local JSON
file store when Supabase env vars are unset) · Vercel.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000 — no PIN, local file store in .data/
```

Regenerate plan data after editing the spreadsheet:

```bash
python3 scripts/convert_xlsx.py   # validates weekly mileage, writes src/data/*.json
```

## Deploy (one-time setup)

1. **Supabase**: create a free project, run `supabase/schema.sql` in the SQL editor,
   copy the Project URL and `service_role` key.
2. **Vercel**: import this GitHub repo, set env vars `APP_PIN`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`, deploy. Optional features add `STRAVA_CLIENT_ID` /
   `STRAVA_CLIENT_SECRET` (auto-sync), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
   / `VAPID_SUBJECT` (push), `CRON_SECRET` (weekly-recap cron auth).
3. Open the Vercel URL on your phone → Share → Add to Home Screen.

Docs: [architecture](docs/ARCHITECTURE.md) · [data model](docs/DATA_MODEL.md) ·
[roadmap/progress](docs/ROADMAP.md) · [decisions](docs/DECISIONS.md) ·
[Garmin sync](docs/GARMIN_SYNC.md)
