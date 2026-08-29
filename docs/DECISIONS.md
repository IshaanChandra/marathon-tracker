# Decision Log

Append-only. Newest at the bottom. Format: date — decision — why.

- **2026-06-10 — Next.js on Vercel + Supabase, not a static site.** User confirmed
  progress must sync between phone and laptop, which requires shared storage. Vercel +
  Supabase free tiers cover a single-user app indefinitely at $0.

- **2026-06-10 — Plan data is static JSON in git; adjustments are an override layer in
  Supabase.** Keeps the original plan immutable/versioned, makes every adjustment
  revertible, and lets agents reason about plan content without DB access.

- **2026-06-10 — PIN gate instead of real auth.** Single user; magic-link/OAuth is
  friction with no benefit. httpOnly cookie set once per device after PIN entry; PIN in
  `APP_PIN` env var.

- **2026-06-10 — Converter keeps verbatim cell text in `raw`.** The xlsx cells are
  free-text; parsing heuristics may miss nuance. `raw` guarantees no information loss and
  lets the UI fall back to original text.

- **2026-06-10 — Dates as YYYY-MM-DD strings, America/New_York semantics.** Avoids the
  classic UTC-parsing off-by-one (a 10pm check-off must land on the right day).

- **2026-06-11 — "Empire" color theme + light/dark toggle.** Ishaan wanted more color
  than the original monochrome and a dark mode. Researched NYC Marathon branding
  (NYC-flag blue + orange) and dark-mode practice (soft navy, not pure black; desaturated
  accents); he picked Empire over Sunrise/Central Park/Volt options, with a simple
  2-state toggle (no system/auto). Implementation: semantic CSS vars in globals.css
  (`--card/--edge/--soft/--primary/--accent/--success`) mapped via `@theme inline` to
  utilities (`bg-card`, `border-edge`, `text-primary`…); `[data-theme=dark]` swaps the
  palette; `@custom-variant dark` powers `dark:` chip variants; pre-paint inline script
  in layout.tsx prevents theme flash (`?theme=` param overrides for debugging).

- **2026-06-12 — Light-mode color pass: type-tinted cards + gradient hero.** Ishaan found
  light mode grey/flat. Chose (A) workout cards tinted by run type — color as information,
  every day looks like its workout — and (C) a blue→orange gradient hero merging date nav,
  week summary, and countdown. Rejected for now: blue chrome nav, background gradients.
  Tab title shortened to "Ishaan's NYC 26.2".

- **2026-06-12 — Feature batch from product research (sharing, Today UX, offline queue,
  calendar feed, name).** Chosen via a pros/cons review against real usage (one-tap
  check-off user); rejected push notifications (flaky iOS PWA delivery; calendar feed
  covers it), Strava import (2026 API terms + manual entry is rare anyway), and friend
  comments (moderation burden; public read suffices). Key mechanics: write queue in
  localStorage with last-write-wins collapse (matches server upserts); calendar token
  salted differently from the auth cookie so the feed URL can never authorize writes;
  OG card shows the race date instead of a countdown so it never goes stale.

- **2026-06-11 — Auth switched from gate-everything to public-read / PIN-to-write.**
  Ishaan wants to share the site read-only (friends/family can follow training); only
  edits need the PIN, prompted in-page at the moment of the first write. This also fixed
  a bug where the store fetched /api/state while still on the PIN page, got a 401, and
  showed a stale "couldn't reach server" banner after unlock.

- **2026-06-21 — Lift plan moved to a 3-day split + optional stretch/recover add-on.**
  Ishaan switched from the original 4-day split (Mon Legs / Tue Chest-Tri / Thu Back-Bi /
  Fri Shoulders-Arms) to **Mon Chest/Tri · Wed Back/Bi · Sun Legs**, with Shoulders/Arms
  folded into the push/pull days. Runs are unchanged (3 weekday + Sat long). Implemented
  as a `remap_lifts()` transform in the converter (relocate by focus, drop Shoulders/Arms),
  not by re-authoring the xlsx — the xlsx lives outside the repo, so a tracked transform is
  reproducible and the committed `plan.json` regenerates byte-for-byte. The old fixed
  Friday "Shoulders/Arms + stretch" stretch role became a new **optional per-day add-on**
  (`addon: {label, notes}` with its own `addon_done` check-off) so stretch/mobility can be
  tacked onto any day by time/feel — chosen over a fixed weekly stretch day or
  reference-only guidance because the athlete wanted to add sessions ad hoc. Extra lifts
  beyond the programmed 3 are still added manually via the existing day editor.

- **2026-06-21 — Fueling made adaptive to time-on-feet (Model 1, interval-based).** The
  old derivation assumed a 10:15/mi long-run pace (overcounted gels) and let a minimal
  week cue ("Practice: sip water") replace the gel guidance entirely. Now `fuelingFor()`
  drives everything off time on feet: long-run default pace dropped to 9:30, and it uses
  the **logged actual** distance/pace when present (a logged run recomputes against what
  was really run — flagged "· actual" in the panel). Gel schedule = first at ~0:40 (race
  ~0:30), then every ~35 min (race ~30); gels in the final ~25 min show as "by feel," not
  required. Verified against the athlete's own numbers (11 mi → 2 gels + 1 by feel; 20 mi
  → 4 + 1; race → 6 + 1). Grounded in standard guidance (30–60 g/hr training, 60–90 race;
  first gel 30–45 min, then every 30–45). Chose the interval model over a carbs/hr dial
  because it maps to the athlete's mental model ("a gel every 30–40 min") and reads as a
  short, scannable line. The plan's week cue stays visible as a separate `planCue`.

- **2026-06-23 — Stated goal is sub-4:00; race pacing stays 8:35/mi (3:45).** Ishaan's
  core race goal is **sub-4 hours**; the 3:45 pace is the on-course target with deliberate
  buffer for bathroom stops / greeting family. So the *narrative goal* shown to viewers was
  reworded 3:45 → sub-4:00 (manifest, meta description, OG card, share text, race-day
  calendar event), while all training paces and the generated `plan.json`/`reference.json`
  (which carry the 8:35/mi math) were left unchanged. Not a plan/pace change — only the
  public goal statement. The plan's `goal` field isn't rendered anywhere, so nothing else
  surfaces "3:45" to a viewer.

- **2026-06-23 — Mobile run notifications via Web Push, owner-only.** Goal: a phone
  notification when a run auto-syncs. iOS only delivers Web Push to an *installed* PWA
  (16.4+), which Ishaan has — so this is the one viable path (no native app). Built a
  minimal `public/sw.js` (push + notificationclick only; no offline caching — the write
  queue stays localStorage-based) plus `src/lib/push.ts` (VAPID via the `web-push` lib).
  **Mobile-only falls out for free**: push subscriptions are per-device, and `PushCard`
  only offers the toggle in standalone display-mode, so enabling on the phone never touches
  the laptop. **Only-Ishaan security** mirrors the Strava token model: subscribing is
  PIN-gated (`/api/push/subscribe` in the proxy matcher) and the stored subscriptions live
  in the secret `push.subscriptions` setting, redacted from the public `/api/state` — a
  viewer can neither register a device nor read the endpoints. Delivery hooks the existing
  Strava webhook `after()`: on `result.applied`, `sendPush(runNotification(...))`. Wording
  (chosen by Ishaan): one compact line `"🏃 {miles} mi · {pace}/mi ✅"` as the title with an
  empty body, actual-only (no planned-vs-actual), tap → Today. iOS adds its own app-name
  header line, so a single-line title is the most compact result possible (a longer
  motivational title was dropped for being too tall). Stale subs (404/410) self-prune. Env:
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public, inlined), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
  Rejected earlier (2026-06-12) when iOS PWA push was deemed flaky; revisited now that the
  app is installed and the Strava sync gives a concrete, low-frequency trigger.

- **2026-06-21 — Garmin auto-sync built on the Strava bridge, not Garmin directly.** Goal:
  a finished run auto-checks-off its day and fills distance/pace. There's no direct watch
  API; of the four pipes (Strava, Apple Health+Shortcut, official Garmin API, unofficial
  Garmin login) we chose **Strava** — Garmin already auto-syncs runs there, and Strava's
  API is official, free, push-based (webhook), and approves instantly, with no password
  storage. Rejected: the official Garmin Activity API (partner approval is 1–4 weeks and
  may be denied for a personal app); unofficial Garmin login (ToS violation, stores
  credentials, brittle); Apple Health (HealthKit is device-only, needs a native iOS app or
  a paid bridge). Backend is source-agnostic (`activityToLogPatch`/`applyActivity`), so the
  pipe can change later. Confirmed behavior: auto-apply immediately (revertible); Strava
  overwrites distance/pace but never notes/lift/addon; only runs. Security: OAuth tokens in
  the `strava.tokens` setting are redacted from the public `/api/state` (the site is
  public-read); the unsigned webhook is guarded by a salted `?t=` secret + `owner_id` +
  our-token-only fetches; the 2-second ack rule is met by doing the fetch+apply in Next
  `after()`. Built and shipped in 4 phases (mapping core → OAuth → webhook → docs).


- **2026-08-29 — Fueling model: distance-based gels (1 × 24 g every 2.5 mi), race-consistent.**
  The old time-based gel schedule read as under-fueling and disagreed with how Ishaan
  actually fuels. New model, applied identically to long runs and the race: one 24 g gel
  every 2.5 mi (first at mile 2.5, none in the final quarter-mile), which at long-run pace
  (~9:30/mi) lands ~60 g/hr and a bit more at race pace (~8:35/mi). The panel now also
  surfaces the **total carb goal** for the run (gels × 24 g) and the resulting g/hr as a
  separate `Carbs` row, so the target is explicit rather than implied. Before-run guidance:
  ~50 g carb 60–90 min prior for long runs (moderate top-up, not a full race breakfast),
  vs. the race's ~120 g breakfast + a pre-gel. The plan's own week cue (`run.fueling`, e.g.
  gut-training notes) is kept as a separate `planCue` row alongside — never in place of —
  the derived schedule. Rationale (chosen by Ishaan via prompt): consistency between long
  runs and race day so race fueling is rehearsed, and a moderate ~50 g pre-run target.
  Implemented in `src/lib/fueling.ts` (GEL_CARBS/GEL_MI constants, `carbGoal` field),
  surfaced by `FuelingPanel` (Carbs row) and `RaceCard` (Gels/Carbs rows).


- **2026-08-29 — Fueling model is now the single source of truth (drop the per-week cue).**
  Follow-up to the fueling overhaul: the plan's per-week `run.fueling` gel counts (gut-training
  ramp, authored in the xlsx) contradicted the distance-based model on the same card (e.g. plan
  cue "5 gels" vs the model's 7). Chosen: go all-in on the model — for gel runs (long + race)
  the raw per-week cue is no longer surfaced, so gels/carbs/sodium show one consistent number
  everywhere. The guide's race-day line was corrected as a documented manual correction (the
  xlsx source still carries the old wording). Rejected keeping a separate progressive-ramp
  display — the user wants 60 g/hr as the standing target, rehearsed on every long run.

- **2026-08-29 — Fitness-check (race predictor) uses Riegel off the sharpest recent run.**
  Projects a marathon time from logged runs so the sub-4:00 goal is grounded in real data.
  Riegel (T₂=T₁·(D₂/D₁)^1.06) applied to each logged run ≥3 mi in the last 6 weeks; the
  *fastest* projection is the headline (tracks current fitness, not an average of easy days).
  Easy-day noise is limited by the ≥3 mi floor + taking the best effort. Framed as a
  training-run estimate (a tune-up race would sharpen it), with 5K/10K/Half equivalents from
  the same effort. Rejected VDOT tables (heavier, needs a race result) for the parameter-free
  Riegel, which is good enough for a personal on-track/behind read.
