"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import DayCard from "./DayCard";
import DayEditor from "./DayEditor";
import { plan, getWeek, clampToPlan, firstDate, lastDate } from "@/lib/plan";
import { effectiveDay, weekTotals, weekTarget } from "@/lib/merge";
import { addDays, daysBetween, formatLong, todayNY } from "@/lib/dates";
import { phaseStyle } from "@/lib/ui";
import { useStore } from "@/lib/store";

export default function TodayView() {
  const { state, syncError } = useStore();
  const params = useSearchParams();
  const today = todayNY();
  const [date, setDate] = useState(() => clampToPlan(params.get("d") ?? today));
  const [editing, setEditing] = useState(false);

  const day = effectiveDay(date, state);
  const week = day ? getWeek(day.weekId) : null;
  const style = phaseStyle(week?.phase ?? "");
  const totals = week ? weekTotals(week, state) : null;
  const target = week ? weekTarget(week, state, plan.scenarios) : null;
  const daysToRace = daysBetween(today, plan.meta.raceDate);

  return (
    <div className="space-y-4">
      {/* Header: date nav + countdown */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDate(addDays(date, -1))}
          disabled={date <= firstDate}
          className="w-9 h-9 rounded-full bg-white border border-black/10 grid place-items-center text-foreground/60 disabled:opacity-30"
          aria-label="Previous day"
        >
          ‹
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-tight">
            {date === today ? "Today" : formatLong(date)}
          </h1>
          {date === today ? (
            <div className="text-xs text-foreground/50">{formatLong(date)}</div>
          ) : (
            <button onClick={() => setDate(clampToPlan(today))} className="text-xs font-medium text-sky-700">
              Back to today
            </button>
          )}
        </div>
        <button
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= lastDate}
          className="w-9 h-9 rounded-full bg-white border border-black/10 grid place-items-center text-foreground/60 disabled:opacity-30"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      {/* Week context strip */}
      {week && (
        <div className="card px-4 py-3 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.chip}`}>
              Week {week.id} · {week.phase}
            </span>
            {week.isCutback && (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700">
                Cutback
              </span>
            )}
            {week.travel && (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700">
                {week.travel === "italy" ? "Italy" : "Wedding"}
              </span>
            )}
          </div>
          <div className="text-foreground/55 font-medium whitespace-nowrap">
            {totals?.done ?? 0} / {target?.text ?? ""}
          </div>
        </div>
      )}

      {/* Race countdown */}
      <div className="card px-4 py-3 flex items-center justify-between text-sm bg-gradient-to-r from-emerald-50 to-white">
        <span className="font-medium text-foreground/70">
          {plan.meta.race} · {plan.meta.goal}
        </span>
        <span className="font-bold text-emerald-700">
          {daysToRace > 0 ? `${daysToRace} days to go` : daysToRace === 0 ? "RACE DAY 🗽" : "Done!"}
        </span>
      </div>

      {syncError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs text-rose-700">
          Couldn&apos;t reach the server — changes are saved on this device and will need a refresh
          once you&apos;re back online.
        </div>
      )}

      {day ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {day.adjusted && (
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-100 text-violet-700">
                  Adjusted
                </span>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-foreground/60 hover:text-foreground rounded-full px-3 py-1 hover:bg-black/5"
            >
              Edit day
            </button>
          </div>
          <DayCard day={day} />
          {editing && <DayEditor day={day} onClose={() => setEditing(false)} />}
        </>
      ) : (
        <div className="card p-5 text-foreground/60">No plan entry for this date.</div>
      )}
    </div>
  );
}
