/**
 * All plan dates are YYYY-MM-DD strings with America/New_York semantics.
 * Never construct `new Date("YYYY-MM-DD")` for display math — that parses as UTC
 * and shifts the day for evening users. These helpers do calendar math safely.
 */

export function todayNY(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Noon-UTC anchor makes day arithmetic immune to DST/UTC shifts. */
function toAnchor(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: string, n: number): string {
  const d = toAnchor(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toAnchor(to).getTime() - toAnchor(from).getTime()) / 86_400_000);
}

export function formatShort(date: string): string {
  return toAnchor(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function formatLong(date: string): string {
  return toAnchor(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatWeekday(date: string): string {
  return toAnchor(date).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short" });
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function monthLabel(key: string): string {
  return toAnchor(`${key}-01`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}
