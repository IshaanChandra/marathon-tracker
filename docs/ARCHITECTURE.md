# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser (phone / laptop)                                │
│  Next.js client components · localStorage offline cache  │
└──────────────┬──────────────────────────────────────────┘
               │ fetch (PIN cookie attached)
┌──────────────▼──────────────────────────────────────────┐
│  Vercel — Next.js 16 App Router                          │
│  middleware: PIN gate (httpOnly cookie vs APP_PIN env)   │
│  pages: server components read src/data/*.json           │
│  api routes: /api/{state,log,override,settings,pin,auth} │
│    /api/strava/* · /api/push/* · /api/calendar           │
│  cron: /api/push/weekly (Mon 01:00 UTC, vercel.json)     │
└──────────────┬──────────────────────────────────────────┘
               │ supabase-js (service key, server-only)
┌──────────────▼──────────────────────────────────────────┐
│  Supabase Postgres                                       │
│  day_log · day_override · settings                       │
└──────────────────────────────────────────────────────────┘
```

## Data flow & merge logic

1. **Static plan** (`src/data/plan.json`) maps every calendar date May 25 → Nov 1, 2026
   to a planned day (run / lift / rest / race) plus week metadata.
2. **Dynamic layer** from Supabase:
   - `day_log` — check-offs and logged actuals (run_done, lift_done, actual_miles, notes)
   - `day_override` — a JSON patch replacing/altering the planned workout for a date
     (edit, skip, swap)
   - `settings` — key/value JSON, e.g. travel scenario picks (`travel.italy = "B"`)
3. **Merge** (`src/lib/merge.ts`): `effectiveDay(date) = plan[date] ⊕ override[date]`,
   annotated with log state. Days with an override get `adjusted: true` for the UI badge.
   "Revert to plan" = delete the override row.
4. Client keeps the latest fetched state in localStorage so the app still renders
   offline / before sync resolves; writes are optimistic, then reconciled.

## Auth

Public-read, PIN-to-write. Anyone with the URL can view every page and `GET /api/state`.
`src/proxy.ts` (Next 16's middleware) gates only the mutating / owner-only routes
(`/api/log`, `/api/override`, `/api/settings`, `/api/strava/{connect,subscribe,test}`,
`/api/push/{subscribe,test}`) behind the `mt_auth` httpOnly cookie. `/api/auth` tells
the client whether the device is unlocked; un-authed visitors who try to make a change get
an in-page PIN modal (`PinModal`, wired through the store's mutation queue), and a
"View only" chip in the nav opens the same prompt proactively. `/api/pin` validates
against the `APP_PIN` env var and sets the cookie (year expiry — once per device).

## Views

The nav's Guide link opens `/guide/race-day` (first Guide tab) since 2026-10-25.

Bottom nav: Today · Plan · Progress · Summary · Guide.

- `/` Today — gradient hero (date nav, week fraction, countdown), run + lift + add-on
  cards, derived fueling (`FuelingPanel`), check-offs, tomorrow preview, swipe nav
- `/plan` — Week / Month / Full toggleable views
- `/progress` — stats tiles, weekly-mileage trend (`WeeklyTrendCard`), Fitness check
  (`RacePredictorCard`), race-day pacing (`RaceCard`), weekly bars, then the
  Strava / Push / Calendar connect cards
- `/summary` — week ⇄ month recap hero (`RecapCard`, shareable) + earlier-period history
  (`src/lib/periods.ts`, `weekStats.ts`)
- `/guide/travel`, `/guide/fueling`, `/guide/paces` — reference content from
  `src/data/reference.json` (travel has the A/B/C `ScenarioPicker`)
- `/guide/race-day` — Race Day Spectator Guide for family/friends (`SpectatorGuide`),
  content from hand-edited `src/data/spectator.ts`; static, no store/auth needed

## Garmin auto-sync (Strava bridge)

Finished runs auto-fill the log: Garmin → Strava → our webhook → `setLog`. Strava push
events hit `/api/strava/webhook` (open; guarded by a salted `?t=` secret + `owner_id`),
which acks in <2s and does the activity fetch + apply in Next's `after()`. OAuth tokens
live in the `settings` table under `strava.tokens` and are **redacted from the public
`/api/state`** (`isSecretSetting`); the UI reads only the non-secret `strava.status`.
Source-agnostic core: `activityToLogPatch` → `applyActivity` in `src/lib/strava.ts`.
Full setup + secret-handling notes: `docs/GARMIN_SYNC.md`. Env: `STRAVA_CLIENT_ID`,
`STRAVA_CLIENT_SECRET`.

## Run notifications (Web Push)

When a run auto-syncs, the owner's phone gets a notification. The Strava webhook's
`after()` calls `sendPush(runNotification(miles, pace))` on a successful apply. Web Push
works only on the **installed iOS PWA** (16.4+), served by a minimal `public/sw.js`
(push + notificationclick; no offline caching). Owner-only, mirroring the Strava token
model: `/api/push/subscribe` is PIN-gated (proxy matcher) and the subscriptions live in
the secret `push.subscriptions` setting, **redacted from the public `/api/state`**
(`isSecretSetting`). Subscriptions are per-device, so enabling on the phone never notifies
the laptop, and `PushCard` only shows the toggle in standalone display-mode. Env:
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public, inlined as `applicationServerKey`),
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

**Weekly recap push.** A Vercel cron (`vercel.json`, `0 1 * * 1` = Sun 9 PM EDT) hits
`/api/push/weekly`, which sends the wrapping week's `weekRecap()` (same function the
Summary card uses, so numbers match). The route is open to the proxy and guarded by
`CRON_SECRET` (`Authorization: Bearer …`) when that env var is set.

## Why these choices

See docs/DECISIONS.md. Short version: one Next.js codebase covers UI + API on Vercel's
free tier; Supabase free Postgres gives cross-device sync without running a server; the
plan itself stays in git so it's versioned and editable by agents.
