import type { Run } from "./types";

/**
 * Derives a Before / During / Sodium / Water fueling plan from a run.
 *
 * Everything is driven by **time on feet**, computed from the run's distance and a
 * pace estimate. Pace comes from the logged actual pace when available (so a logged
 * run recomputes against what you really ran), otherwise a per-type default.
 *
 * Gel guidance for long runs and races is distance-based: one 24 g gel every 2.5 mi,
 * which at long-run pace (~9:30/mi) works out to ~60 g/hr, a bit more at race pace
 * (~8:35/mi). First gel at mile 2.5, none in the final quarter-mile. The panel also
 * surfaces the total carb goal for the run (gels × 24 g) and the resulting g/hr.
 *
 * The plan's own week-specific cue (run.fueling — e.g. "Practice: sip water", gut
 * training) is surfaced as a separate `planCue`, alongside — never in place of —
 * the derived gel schedule.
 */

// Default avg pace by run type (min/mi). Long runs ~9:30; easy days HR-capped ~10:15;
// MP / race ~8:35. Used only when no logged actual pace is available.
const PACE_MIN_PER_MI: Record<string, number> = {
  easy: 10.25,
  long: 9.5,
  shakeout: 10.5,
  strides: 10.25,
  mp: 8.6,
  tempo: 8.0,
  threshold: 8.0,
  vo2: 9.0,
  hills: 9.5,
  race: 8.583, // MP 8:35
};

// Fueling model: one gel every GEL_MI miles, GEL_CARBS grams each (~60 g/hr at easy pace).
const GEL_CARBS = 24;
const GEL_MI = 2.5;

export type FuelLevel = "none" | "light" | "full";

/** The bits of a day's log that make the plan adaptive to what was actually run. */
export interface FuelActuals {
  actualMiles?: number | null;
  actualPace?: string | null; // "9:45" (min/mi)
}

export interface FuelPlan {
  level: FuelLevel;
  durationMin: number;
  durationLabel: string;
  /** True when time-on-feet was computed from a logged actual (distance or pace). */
  fromActuals: boolean;
  before: string;
  during: string | null;
  /** Total carb goal for gel runs, e.g. "120 g on the run · ~60 g/hr"; null otherwise. */
  carbGoal: string | null;
  /** The plan's week-specific fueling cue (e.g. "Practice: sip water"), shown
   *  alongside — never in place of — the derived gel guidance. */
  planCue: string | null;
  sodium: string | null;
  hydration: string;
}

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h}h ${m}m`;
}

/** "9:45" or "9:45/mi" -> 9.75 (min/mi); null if unparseable. */
function parsePace(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(/(\d+):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

export function fuelingFor(run: Run, actuals?: FuelActuals | null): FuelPlan {
  const loggedMiles = actuals?.actualMiles && actuals.actualMiles > 0 ? actuals.actualMiles : null;
  const loggedPace = parsePace(actuals?.actualPace);
  const fromActuals = loggedMiles !== null || loggedPace !== null;

  const miles = loggedMiles ?? run.miles;
  const pace = loggedPace ?? PACE_MIN_PER_MI[run.type] ?? 10.25;
  const durationMin = Math.max(1, Math.round(miles * pace));
  const durationLabel = fmtDuration(durationMin);
  const hours = durationMin / 60;
  const isRace = run.type === "race";

  // Short run — no structured fueling, just hydration guidance.
  if (durationMin < 75 && !isRace && !run.fueling) {
    return {
      level: durationMin < 60 ? "none" : "light",
      durationMin,
      durationLabel,
      fromActuals,
      before:
        durationMin < 60
          ? "Nothing needed — don't head out totally empty."
          : "Optional: a small carb snack if you haven't eaten in a while.",
      during: null,
      carbGoal: null,
      planCue: null,
      sodium: null,
      hydration:
        durationMin < 60
          ? "Sip to thirst. Carry water if it's hot."
          : "Carry a handheld; sip through the run, especially if warm.",
    };
  }

  // Full fueling — long runs, races, or any day with a plan cue.
  const caps = Math.max(1, Math.round(durationMin / 40)); // ~1 SaltStick per 40 min
  const ozLow = Math.round(hours * 16);
  const ozHigh = Math.round(hours * 24);

  const before = isRace
    ? "~120 g breakfast 2.5–3 hr before + 1 gel (24 g) ~15 min pre."
    : "~50 g carb 60–90 min before — banana + toast w/ honey, or a bagel.";

  // Distance-based gels: one 24 g gel every 2.5 mi. First gel at mile 2.5, none in the
  // final quarter-mile. Long runs + race only. ~60 g/hr at long-run pace, more at race pace.
  const isGelRun = isRace || run.type === "long";
  let during: string | null;
  let carbGoal: string | null = null;
  let planCue: string | null = null;

  if (isGelRun) {
    const count = Math.max(0, Math.floor((miles - 0.25) / GEL_MI));
    if (count > 0) {
      const grams = count * GEL_CARBS;
      const perHour = Math.round((GEL_CARBS / (GEL_MI * pace)) * 60);
      during = `1 gel (${GEL_CARBS} g) every ${GEL_MI} mi → ${count} gel${count > 1 ? "s" : ""}`;
      carbGoal = `${grams} g on the run · ~${perHour} g/hr`;
    } else {
      during = "Too short for gels — sip a sports drink if you want a few carbs.";
    }
    // The distance-based model is now the single source of truth for gels/carbs, so the
    // plan's old per-week gel-count cue (run.fueling) is deliberately NOT surfaced here —
    // it would contradict the schedule above (e.g. "5 gels" vs the model's 7). One number
    // everywhere. planCue stays null for gel runs.
  } else {
    // Long easy / workout efforts that aren't gel runs: defer to the plan cue, or a light default.
    during = run.fueling ?? "Optional past ~90 min: a gel or sports drink. Otherwise just hydrate.";
  }

  const sodium =
    isGelRun || durationMin >= 90 ? `1 SaltStick / 30–45 min (~${caps} total)` : null;

  const hydration = `${ozLow}–${ozHigh} oz total · 4–6 oz every 15–20 min`;

  return {
    level: "full",
    durationMin,
    durationLabel,
    fromActuals,
    before,
    during,
    carbGoal,
    planCue,
    sodium,
    hydration,
  };
}
