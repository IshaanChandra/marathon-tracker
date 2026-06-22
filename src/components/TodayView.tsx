"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import DayCard from "./DayCard";
import DayEditor from "./DayEditor";
import { plan, getWeek, clampToPlan, firstDate, lastDate, RUN_TYPE_LABELS } from "@/lib/plan";
import { effectiveDay, effectiveWeekDays, weekTotals, weekTarget } from "@/lib/merge";
import { addDays, daysBetween, formatLong, todayNY } from "@/lib/dates";
import { phaseStyle } from "@/lib/ui";
import { useStore } from "@/lib/store";
import type { AppState, Week } from "@/lib/types";

/** 7 tappable mini-days: done ✓, today ringed, rest hollow. */
function WeekStrip({
  week,
  state,
  date,
  today,
  onPick,
}: {
  week: Week;
  state: AppState;
  date: string;
  today: string;
  onPick: (d: string) => void;
}) {
  const style = phaseStyle(week.phase);
  return (
    <div className="grid grid-cols-7 gap-1">
      {effectiveWeekDays(week, state).map((d) => {
        const done =
          d.log?.runDone ||
          (!d.run && d.log?.liftDone) ||
          (!d.run && !d.lift && !!d.addon && d.log?.addonDone);
        const isViewed = d.date === date;
        const isToday = d.date === today;
        return (
          <button
            key={d.date}
            onClick={() => onPick(d.date)}
            className={`rounded-lg py-1.5 flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
              isViewed ? "bg-primary/10" : "hover:bg-soft"
            } ${isToday ? "ring-1 ring-primary/50" : ""} ${d.skipped ? "opacity-40" : ""}`}
            aria-label={`${d.dow} ${d.date}`}
          >
            <span className="text-foreground/45">{d.dow[0]}</span>
            <span
              className={`grid place-items-center w-5 h-5 rounded-full text-[10px] font-bold ${
                done
                  ? "bg-success text-success-contrast"
                  : d.run
                    ? `${style.dot} text-white dark:text-black/70`
                    : d.lift
                      ? "bg-stone-300 dark:bg-stone-500/50 text-foreground/70"
                      : "border border-edge text-foreground/35"
              }`}
            >
              {done ? "✓" : d.run ? d.run.miles : d.lift ? "L" : "·"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Night-before prep: a one-line look at tomorrow, shown only on today. */
function UpNext({ state, today, onPick }: { state: AppState; today: string; onPick: (d: string) => void }) {
  const tomorrow = addDays(today, 1);
  const day = effectiveDay(tomorrow, state);
  if (!day || day.skipped) return null;
  const summary = day.run
    ? `${day.run.miles} mi ${RUN_TYPE_LABELS[day.run.type] ?? day.run.type}${
        day.lift ? ` + ${day.lift.focus}` : ""
      }`
    : day.lift
      ? `Lift · ${day.lift.focus}`
      : "Rest day";
  return (
    <button
      onClick={() => onPick(tomorrow)}
      className="card w-full px-4 py-3 flex items-center justify-between gap-3 text-sm text-left hover:bg-soft/40 transition-colors"
    >
      <span className="min-w-0 truncate">
        <span className="font-semibold text-foreground/45 mr-2">Tomorrow</span>
        <span className="font-medium">{summary}</span>
        {day.run?.fueling && (
          <span className="text-foreground/50"> · {day.run.fueling}</span>
        )}
      </span>
      <span className="text-foreground/30 shrink-0">›</span>
    </button>
  );
}

export default function TodayView() {
  const { state, syncError, pendingCount } = useStore();
  const params = useSearchParams();
  const today = todayNY();
  const [date, setDate] = useState(() => clampToPlan(params.get("d") ?? today));
  const [editing, setEditing] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const day = effectiveDay(date, state);
  const week = day ? getWeek(day.weekId) : null;
  const totals = week ? weekTotals(week, state) : null;
  const target = week ? weekTarget(week, state, plan.scenarios) : null;
  const daysToRace = daysBetween(today, plan.meta.raceDate);

  const step = (n: number) => setDate((d) => clampToPlan(addDays(d, n)));

  // Swipe between days; the 2:1 horizontal threshold leaves vertical scroll alone
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || editing) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    }
  };

  return (
    <div className="space-y-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Hero: date nav + week summary + countdown on the Empire gradient */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-orange-600 dark:from-blue-950 dark:via-blue-900 dark:to-orange-900 text-white shadow-md px-4 pt-4 pb-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => step(-1)}
            disabled={date <= firstDate}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center disabled:opacity-30 transition-colors"
            aria-label="Previous day"
          >
            ‹
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight">
              {date === today ? "Today" : formatLong(date)}
            </h1>
            {date === today ? (
              <div className="text-xs text-white/70">{formatLong(date)}</div>
            ) : (
              <button
                onClick={() => setDate(clampToPlan(today))}
                className="text-xs font-semibold text-white/90 underline underline-offset-2"
              >
                Back to today
              </button>
            )}
          </div>
          <button
            onClick={() => step(1)}
            disabled={date >= lastDate}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center disabled:opacity-30 transition-colors"
            aria-label="Next day"
          >
            ›
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 min-w-0">
            {week && (
              <span className="rounded-full bg-white/15 px-2.5 py-1 whitespace-nowrap">
                Wk {week.id} · {week.phase}
              </span>
            )}
            {week?.isCutback && (
              <span className="rounded-full bg-white/15 px-2 py-1">Cutback</span>
            )}
            {week?.travel && (
              <span className="rounded-full bg-white/15 px-2 py-1">
                {week.travel === "italy" ? "Italy" : "Wedding"}
              </span>
            )}
            <span className="text-white/75 font-medium whitespace-nowrap pl-0.5">
              {totals?.done ?? 0} / {target?.text ?? ""}
            </span>
          </div>
          <span className="whitespace-nowrap">
            {daysToRace > 0
              ? `${daysToRace} days to NYC 🗽`
              : daysToRace === 0
                ? "RACE DAY 🗽"
                : "Done!"}
          </span>
        </div>
      </div>

      {/* Tappable week strip */}
      {week && (
        <div className="card px-3 py-2">
          <WeekStrip week={week} state={state} date={date} today={today} onPick={setDate} />
        </div>
      )}

      {pendingCount > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-200">
          ● {pendingCount} change{pendingCount > 1 ? "s" : ""} waiting to sync — saved here,
          retrying automatically.
        </div>
      )}
      {syncError && (
        <div className="rounded-xl bg-soft px-3.5 py-2 text-xs text-foreground/55">
          Offline — showing the last data this device saw.
        </div>
      )}

      {day ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {day.adjusted && (
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/25 dark:text-violet-200">
                  Adjusted
                </span>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-primary rounded-full px-3 py-1 hover:bg-soft"
            >
              Edit day
            </button>
          </div>
          <DayCard day={day} />
          {date === today && <UpNext state={state} today={today} onPick={setDate} />}
          {editing && <DayEditor day={day} onClose={() => setEditing(false)} />}
        </>
      ) : (
        <div className="card p-5 text-foreground/60">No plan entry for this date.</div>
      )}
    </div>
  );
}
