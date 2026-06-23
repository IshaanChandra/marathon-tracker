# Roadmap & Progress

> Living tracker. Update checkboxes + the session log at the end of every work session.

## Phase 0 — Scaffold & GitHub
- [x] Scaffold Next.js 16 (TS, Tailwind v4, App Router, src dir)
- [x] AGENTS.md / CLAUDE.md project guide
- [x] docs/: ARCHITECTURE, DATA_MODEL, ROADMAP, DECISIONS
- [x] git init + initial commit
- [x] Install gh CLI
- [x] Private GitHub repo created and pushed: github.com/IshaanChandra/marathon-tracker

## Phase 1 — Data conversion (xlsx → JSON) ✅
- [x] `scripts/convert_xlsx.py` parsing all 5 sheets
- [x] `src/data/plan.json` with every date May 25 → Nov 1 mapped (161 days, 23 weeks)
- [x] `src/data/reference.json` (travel / fueling / paces)
- [x] Mileage validation: per-week sum of parsed run miles == "Run Miles" column (all 23 OK)
- [x] Spot verification of tricky days (travel week, race day, peak long run, hill repeats)

## Phase 2 — Core UI ✅
- [x] App shell: bottom nav (mobile) / top nav (desktop), phase color system
- [x] Today view: run card (miles/pace/HR/structure/fueling), lift card, check-offs,
      race countdown, prev/next day arrows
- [x] Plan view: Week / Month / Full toggle (choice persisted)
- [x] Travel / Fueling / Paces reference pages under /guide
- [x] Progress view: stats tiles, streak, weekly planned-vs-done chart, plan timeline
- [x] Verified in headless Chrome at ~500px and 900px; Jun 10 shows BB-3 Wed 5 mi easy

## Phase 3 — Backend & sync ✅
- [x] `supabase/schema.sql` applied to project vmtuexysrearwtutssvq
- [x] API routes: /api/pin, /api/log, /api/override, /api/settings, /api/state
- [x] Local JSON file fallback (.data/) when Supabase env vars are unset
- [x] PIN gate via src/proxy.ts (Next 16 middleware) + /pin page — tested: redirect,
      401 on API, wrong PIN rejected, cookie flow works
- [x] Synced store with optimistic updates + localStorage cache
- [x] Supabase env vars in .env.local; live round-trip tested (write, read-back, upsert,
      delete, settings) on 2026-06-10

## Phase 4 — Editing & adjustments ✅
- [x] Day editor bottom-sheet: edit run, skip, swap within week, revert
- [x] Travel scenario pickers (Italy Wk 4, Wedding Wk 10) wired to week targets
- [x] "Adjusted" badge on overridden days

## Phase 5 — Deploy & polish
- [x] PWA manifest + icons
- [x] Deployed to production 2026-06-11: https://marathon-tracker-phi-five.vercel.app
      (project ishaan-chandra-s-projects/marathon-tracker; env vars APP_PIN,
      SUPABASE_URL, SUPABASE_SERVICE_KEY set; PIN gate + Supabase sync smoke-tested live)
- [ ] **User: install Vercel GitHub app so `git push` auto-deploys** —
      vercel.com/dashboard → marathon-tracker → Settings → Git → Connect GitHub repo
- [ ] Add-to-Home-Screen tested on real iPhone
- [ ] Mobile polish pass after real-device testing

## Phase 6 — Wrap-up
- [x] README
- [x] Claude memory entry (project state + resume instructions)
- [ ] Push to GitHub (blocked on gh auth)

---

## Post-launch updates

- [x] 2026-06-11 — Public-read / PIN-to-write auth model + in-page PIN modal
- [x] 2026-06-11 — "Empire" theme (NYC Marathon blue/orange) + light/dark toggle
- [x] 2026-06-12 — Share polish: OG card, share button, "Ishaan Chandra" branding
- [x] 2026-06-12 — Today upgrades: tappable week strip, tomorrow preview, swipe nav
- [x] 2026-06-12 — Offline write queue (durable check-offs for the Italy trip)
- [x] 2026-06-12 — Live webcal calendar feed (runs 7–8 AM, lifts 8–9 AM ET)
- [x] 2026-06-21 — Lift plan → 3-day split (Mon Chest/Tri · Wed Back/Bi · Sun Legs) via
      converter remap; optional per-day stretch/recover add-on with its own check-off
- [ ] User to run the `addon_done` column migration in Supabase (in `supabase/schema.sql`)
- [x] 2026-06-21 — Garmin auto-sync via Strava: OAuth connect, webhook, auto check-off +
      fill distance/pace (mapping → OAuth → webhook → docs). See `docs/GARMIN_SYNC.md`.
- [ ] User to do one-time Strava setup (see `docs/GARMIN_SYNC.md`): create Strava app,
      set `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET` in Vercel, enable Garmin→Strava,
      then Progress → Connect Strava → Enable auto-sync
- [x] 2026-06-23 — Stated race goal reworded 3:45 → **sub-4:00** across user-facing chrome
      (manifest, meta description, OG card, share text, race-day calendar event). Paces and
      the generated plan/reference data keep 8:35/mi as the race *pacing* target (buffer for
      bathroom / family stops) — not a plan change.
- [x] 2026-06-23 — **Mobile run notifications** via Web Push (installed PWA). Owner-only
      (PIN-gated subscribe; subscriptions redacted from public `/api/state`); fires from the
      Strava webhook on a synced run: motivational title + "X mi @ pace ✅", taps to Today.
      New: `public/sw.js`, `src/lib/push.ts`, `/api/push/{subscribe,test}`, `PushCard`.
- [ ] User to add Vercel env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
      `VAPID_SUBJECT` (values in `.env.local`), then on phone: Progress → Enable
      notifications → Send test
- [ ] User to verify on phone: swipe, share sheet, airplane-mode queue, calendar subscribe
- [ ] Deferred (re-evaluate late July): weekly recap share card, training journal,
      race-day pacing card (build during taper), milestone celebrations

## Session log

- **2026-06-10** — Project created. Plan approved (Vercel + Supabase sync, full editing,
  PIN gate). Scaffolded Next.js 16, wrote docs. Converted xlsx → JSON with full mileage
  validation. Built the complete app (all views, editor, scenario pickers, PIN gate,
  sync API with local fallback). Production build passes; smoke-tested pages, log API
  round-trip, and PIN flow. Remaining: user account steps (GitHub auth → push, Supabase
  project, Vercel import) and real-device testing.
