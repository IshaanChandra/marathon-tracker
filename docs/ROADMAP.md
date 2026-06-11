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

## Phase 5 — Deploy & polish (**user: connect Vercel**)
- [x] PWA manifest + icons
- [ ] **User: import repo in Vercel, set env vars (APP_PIN, SUPABASE_URL, SUPABASE_SERVICE_KEY)**
- [ ] Add-to-Home-Screen tested on real iPhone
- [ ] Mobile polish pass after real-device testing

## Phase 6 — Wrap-up
- [x] README
- [x] Claude memory entry (project state + resume instructions)
- [ ] Push to GitHub (blocked on gh auth)

---

## Session log

- **2026-06-10** — Project created. Plan approved (Vercel + Supabase sync, full editing,
  PIN gate). Scaffolded Next.js 16, wrote docs. Converted xlsx → JSON with full mileage
  validation. Built the complete app (all views, editor, scenario pickers, PIN gate,
  sync API with local fallback). Production build passes; smoke-tested pages, log API
  round-trip, and PIN flow. Remaining: user account steps (GitHub auth → push, Supabase
  project, Vercel import) and real-device testing.
