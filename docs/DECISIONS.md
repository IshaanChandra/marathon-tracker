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
