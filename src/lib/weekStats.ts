import type { AppState, EffectiveDay, Week } from "./types";
import { plan } from "./plan";
import { effectiveDay, effectiveWeekDays } from "./merge";
import { addDays, formatWeekday } from "./dates";

/**
 * Pure recap stats, shared by the on-screen recap card and the Sunday-night push route so
 * both report identical numbers. Client-safe (no db / server-only imports).
 */

export interface WeekRecap {
  planned: number;
  logged: number;
  runs: number;
  longest: number;
  timeMin: number;
  pct: number;
}

function parsePace(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(/(\d+):(\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
}
const round1 = (n: number) => Math.round(n * 10) / 10;

/** The stat loop itself — works over any set of days (a week, a month, any range). */
export function recapDays(days: EffectiveDay[]): WeekRecap {
  let planned = 0;
  let logged = 0;
  let runs = 0;
  let longest = 0;
  let timeMin = 0;
  for (const day of days) {
    if (day.run && !day.skipped) planned += day.run.miles;
    if (day.log?.runDone) {
      const mi = day.log.actualMiles ?? day.run?.miles ?? 0;
      logged += mi;
      runs += 1;
      if (mi > longest) longest = mi;
      const pace = parsePace(day.log.actualPace) ?? parsePace(day.run?.pace);
      if (pace) timeMin += mi * pace;
    }
  }
  const p = round1(planned);
  const l = round1(logged);
  return { planned: p, logged: l, runs, longest: round1(longest), timeMin, pct: p > 0 ? Math.round((l / p) * 100) : 0 };
}

export function weekRecap(week: Week, state: AppState): WeekRecap {
  return recapDays(effectiveWeekDays(week, state));
}

/** Recap over an arbitrary list of plan dates (used by calendar-month periods). */
export function rangeRecap(dates: string[], state: AppState): WeekRecap {
  return recapDays(
    dates.map((d) => effectiveDay(d, state)).filter((d): d is EffectiveDay => d !== null),
  );
}

function weekContaining(date: string): Week | null {
  return plan.weeks.find((w) => date >= w.weekOf && date <= addDays(w.weekOf, 6)) ?? null;
}

/**
 * The week to recap for a given day, and whether it's fully wrapped:
 * - Sat / Sun → the current week (Sun = complete, the last day)
 * - Mon → the week that just ended (yesterday's week), complete
 * - Tue–Fri → null (no recap surfaced mid-week)
 */
export function recapWeek(today: string): { week: Week; complete: boolean } | null {
  const wd = formatWeekday(today);
  if (wd === "Sat" || wd === "Sun") {
    const w = weekContaining(today);
    return w ? { week: w, complete: wd === "Sun" } : null;
  }
  if (wd === "Mon") {
    const w = weekContaining(addDays(today, -1));
    return w ? { week: w, complete: true } : null;
  }
  return null;
}
