import type { Run } from "./types";

/**
 * Derives a Before / During / Sodium / Water fueling plan from a run.
 *
 * Everything is driven by **time on feet**, computed from the run's distance and a
 * pace estimate. Pace comes from the logged actual pace when available (so a logged
 * run recomputes against what you really ran), otherwise a per-type default.
 *
 * Gel guidance for long runs and races uses an interval model (Model 1): first gel
 * at ~0:40 (race ~0:30), then one every ~35 min (race ~30). Gels that land in the
 * final ~25 min are shown as "by feel" rather than required — no point fuelling
 * right before you stop. Training long runs sit at the gut-friendly ~40 g/hr end
 * (~1 gel / 35 min); race spacing tightens toward the 60-90 g/hr target.
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

const clock = (m: number) => `${Math.floor(m / 60)}:${String(Math.round(m) % 60).padStart(2, "0")}`;

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
    ? "Big carb breakfast 2–3 hr before (~150g). 1 gel 15 min pre."
    : "~30g carb 30–60 min before (banana / toast+honey). Don't run fasted.";

  // Model 1 gel schedule — only for the runs that actually call for gels (long + race).
  const isGelRun = isRace || run.type === "long";
  const first = isRace ? 30 : 40;
  const interval = isRace ? 30 : 35;
  const noGelTail = 10; // don't fuel inside the last 10 min
  const recTail = isRace ? 15 : 25; // a gel in the last recTail min is "by feel", not required

  let during: string | null;
  let planCue: string | null = null;

  if (isGelRun) {
    const pts: number[] = [];
    for (let t = first; t <= durationMin - noGelTail; t += interval) pts.push(t);
    // One "stretch" gel just past the end, if you're within ~12 min of reaching it.
    const next = (pts.length ? pts[pts.length - 1] : first) + interval;
    if (next > durationMin - noGelTail && next <= durationMin + 12) pts.push(next);

    const rec = pts.filter((t) => t <= durationMin - recTail);
    const opt = pts.filter((t) => t > durationMin - recTail);
    const recList = rec.map(clock).join(", ");
    const optList = opt.map(clock).join(", ");

    if (recList) {
      during = `${rec.length} gel${rec.length > 1 ? "s" : ""}: ${recList}`;
      if (optList) during += ` (+${optList} by feel)`;
    } else {
      // Edge: a short long run where every gel falls in the by-feel window.
      during = `1 gel by feel: ${optList}`;
    }
    // The plan's progressive week cue still matters (gut training, salt, oz/hr) — keep it visible.
    planCue = run.fueling ?? null;
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
    planCue,
    sodium,
    hydration,
  };
}
