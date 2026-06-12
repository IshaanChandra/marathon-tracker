import type { Run } from "./types";

/**
 * Derives a Before / During / Hydration fueling plan from a run, using the
 * Nutrition & Fueling targets (~70g carb/hr, 400-500mg sodium/hr, 16-24oz/hr for
 * runs > 90 min; short runs just hydrate to thirst). When the plan prescribes a
 * specific per-week cue (run.fueling — gut-training aware), that is used verbatim
 * as the During line; otherwise it's derived from the hourly targets.
 */

// Rough avg pace by run type (min/mi) — easy days are HR-capped ~10:15, MP 8:35.
const PACE_MIN_PER_MI: Record<string, number> = {
  easy: 10.25,
  long: 10.25,
  shakeout: 10.5,
  strides: 10.25,
  mp: 8.6,
  tempo: 8.0,
  threshold: 8.0,
  vo2: 9.0,
  hills: 9.5,
  race: 8.6,
};

export type FuelLevel = "none" | "light" | "full";

export interface FuelPlan {
  level: FuelLevel;
  durationMin: number;
  durationLabel: string;
  before: string;
  during: string | null;
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

export function fuelingFor(run: Run): FuelPlan {
  const pace = PACE_MIN_PER_MI[run.type] ?? 10.25;
  const durationMin = Math.max(1, Math.round(run.miles * pace));
  const durationLabel = fmtDuration(durationMin);
  const hours = durationMin / 60;
  const isRace = run.type === "race";

  // Short run — no structured fueling, just hydration guidance.
  if (durationMin < 75 && !isRace && !run.fueling) {
    return {
      level: durationMin < 60 ? "none" : "light",
      durationMin,
      durationLabel,
      before:
        durationMin < 60
          ? "Nothing needed — just don't head out on a totally empty stomach."
          : "Optional: a small carb snack (half a banana) if you haven't eaten in a while.",
      during: null,
      sodium: null,
      hydration:
        durationMin < 60
          ? "Optional — sip to thirst. Carry water if it's hot."
          : "Carry a handheld and take a few sips through the run, especially if warm.",
    };
  }

  // Full fueling — long runs (>~90 min), races, or any day with a plan cue.
  const caps = Math.max(1, Math.round(durationMin / 40)); // ~1 SaltStick per 40 min
  const ozLow = Math.round(hours * 16);
  const ozHigh = Math.round(hours * 24);

  // Race day pushes to the ~70g/hr absorption target (a gel every 20-25 min);
  // training long runs sit at the gut-friendlier ~1 gel every 30-35 min.
  const raceGels = Math.max(1, Math.round(durationMin / 22));
  const trainGels = Math.max(1, Math.round(durationMin / 32));

  const before = isRace
    ? "2–3 hr before: a big carb breakfast (~150g — bagel + banana + sports drink). 15 min before: 1 gel + a few sips of water."
    : "30–60 min before: a banana or toast + honey (~30g carb), or a gel if you're short on time. Don't run this one fasted.";

  const during = run.fueling
    ? run.fueling
    : isRace
      ? `~${raceGels} gels — one every 20–25 min (≈70g carb/hr). Start by 30–40 min in, before you feel low.`
      : `~${trainGels} gels — one every 30–35 min. Start by ~45 min. (Race target is 70g/hr; build toward it as your gut adapts.)`;

  const sodium = `1 SaltStick cap every 30–45 min (~${caps} total) — your cramp lever.`;

  const hydration = `${ozLow}–${ozHigh} oz total: sip 4–6 oz every 15–20 min, starting by mile 2–3 (not when you feel thirsty — thirst lags ~30 min).`;

  return {
    level: "full",
    durationMin,
    durationLabel,
    before,
    during,
    sodium,
    hydration,
  };
}
