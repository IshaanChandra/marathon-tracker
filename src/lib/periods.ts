import type { AppState, Week } from "./types";
import { plan, allDates, getWeek, weekDates } from "./plan";
import { formatShort, monthKey, monthLabel } from "./dates";
import { rangeRecap, weekRecap, type WeekRecap } from "./weekStats";

/**
 * The Summary tab recaps a *period* — either a plan week or a calendar month clipped to the
 * plan's range. This module is the one place that decides what periods exist, how they're
 * labelled, and which days fall in each, so the hero card and the history list can never
 * disagree. Months are calendar months, so a month's mileage is NOT the sum of whole weeks
 * (weeks straddle month boundaries) — that's intended.
 */

export type PeriodMode = "week" | "month";

export interface Period {
  mode: PeriodMode;
  /** week id ("14", "BB-2") or month key ("2026-09") */
  key: string;
  /** "Wk 14" | "September" */
  label: string;
  /** "Sep 7 – Sep 13" | "Sep 1 – Sep 30" */
  range: string;
  /** week phase, or a month's phase span ("Hills → Intervals") */
  phase: string;
  /** the concrete phase to take dot/bar color from */
  dotPhase: string;
  dates: string[];
  start: string;
  end: string;
}

function rangeText(dates: string[]): string {
  return `${formatShort(dates[0])} – ${formatShort(dates[dates.length - 1])}`;
}

function weekPeriod(week: Week): Period {
  const dates = weekDates(week);
  return {
    mode: "week",
    key: week.id,
    label: `Wk ${week.id}`,
    range: rangeText(dates),
    phase: week.phase,
    dotPhase: week.phase,
    dates,
    start: dates[0],
    end: dates[dates.length - 1],
  };
}

/** Distinct phases a month touches, in plan order — "Hills → Intervals" (ends only if >2). */
function phaseSpan(dates: string[]): { phase: string; dotPhase: string } {
  const phases: string[] = [];
  for (const d of dates) {
    const w = getWeek(plan.days[d]?.weekId ?? "");
    if (w && phases[phases.length - 1] !== w.phase) phases.push(w.phase);
  }
  const dotPhase = phases[phases.length - 1] ?? "Base Building";
  if (phases.length <= 1) return { phase: dotPhase, dotPhase };
  const shown = phases.length > 2 ? [phases[0], dotPhase] : phases;
  return { phase: shown.join(" → "), dotPhase };
}

function monthPeriod(key: string): Period {
  const dates = allDates.filter((d) => monthKey(d) === key);
  return {
    mode: "month",
    key,
    label: monthLabel(key).replace(/ \d{4}$/, ""),
    range: rangeText(dates),
    ...phaseSpan(dates),
    dates,
    start: dates[0],
    end: dates[dates.length - 1],
  };
}

const WEEK_PERIODS: Period[] = plan.weeks.map(weekPeriod);
const MONTH_PERIODS: Period[] = [...new Set(allDates.map(monthKey))].map(monthPeriod);

/** All periods of a mode, chronological. */
export function periodsFor(mode: PeriodMode): Period[] {
  return mode === "week" ? WEEK_PERIODS : MONTH_PERIODS;
}

/** The period containing today, clamped into the plan's range at either end. */
export function currentPeriodIndex(mode: PeriodMode, today: string): number {
  const periods = periodsFor(mode);
  const i = periods.findIndex((p) => today >= p.start && today <= p.end);
  if (i >= 0) return i;
  return today < periods[0].start ? 0 : periods.length - 1;
}

export function periodRecap(period: Period, state: AppState): WeekRecap {
  if (period.mode === "week") {
    const week = getWeek(period.key);
    if (week) return weekRecap(week, state);
  }
  return rangeRecap(period.dates, state);
}
