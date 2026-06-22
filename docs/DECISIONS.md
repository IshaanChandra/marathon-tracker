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
