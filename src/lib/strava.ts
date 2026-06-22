import "server-only";
import type { DayLog } from "./types";
import { getDayLog, setLog } from "./db";
import { nyDateFromInstant } from "./dates";

/**
 * Strava → plan-day sync. This module is source-shaped but deliberately thin: a
 * Strava activity is mapped to a {date, miles, pace} patch and applied to the day's
 * log. Garmin/Strava is authoritative for distance/pace (they overwrite), but the
 * run's notes / lift / stretch check-offs are never touched.
 *
 * Phase 1 (here) is the pure mapping + apply core — testable via /api/strava/test
 * with no Strava wiring. OAuth, tokens, and the webhook live alongside in later phases.
 */

/** The activity-detail fields we use (Strava sends many more; the rest are ignored). */
export interface StravaActivity {
  id: number;
  type?: string; // legacy field, e.g. "Run"
  sport_type?: string; // newer, e.g. "Run" | "TrailRun" | "VirtualRun"
  distance: number; // meters
  moving_time: number; // seconds
  start_date: string; // UTC ISO timestamp
}

const METERS_PER_MILE = 1609.34;

/** Treadmill / trail / virtual runs all carry "run" in their type; rides/walks don't. */
export function isRunActivity(a: StravaActivity): boolean {
  return (a.sport_type || a.type || "").toLowerCase().includes("run");
}

/** Minutes-per-mile (e.g. 9.4) → "9:24"; carries a 60s rounding edge to the next minute. */
function fmtPace(minPerMile: number): string {
  let m = Math.floor(minPerMile);
  let s = Math.round((minPerMile - m) * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface LogPatch {
  date: string;
  miles: number;
  pace: string | null;
}

/** Pure mapping: a run activity → the day + fields it should fill. */
export function activityToLogPatch(a: StravaActivity): LogPatch {
  const date = nyDateFromInstant(a.start_date);
  const miles = Math.round((a.distance / METERS_PER_MILE) * 100) / 100;
  const pace = miles > 0 && a.moving_time > 0 ? fmtPace(a.moving_time / 60 / miles) : null;
  return { date, miles, pace };
}

const EMPTY_LOG: DayLog = {
  runDone: false,
  liftDone: false,
  addonDone: false,
  actualMiles: null,
  actualPace: null,
  notes: null,
};

export interface ApplyResult {
  applied: boolean;
  reason?: string;
  date?: string;
  miles?: number;
  pace?: string | null;
}

/**
 * Check off the matching day's run and fill in distance/pace. Overwrites those run
 * fields (watch is authoritative) while preserving notes/lift/addon. Idempotent —
 * re-applying the same activity yields the same log.
 */
export async function applyActivity(a: StravaActivity): Promise<ApplyResult> {
  if (!isRunActivity(a)) return { applied: false, reason: "not a run" };
  const { date, miles, pace } = activityToLogPatch(a);
  const existing = (await getDayLog(date)) ?? EMPTY_LOG;
  await setLog(date, { ...existing, runDone: true, actualMiles: miles, actualPace: pace });
  return { applied: true, date, miles, pace };
}
