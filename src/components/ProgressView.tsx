"use client";

import CalendarCard from "./CalendarCard";
import StravaCard from "./StravaCard";
import PushCard from "./PushCard";
import { plan, allDates } from "@/lib/plan";
import { effectiveDay, weekTotals, weekTarget } from "@/lib/merge";
import { addDays, daysBetween, todayNY } from "@/lib/dates";
import { phaseStyle } from "@/lib/ui";
import { useStore } from "@/lib/store";

export default function ProgressView() {
  const { state } = useStore();
  const today = todayNY();

  // Totals across the whole plan
  let plannedToDate = 0;
  let totalPlanned = 0;
  let milesDone = 0;
  let runsDone = 0;
  let runsPlannedToDate = 0;
  for (const d of allDates) {
    const day = effectiveDay(d, state);
    if (!day?.run || day.skipped) continue;
    totalPlanned += day.run.miles;
    if (d <= today) {
      plannedToDate += day.run.miles;
      runsPlannedToDate += 1;
    }
    if (day.log?.runDone) {
      milesDone += day.log.actualMiles ?? day.run.miles;
      runsDone += 1;
    }
  }

  // Current streak: consecutive days ending today where every run-day was done
  let streak = 0;
  for (let d = today; d >= allDates[0]; d = addDays(d, -1)) {
    const day = effectiveDay(d, state);
    if (!day) break;
    if (day.run && !day.skipped) {
      if (day.log?.runDone) streak += 1;
      else if (d === today) continue; // today isn't over yet
      else break;
    }
  }

  const daysToRace = daysBetween(today, plan.meta.raceDate);
  const pctTime = Math.min(
    100,
    Math.max(0, (daysBetween(plan.meta.startDate, today) / daysBetween(plan.meta.startDate, plan.meta.raceDate)) * 100),
  );

  const maxWeekMiles = Math.max(...plan.weeks.map((w) => w.targetMiles ?? 0));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Progress</h1>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card p-4">
          <div className="text-3xl font-bold tracking-tight">{Math.round(milesDone)}</div>
          <div className="text-xs font-medium text-foreground/45 mt-0.5">
            miles done · {Math.round(totalPlanned)} planned total
          </div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-bold tracking-tight">{daysToRace}</div>
          <div className="text-xs font-medium text-foreground/45 mt-0.5">days to race day</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-bold tracking-tight">
            {runsDone}
            <span className="text-lg text-foreground/40">/{runsPlannedToDate}</span>
          </div>
          <div className="text-xs font-medium text-foreground/45 mt-0.5">runs completed to date</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-bold tracking-tight">{streak}</div>
          <div className="text-xs font-medium text-foreground/45 mt-0.5">run-day streak</div>
        </div>
      </div>

      {/* Plan timeline */}
      <div className="card p-4">
        <div className="flex justify-between text-xs font-medium text-foreground/45 mb-2">
          <span>May 25</span>
          <span>{Math.round(pctTime)}% through the plan</span>
          <span>Nov 1</span>
        </div>
        <div className="h-2 rounded-full bg-soft overflow-hidden">
          <div className="h-full bg-success" style={{ width: `${pctTime}%` }} />
        </div>
      </div>

      {/* Weekly mileage: planned vs done */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold mb-3">Weekly mileage — planned vs done</h2>
        <div className="space-y-1.5">
          {plan.weeks.map((w) => {
            const totals = weekTotals(w, state);
            const target = weekTarget(w, state, plan.scenarios);
            const planned = target.miles ?? totals.planned;
            const style = phaseStyle(w.phase);
            const isCurrent = today >= w.weekOf && today <= addDays(w.weekOf, 6);
            return (
              <div key={w.id} className="flex items-center gap-2 text-xs">
                <span
                  className={`w-10 shrink-0 font-semibold ${
                    isCurrent ? "text-foreground" : "text-foreground/45"
                  }`}
                >
                  {w.id}
                </span>
                <div className="flex-1 h-4 rounded bg-soft relative overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded opacity-30 ${style.dot}`}
                    style={{ width: `${(planned / maxWeekMiles) * 100}%` }}
                  />
                  <div
                    className={`absolute inset-y-0 left-0 rounded ${style.dot}`}
                    style={{ width: `${(Math.min(totals.logged, planned) / maxWeekMiles) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-medium text-foreground/55 tabular-nums">
                  {totals.logged > 0 ? `${totals.logged} / ` : ""}
                  {planned}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-foreground/45">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-sky-400 inline-block" /> done
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-sky-400/30 inline-block" /> planned
          </span>
        </div>
      </div>

      <StravaCard />
      <PushCard />
      <CalendarCard />
    </div>
  );
}
