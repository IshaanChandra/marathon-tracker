"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { plan, getWeek, weekDates, weekForDate, allDates, RUN_TYPE_LABELS } from "@/lib/plan";
import { effectiveDay, weekTotals, weekTarget } from "@/lib/merge";
import { formatShort, monthKey, monthLabel, todayNY } from "@/lib/dates";
import { phaseStyle, RUN_TYPE_CHIP } from "@/lib/ui";
import { useStore } from "@/lib/store";
import type { EffectiveDay, Week } from "@/lib/types";

type ViewMode = "week" | "month" | "full";
const VIEW_KEY = "mt_plan_view";

function DayPill({ day, isToday }: { day: EffectiveDay; isToday: boolean }) {
  const done = day.log?.runDone || (!day.run && day.log?.liftDone);
  return (
    <Link
      href={`/?d=${day.date}`}
      className={`block rounded-xl border p-2.5 transition-colors hover:bg-soft/60 ${
        isToday ? "border-primary/60 ring-1 ring-primary/40" : "border-edge/60"
      } ${day.skipped ? "opacity-50" : ""} bg-card`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground/50">
          {day.dow.slice(0, 3)} {formatShort(day.date)}
        </span>
        <span className="flex items-center gap-1">
          {day.adjusted && <span className="text-violet-500 dark:text-violet-300 text-[10px] font-bold">adj</span>}
          {done && <span className="text-success font-bold">✓</span>}
        </span>
      </div>
      <div className={`mt-1 text-sm font-medium ${day.skipped ? "line-through" : ""}`}>
        {day.run ? (
          <>
            <span className="font-bold">{day.run.miles} mi</span>{" "}
            <span
              className={`inline-block rounded px-1.5 py-px text-[11px] font-semibold align-[1px] ${
                RUN_TYPE_CHIP[day.run.type]
              }`}
            >
              {RUN_TYPE_LABELS[day.run.type]}
            </span>
          </>
        ) : day.lift ? (
          <span className="text-foreground/70">Lift · {day.lift.focus}</span>
        ) : (
          <span className="text-foreground/45">Rest</span>
        )}
        {day.run && day.lift && (
          <span className="text-foreground/55 text-xs"> + {day.lift.focus}</span>
        )}
      </div>
    </Link>
  );
}

function WeekBlock({ week, defaultOpen }: { week: Week; defaultOpen: boolean }) {
  const { state } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const style = phaseStyle(week.phase);
  const totals = weekTotals(week, state);
  const target = weekTarget(week, state, plan.scenarios);
  const today = todayNY();
  const pct = target.miles ? Math.min(100, (totals.done / target.miles) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${style.chip}`}>
            Wk {week.id}
          </span>
          <span className="text-sm font-medium text-foreground/70 truncate">
            {formatShort(week.weekOf)} · {week.phase}
            {week.isCutback ? " · cutback" : ""}
            {week.note ? ` · ${week.note}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-sm">
          <span className="font-semibold text-foreground/70">
            {totals.done > 0 ? `${totals.done} / ` : ""}
            {target.text}
          </span>
          <span className="text-foreground/30">{open ? "▾" : "▸"}</span>
        </div>
      </button>
      {totals.done > 0 && (
        <div className="h-1 bg-soft">
          <div className={`h-full ${style.dot}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {open && (
        <div className="p-3 grid gap-1.5 sm:grid-cols-2 bg-soft/40">
          {weekDates(week).map((d) => {
            const day = effectiveDay(d, state);
            return day ? <DayPill key={d} day={day} isToday={d === today} /> : null;
          })}
        </div>
      )}
    </div>
  );
}

function MonthView() {
  const { state } = useStore();
  const today = todayNY();
  const months = [...new Set(allDates.map(monthKey))];

  return (
    <div className="space-y-6">
      {months.map((m) => {
        const dates = allDates.filter((d) => monthKey(d) === m);
        // pad so the grid starts on Monday
        const first = dates[0];
        const firstDay = effectiveDay(first, state);
        const padding = firstDay ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(firstDay.dow) : 0;
        return (
          <div key={m}>
            <h3 className="font-semibold text-sm text-foreground/60 mb-2">{monthLabel(m)}</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-foreground/40 mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: padding }).map((_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {dates.map((d) => {
                const day = effectiveDay(d, state)!;
                const week = weekForDate(d);
                const style = phaseStyle(week?.phase ?? "");
                const done = day.log?.runDone || (!day.run && day.log?.liftDone);
                return (
                  <Link
                    key={d}
                    href={`/?d=${d}`}
                    className={`rounded-lg border p-1 min-h-14 flex flex-col items-center justify-between bg-card text-center ${
                      d === today ? "border-primary/70 ring-1 ring-primary/50" : "border-edge/60"
                    } ${day.skipped ? "opacity-40" : ""}`}
                  >
                    <span className="text-[10px] text-foreground/45 font-medium">
                      {Number(d.slice(8))}
                    </span>
                    <span className={`text-xs font-bold ${done ? "text-success" : ""}`}>
                      {day.run ? (done ? "✓" : day.run.miles) : day.lift ? "L" : "·"}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlanView() {
  const [mode, setMode] = useState<ViewMode>("week");
  const today = todayNY();
  const currentWeek = weekForDate(today) ?? plan.weeks[0];

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as ViewMode | null;
    if (saved === "week" || saved === "month" || saved === "full") setMode(saved);
  }, []);

  const pick = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(VIEW_KEY, m);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">Plan</h1>
        <div className="flex rounded-full bg-soft p-0.5 text-sm font-medium">
          {(["week", "month", "full"] as const).map((m) => (
            <button
              key={m}
              onClick={() => pick(m)}
              className={`px-3.5 py-1.5 rounded-full capitalize transition-colors ${
                mode === m ? "bg-card shadow-sm font-semibold" : "text-foreground/50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "week" && (
        <div className="space-y-3">
          {plan.weeks
            .filter((w) => w.id === currentWeek.id || w.weekOf >= currentWeek.weekOf)
            .slice(0, 4)
            .map((w, i) => (
              <WeekBlock key={w.id} week={w} defaultOpen={i === 0} />
            ))}
        </div>
      )}

      {mode === "month" && <MonthView />}

      {mode === "full" && (
        <div className="space-y-3">
          {plan.weeks.map((w) => (
            <WeekBlock key={w.id} week={w} defaultOpen={w.id === currentWeek.id} />
          ))}
        </div>
      )}
    </div>
  );
}
