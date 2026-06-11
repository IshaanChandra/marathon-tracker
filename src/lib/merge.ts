import type { AppState, EffectiveDay, PlanDay, Week } from "./types";
import { getDay, getWeek, weekDates } from "./plan";

/**
 * The core merge: planned day ⊕ override, annotated with log state.
 * The plan is never mutated — overrides are a removable layer.
 */
export function effectiveDay(date: string, state: AppState): EffectiveDay | null {
  const base = getDay(date);
  if (!base) return null;
  const override = state.overrides[date];
  const merged: PlanDay = override
    ? {
        ...base,
        run: override.run !== undefined ? override.run : base.run,
        lift: override.lift !== undefined ? override.lift : base.lift,
        rest: override.rest !== undefined ? override.rest : base.rest,
      }
    : base;
  return {
    ...merged,
    date,
    adjusted: !!override,
    skipped: !!override?.skipped,
    log: state.logs[date] ?? null,
  };
}

export function effectiveWeekDays(week: Week, state: AppState): EffectiveDay[] {
  return weekDates(week)
    .map((d) => effectiveDay(d, state))
    .filter((d): d is EffectiveDay => d !== null);
}

export interface WeekTotals {
  planned: number;
  done: number;
  logged: number; // actual miles where provided, else planned miles of done runs
}

export function weekTotals(week: Week, state: AppState): WeekTotals {
  let planned = 0;
  let done = 0;
  let logged = 0;
  for (const day of effectiveWeekDays(week, state)) {
    if (day.run && !day.skipped) planned += day.run.miles;
    if (day.run && day.log?.runDone) {
      done += day.run.miles;
      logged += day.log.actualMiles ?? day.run.miles;
    }
  }
  return { planned: round1(planned), done: round1(done), logged: round1(logged) };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Selected travel scenario letter for a trip, if any. */
export function scenarioFor(state: AppState, trip: string): string | null {
  const v = state.settings[`travel.${trip}`] as { scenario?: string } | undefined;
  return v?.scenario ?? null;
}

export function emptyState(): AppState {
  return { logs: {}, overrides: {}, settings: {} };
}

/** Effective weekly mileage target, accounting for a chosen travel scenario. */
export function weekTarget(
  week: Week,
  state: AppState,
  scenarios: Record<string, { weekId: string; options: Record<string, { miles: string | null }> }>,
): { miles: number | null; text: string } {
  if (week.travel) {
    const trip = scenarios[week.travel];
    if (trip && trip.weekId === week.id) {
      const pick = scenarioFor(state, week.travel);
      const opt = pick ? trip.options[pick] : null;
      if (opt?.miles) {
        return { miles: null, text: `${opt.miles} mi (Scenario ${pick})` };
      }
    }
  }
  return {
    miles: week.targetMiles,
    text: week.targetMiles != null ? `${week.targetMiles} mi` : week.targetMilesText,
  };
}
