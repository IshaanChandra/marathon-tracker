# Roadmap & Progress

> Living tracker. Update checkboxes + the session log at the end of every work session.

## Phase 0 — Scaffold & GitHub
- [x] Scaffold Next.js 16 (TS, Tailwind v4, App Router, src dir)
- [x] AGENTS.md / CLAUDE.md project guide
- [x] docs/: ARCHITECTURE, DATA_MODEL, ROADMAP, DECISIONS
- [ ] git init + initial commit
- [ ] Install gh CLI, **user runs `gh auth login`**
- [ ] Create private GitHub repo `marathon-tracker`, push

## Phase 1 — Data conversion (xlsx → JSON)
- [ ] `scripts/convert_xlsx.py` parsing all 5 sheets
- [ ] `src/data/plan.json` with every date May 25 → Nov 1 mapped
- [ ] `src/data/reference.json` (travel / fueling / paces)
- [ ] Mileage validation: per-week sum of parsed run miles == "Run Miles" column
- [ ] Manual verification pass of all weeks vs xlsx; notes in DATA_MODEL.md

## Phase 2 — Core UI (read-only, localStorage)
- [ ] App shell: bottom nav (mobile) / top nav (desktop), phase color system
- [ ] Today view: run card (miles/pace/HR/structure/fueling), lift card, check-offs,
      race countdown, prev/next day arrows
- [ ] Plan view: Week / Month / Full toggle
- [ ] Travel / Fueling / Paces reference pages
- [ ] Progress view: % complete, streak, weekly planned-vs-actual chart
- [ ] Verified on 390px and desktop; today's date shows correct workout

## Phase 3 — Backend & sync (**user: create Supabase project**)
- [ ] `supabase/schema.sql` applied
- [ ] API routes: /api/pin, /api/log, /api/override, /api/settings, /api/state
- [ ] PIN middleware + /pin page
- [ ] Synced store with optimistic updates + localStorage cache

## Phase 4 — Editing & adjustments
- [ ] Day editor bottom-sheet: edit run/lift, skip, swap within week, revert
- [ ] Travel scenario pickers (Italy Wk 4, Wedding Wk 10) wired to week targets
- [ ] "Adjusted" badge on overridden days

## Phase 5 — Deploy & polish (**user: connect Vercel**)
- [ ] Vercel project + env vars (APP_PIN, SUPABASE_URL, SUPABASE_SERVICE_KEY)
- [ ] PWA manifest + icons; Add-to-Home-Screen tested on iPhone
- [ ] Mobile polish pass

## Phase 6 — Wrap-up
- [ ] README with screenshots
- [ ] Claude memory entry (project state + resume instructions)
- [ ] Final docs pass + push

---

## Session log

- **2026-06-10** — Project created. Plan approved (Vercel + Supabase sync, full editing,
  PIN gate). Scaffolded Next.js 16, wrote docs structure. Started Phase 0/1.
