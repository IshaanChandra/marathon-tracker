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
- [x] Deployed to production 2026-06-11; renamed 2026-06-21 →
      https://ishaans-nyc-marathon.vercel.app (project ishaan-chandra-s-projects/
      marathon-tracker; env vars APP_PIN, SUPABASE_URL, SUPABASE_SERVICE_KEY,
      STRAVA_*, VAPID_* set; PIN gate + Supabase sync smoke-tested live)
- [x] Vercel GitHub app connected — `git push` auto-deploys
- [x] Add-to-Home-Screen done on real iPhone (app installed; used for run notifications)
- [ ] Mobile polish pass after real-device testing

## Phase 6 — Wrap-up
- [x] README
- [x] Claude memory entry (project state + resume instructions)
- [x] Pushed to GitHub: github.com/IshaanChandra/marathon-tracker

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
- [x] 2026-06-21 — `addon_done` column migration applied in Supabase
- [x] 2026-06-21 — Garmin auto-sync via Strava: OAuth connect, webhook, auto check-off +
      fill distance/pace (mapping → OAuth → webhook → docs). See `docs/GARMIN_SYNC.md`.
- [x] 2026-06-21 — One-time Strava setup done; auto-sync confirmed live on phone
- [x] 2026-06-23 — Stated race goal reworded 3:45 → **sub-4:00** across user-facing chrome
      (manifest, meta description, OG card, share text, race-day calendar event). Paces and
      the generated plan/reference data keep 8:35/mi as the race *pacing* target (buffer for
      bathroom / family stops) — not a plan change.
- [x] 2026-06-23 — **Mobile run notifications** via Web Push (installed PWA). Owner-only
      (PIN-gated subscribe; subscriptions redacted from public `/api/state`); fires from the
      Strava webhook on a synced run: one compact line "🏃 X mi · pace ✅", taps to Today.
      New: `public/sw.js`, `src/lib/push.ts`, `/api/push/{subscribe,test}`, `PushCard`.
- [ ] User to add Vercel env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
      `VAPID_SUBJECT` (values in `.env.local`), redeploy, then on phone: Progress → Enable
      notifications → Send test
- [ ] User to verify on phone: swipe, share sheet, airplane-mode queue, calendar subscribe
- [x] 2026-08-28 — Today-hero fixes: removed the travel pill (one-line, no mobile overlap);
      week fraction now sums the actual runs shown (edit-adaptive, not the `targetMiles` preset)
      and reads actual-logged miles over summed-planned to tenths (e.g. `16.5 / 34`). Same
      summed denominator applied to the Progress weekly bars.
- [x] 2026-08-28 — Race-day pacing card on Progress: 8:35/mi splits (5K→marathon), target
      finish + cushion under the sub-4:00 goal, and gel/water schedule (reuses `fuelingFor`).
      Plus small polish: Progress legend swatches match the phase-tinted bars, weekly bar width
      capped at 100%, and the now-unused `WeekTotals.done` field removed.
- [x] 2026-08-28 — Weekly-mileage trend card on Progress (Strava-style): a "this week"
      summary (distance · time · runs, time derived from logged pace) over a vertical bar per
      plan week — faint = planned, solid = logged, current week in orange. Hover (or tap on
      mobile) previews any week's stats in the header; y-axis ticks 0/20/30/40/50 aligned to
      gridlines, labeled x-axis. Sits above the Race day card. New: `WeeklyTrendCard`.
- [x] 2026-08-29 — Fueling overhaul: distance-based gels (1 × 24 g every 2.5 mi, first at
      mile 2.5, none in the last quarter-mile) replacing the old under-fueling time-based
      schedule. Long runs + race use the same model (race-rehearsed); a new `Carbs` row shows
      the total carb goal (gels × 24 g) and g/hr. Before-run: ~50 g for long runs, ~120 g
      breakfast + pre-gel for the race. See `docs/DECISIONS.md` (2026-08-29).
- [x] 2026-08-29 — Fitness-check card on Progress: Riegel projection of marathon finish
      from your sharpest logged run in the last 6 weeks (≥3 mi), vs the sub-4:00 goal + 8:35
      plan pace, with 5K/10K/Half equivalents. New: `RacePredictorCard`.
- [x] 2026-08-29 — Sweep bug-fixes: (1) fueling now single-source — the stale per-week gel
      cue is no longer shown on gel runs (was contradicting the model, e.g. "5 gels" vs 7);
      guide race-day line corrected (see DATA_MODEL manual-corrections). (2) Day editor
      Pace/HR field routes to pace vs HR and clears the other (no stale HR row / broken
      fueling pace parse). (3) Strava sync sums multiple same-day runs idempotently (by
      activity id) instead of the later one clobbering the earlier; runs logged on a no-plan
      day are now counted (week + Progress totals) and shown as an "Extra run" card. (4)
      Progress weekly bars no longer clamp the done bar at planned, so over-runs are visible.
- [x] 2026-08-29 — Weekly recap (was deferred): Empire-gradient summary card (logged/planned
      mi + %, runs, longest, time on feet) wired to the native share sheet / copy-link. Lives
      on its own **Summary** tab (current-week hero + "Earlier weeks" history) — not Today or
      Progress, to avoid clutter. Plus a **Sunday-night push** of the same stats via a Vercel
      weekly cron (`vercel.json`, Mon 01:00 UTC = Sun 9 PM EDT) → `/api/push/weekly`
      (CRON_SECRET-guarded), deep-linking to Summary.
      Shared pure `weekRecap()` in `src/lib/weekStats.ts` powers both card + push so numbers
      match. Testable on-device via a new "Test weekly recap" button on `PushCard`. New:
      `WeeklyRecapCard`, `weekStats.ts`, `/api/push/weekly`.
- [x] 2026-09-01 — Summary tab: **week ⇄ month recap**. The recap card gained a `W | M`
      segmented toggle plus `‹ ›` stepping through periods (this week / last week / … and
      this month / last month / …), stopping at the period containing today; the history
      list below mirrors the mode ("Earlier weeks" / "Earlier months") and its rows are
      tappable to promote a period into the hero card. Months are calendar months clipped to
      the plan range, labelled with the phases they span ("Hills → Intervals"). New:
      `src/lib/periods.ts` (`Period`, `periodsFor`, `currentPeriodIndex`, `periodRecap`);
      `weekStats.ts` grew `recapDays()` / `rangeRecap()` with `weekRecap()` unchanged so the
      Sunday push still matches; `WeeklyRecapCard` → `RecapCard`.
- [x] 2026-10-25 — **Race Day Spectator Guide** (`/guide/race-day`, Guide tab "Race Day")
      for parents/friends on race day: header + estimate warning, how to spot me, a
      screenshot-sized "stops at a glance" list, 3 stop cards + 1 optional (ETA, auto
      "be in place by" = ETA − 15 min, side of street, subway, Google Maps link, photo slots,
      next-stop directions), after-the-finish, spectator rules, full mile-by-mile ETAs with
      stops slotted in. All content in hand-edited `src/data/spectator.ts`; open items are the
      `TBD` sentinel (shown as a dashed chip). Guide header now wraps on narrow screens.
- [x] 2026-10-25 — Spectator guide: warning block reworked into **How to track me** (New
      York Road Runners app, search event + runner name, two cropped app screenshots in
      `public/spectator/`); shortened estimate note; dropped the "live dot" line from the
      at-a-glance footer.
- [x] 2026-10-25 — Spectator guide pass 2: one course map per stop (`stop1/2/3-map.jpg`,
      heights capped so portrait shots don't dominate) replacing the 11 photo slots; meeting
      spot Central Park West & W 75th St (+ Maps link); new after-finish text; optional
      Bedford stop and the Rules for spectators section removed. **Race Day is now the first
      Guide tab and the nav's Guide link opens it** (`/guide/travel` still works).
- [x] 2026-10-27 — Spectator guide pass 3: **How to spot me** is now a flat lay of the outfit
      (hat → tee → shorts → shoes) from transparent WebP product cutouts on a white panel,
      labels on the left, tee hem layered over the shorts (~42 KB total). The real outfit
      photo (`outfit.jpg`, mirror selfie flipped) is kept but hidden (`outfit.showPhoto`).
      Meetup map image added to the Meeting spot box.
- [x] 2026-10-27 — Spectator guide `UPDATED` → Oct 27; README feature entry added; source
      images (originals) moved out of the repo folder to the macOS Trash.
- [x] 2026-10-28 — Spectator guide: meetup moved to **Columbus Ave & W 75th St** (spectators
      can't reach Central Park West), exit note + Maps link updated, new meetup screenshot.
- [x] 2026-10-28 — Spectator guide restyle from a friend's mock-up: animated cartoon-runner
      hero + race-bib card; collapsible sections with Expand/Collapse all; Where to cheer rows
      (closed = at-a-glance summary, each fact once) + meetup row with map; cartoon runner
      pinned on every stop map and the meetup map; After the finish merged into the meetup
      row; App Store button on How to track me; stop 1 renamed "Lafayette Ave at Ashland Pl";
      stop 3 side "(runners' left)"; Guide header hidden on this page (tabs at the foot);
      contrast, 44px tap targets, lazy-loaded images. Overview of her code: Claude Doc
      "Friend's Marathon Guide — Code Review & Revamp Overview".
- [x] 2026-10-28 — Spectator guide polish: "Updated …" date removed from the hero; Where to
      cheer stops (+ meetup) are separate cards with a left stripe in each stop's color; all
      four start collapsed so the section opens as the compact summary.
- [ ] If anything changes before race day: edit `src/data/spectator.ts`.
- [ ] User to set `CRON_SECRET` in Vercel + redeploy so the weekly cron registers and the
      `/api/push/weekly` route is authenticated (unset = route open; cron still fires).
- [ ] Deferred: training journal, milestone celebrations (race-day pacing card shipped
      2026-08-28)

## Session log

- **2026-06-10** — Project created. Plan approved (Vercel + Supabase sync, full editing,
  PIN gate). Scaffolded Next.js 16, wrote docs. Converted xlsx → JSON with full mileage
  validation. Built the complete app (all views, editor, scenario pickers, PIN gate,
  sync API with local fallback). Production build passes; smoke-tested pages, log API
  round-trip, and PIN flow. Remaining: user account steps (GitHub auth → push, Supabase
  project, Vercel import) and real-device testing.
- **2026-06-21** — Lift plan → 3-day split + optional add-on; adaptive fueling (Model 1);
  Garmin→Strava auto-sync (OAuth + webhook); site renamed to ishaans-nyc-marathon; logo
  icons + favicon. All shipped and confirmed live (auto-sync on, app on home screen).
- **2026-06-23** — Goal wording 3:45 → sub-4:00 across user-facing chrome (paces unchanged).
  Mobile run notifications via Web Push: owner-only (PIN-gated, redacted subscriptions),
  fires from the Strava webhook, mobile-only by construction. Build green; pushed. Pending:
  user adds VAPID env in Vercel + redeploy, then enables on phone.
- **2026-08-28** — Today-hero fixes (edit-adaptive week fraction), race-day pacing card,
  and the Strava-style weekly-mileage trend card on Progress.
- **2026-08-29** — Fueling overhaul (distance-based gels, single source of truth), Fitness
  check (Riegel), bug sweep (Strava same-day sums, extra-run card, Pace/HR editor routing),
  weekly recap on a new Summary tab + Sunday-night push cron.
- **2026-09-01** — Summary tab: week ⇄ month recap with period stepping (`periods.ts`).
- **2026-10-24** — Docs audit: synced README / ARCHITECTURE / DATA_MODEL / GARMIN_SYNC and
  this roadmap with the shipped code (Summary tab, `strava.applied`, cron time, same-day
  run summing). Found + fixed iCloud-evicted `node_modules` (hung lint; `npm ci`), removed
  `.next 2` conflict copy, cleared 4 trivial lint issues. Build green; 7 pre-existing
  react-hooks lint errors remain (intentional mount-time localStorage reads). Race in 8 days.
- **2026-10-25** — Race Day Spectator Guide tab (`/guide/race-day`), built additively; the
  only changed existing line is the Guide header row (`flex-wrap gap-2`, approved).
- **2026-10-25 → 10-27** — Spectator guide iterated with Ishaan, each pass previewed on a
  local build before pushing: "How to track me" (NYRR app + screenshots), per-stop course
  maps, meetup spot + map, Bedford stop and spectator-rules removed, Race Day made the first
  Guide tab, outfit flat lay from product cutouts. Workflow change: changes are now shown
  locally for approval before commit/push (push auto-deploys to the live site).
- **2026-10-28** — Meetup moved to Columbus Ave & 75th. Reviewed a friend's static mock-up
  (`~/Downloads/ishaan-marathon-guide`) and rebuilt its look into the Race Day page in
  previewed steps (hero + bib → collapsible rows + map pins → de-duplication → review fixes).
  Race in 4 days.
