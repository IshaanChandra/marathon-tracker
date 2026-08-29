"use client";

import { useState } from "react";
import { plan } from "@/lib/plan";
import { effectiveWeekDays } from "@/lib/merge";
import { useStore } from "@/lib/store";
import { todayNY, addDays } from "@/lib/dates";
import type { Week } from "@/lib/types";

/**
 * Strava-style weekly-mileage card: a "this week" summary header over a vertical bar
 * per plan week. Faint bar = planned, solid = logged; the current week is highlighted.
 * Tapping a bar drives the header, so it doubles as the per-bar tooltip on mobile.
 *
 * Planned/logged both come from the same override-merged day totals the rest of the app
 * uses (so on-the-fly edits flow through here too). Weekly time is summed from each done
 * run's logged pace × distance — Strava fills that pace in, so it reflects real effort.
 */

interface WeekStat {
  week: Week;
  planned: number;
  logged: number;
  timeMin: number;
  runs: number;
  isCurrent: boolean;
  hasLog: boolean;
}

/** "9:45" | "9:45/mi" → 9.75 min/mi; null if unparseable. */
function parsePace(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(/(\d+):(\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function fmtTime(min: number): string {
  const t = Math.round(min);
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function buildStats(state: ReturnType<typeof useStore>["state"]): WeekStat[] {
  const today = todayNY();
  return plan.weeks.map((week) => {
    let planned = 0;
    let logged = 0;
    let timeMin = 0;
    let runs = 0;
    for (const day of effectiveWeekDays(week, state)) {
      if (day.run && !day.skipped) planned += day.run.miles;
      if (day.run && day.log?.runDone) {
        const mi = day.log.actualMiles ?? day.run.miles;
        logged += mi;
        runs += 1;
        const pace = parsePace(day.log.actualPace) ?? parsePace(day.run.pace);
        if (pace) timeMin += mi * pace;
      }
    }
    return {
      week,
      planned: round1(planned),
      logged: round1(logged),
      timeMin,
      runs,
      isCurrent: today >= week.weekOf && today <= addDays(week.weekOf, 6),
      hasLog: runs > 0,
    };
  });
}

export default function WeeklyTrendCard() {
  const { state } = useStore();
  const stats = buildStats(state);

  const currentIdx = stats.findIndex((s) => s.isCurrent);
  const lastLoggedIdx = stats.map((s) => s.hasLog).lastIndexOf(true);
  const defaultIdx = currentIdx >= 0 ? currentIdx : lastLoggedIdx >= 0 ? lastLoggedIdx : 0;
  const [sel, setSel] = useState(defaultIdx);
  const [hover, setHover] = useState<number | null>(null);
  // Hover previews a week (desktop); the header reverts to the clicked/current week on
  // mouse-out. Tapping a bar still sticks it (mobile, where there's no hover).
  const activeIdx = hover ?? sel;

  const s = stats[activeIdx];
  const maxMiles = Math.max(1, ...stats.map((w) => Math.max(w.planned, w.logged)));
  const top = Math.ceil(maxMiles / 10) * 10 || 10; // round the y-axis up to a clean 10
  // Ticks: 0, then every 10 from 20 up (e.g. 0, 20, 30, 40, 50).
  const yTicks = [0];
  for (let t = 20; t <= top; t += 10) yTicks.push(t);
  const pct = s.planned > 0 ? Math.round((s.logged / s.planned) * 100) : 0;
  const lastIdx = stats.length - 1;

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Weekly mileage</h2>
        <span className="text-[11px] font-medium text-foreground/45 shrink-0">
          {s.isCurrent ? "this week" : `Wk ${s.week.id}`}
        </span>
      </div>

      {/* Summary header for the selected week */}
      <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold tracking-tight tabular-nums">{s.logged}</span>
        <span className="text-sm font-medium text-foreground/50">mi</span>
        {s.timeMin > 0 && (
          <span className="text-xs font-medium text-foreground/45 tabular-nums">
            {fmtTime(s.timeMin)}
          </span>
        )}
        <span className="text-xs font-medium text-foreground/45 tabular-nums">
          {s.runs} {s.runs === 1 ? "run" : "runs"}
        </span>
      </div>
      <div className="text-xs text-foreground/45 mt-0.5">
        Wk {s.week.id} · {s.week.phase} · {s.logged} / {s.planned} mi
        {s.planned > 0 ? ` (${pct}%)` : ""}
      </div>

      {/* Y-axis title */}
      <div className="mt-3 text-[10px] font-medium text-foreground/45">miles</div>

      {/* Plot: y-axis ticks + gridlines + bars */}
      <div className="mt-2 flex gap-1.5">
        <div className="relative w-6 h-28 shrink-0 text-[9px] leading-none text-foreground/40 tabular-nums">
          {yTicks.map((t) => (
            // bottom:% anchors the label's bottom edge to the gridline; translate-y-1/2
            // (down) then recenters it ON the line so every number lines up with its rule.
            <span
              key={t}
              className="absolute right-1 translate-y-1/2"
              style={{ bottom: `${(t / top) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1 h-28">
          {yTicks.map((t) => (
            <span
              key={t}
              className="absolute left-0 right-0 border-t border-edge"
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}
          <div
            className="absolute inset-0 flex items-end gap-[3px]"
            onMouseLeave={() => setHover(null)}
          >
            {stats.map((w, i) => {
              const plannedH = (w.planned / top) * 100;
              const loggedH = (w.logged / top) * 100;
              const selected = i === activeIdx;
              return (
                <button
                  key={w.week.id}
                  onClick={() => setSel(i)}
                  onMouseEnter={() => setHover(i)}
                  className="relative flex-1 h-full min-w-0"
                  aria-label={`Week ${w.week.id}: ${w.logged} of ${w.planned} miles`}
                >
                  {/* planned (faint) */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 rounded-t-sm ${
                      w.isCurrent ? "bg-accent/25" : "bg-primary/20"
                    } ${selected ? "ring-1 ring-inset ring-foreground/25" : ""}`}
                    style={{ height: `${plannedH}%` }}
                  />
                  {/* logged (solid) */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 rounded-t-sm ${
                      w.isCurrent ? "bg-accent" : "bg-primary"
                    }`}
                    style={{ height: `${loggedH}%` }}
                  />
                  {w.isCurrent && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels (endpoints + current + every ~4th week, never crowding current) */}
      <div className="flex gap-1.5 mt-1.5">
        <div className="w-6 shrink-0" />
        <div className="flex-1 flex gap-[3px]">
          {stats.map((w, i) => {
            const n = Number(w.week.id);
            const nearCurrent = currentIdx >= 0 && Math.abs(i - currentIdx) <= 1;
            const show =
              i === 0 ||
              i === lastIdx ||
              w.isCurrent ||
              (Number.isFinite(n) && n % 4 === 0 && !nearCurrent);
            const label = i === 0 ? "BB1" : w.week.id;
            return (
              <span
                key={w.week.id}
                className="flex-1 min-w-0 text-center text-[9px] leading-none text-foreground/40 tabular-nums"
              >
                {show ? label : ""}
              </span>
            );
          })}
        </div>
      </div>

      {/* X-axis title */}
      <div className="flex gap-1.5 mt-1">
        <div className="w-6 shrink-0" />
        <div className="flex-1 text-center text-[10px] font-medium text-foreground/45">week</div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-[11px] text-foreground/45">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-primary inline-block" /> logged
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-primary/20 inline-block" /> planned
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-accent inline-block" /> this week
        </span>
      </div>
    </div>
  );
}
