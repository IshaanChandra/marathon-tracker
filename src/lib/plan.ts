import planJson from "@/data/plan.json";
import referenceJson from "@/data/reference.json";
import type { Plan, PlanDay, RefSection, Week } from "./types";
import { addDays } from "./dates";

export const plan = planJson as unknown as Plan;
export const reference = referenceJson as unknown as Record<string, RefSection[]>;

export const RUN_TYPE_LABELS: Record<string, string> = {
  easy: "Easy",
  long: "Long Run",
  hills: "Hill Repeats",
  threshold: "Threshold",
  vo2: "VO2 Intervals",
  tempo: "Tempo",
  mp: "MP Workout",
  shakeout: "Shakeout",
  strides: "Strides",
  race: "RACE DAY",
};

export const PHASE_ORDER = [
  "Base Building",
  "Base",
  "Hills",
  "Intervals",
  "Tempo/MP",
  "Peak",
  "Taper",
  "Race",
];

export function getDay(date: string): PlanDay | null {
  return plan.days[date] ?? null;
}

export function getWeek(id: string): Week | null {
  return plan.weeks.find((w) => w.id === id) ?? null;
}

export function weekDates(week: Week): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(week.weekOf, i));
}

export function weekForDate(date: string): Week | null {
  const day = plan.days[date];
  return day ? getWeek(day.weekId) : null;
}

export const allDates = Object.keys(plan.days).sort();
export const firstDate = allDates[0];
export const lastDate = allDates[allDates.length - 1];

/** Clamp an arbitrary date into the plan's range. */
export function clampToPlan(date: string): string {
  if (date < firstDate) return firstDate;
  if (date > lastDate) return lastDate;
  return date;
}
