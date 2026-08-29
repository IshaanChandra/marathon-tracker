"use client";

import WeeklyRecapCard from "./WeeklyRecapCard";
import { plan } from "@/lib/plan";
import { weekRecap } from "@/lib/weekStats";
import { useStore } from "@/lib/store";
import { todayNY, addDays } from "@/lib/dates";
import { phaseStyle } from "@/lib/ui";
import type { Week } from "@/lib/types";

/** One past week, compact: phase dot, week/phase, logged/planned + a thin progress bar. */
function PastWeekRow({ week }: { week: Week }) {
  const { state } = useStore();
  const s = weekRecap(week, state);
  const style = phaseStyle(week.phase);
  const denom = s.planned > 0 ? s.planned : 1;
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <span className="font-semibold">Wk {week.id}</span>
        <span className="text-foreground/45 text-xs truncate">{week.phase}</span>
        <span className="ml-auto shrink-0 tabular-nums text-foreground/70">
          {s.logged > 0 ? `${s.logged} / ` : ""}
          {s.planned} mi
          {s.planned > 0 ? <span className="text-foreground/40"> · {s.pct}%</span> : null}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-soft overflow-hidden">
          <div
            className={`h-full ${style.dot}`}
            style={{ width: `${Math.min(100, (s.logged / denom) * 100)}%` }}
          />
        </div>
        <span className="text-[11px] text-foreground/45 tabular-nums shrink-0">
          {s.runs} run{s.runs === 1 ? "" : "s"} · longest {s.longest}
        </span>
      </div>
    </div>
  );
}

export default function SummaryView() {
  const today = todayNY();

  const currentIdx = plan.weeks.findIndex(
    (w) => today >= w.weekOf && today <= addDays(w.weekOf, 6),
  );
  // Before the plan starts → first week; after it ends → last week.
  const idx = currentIdx >= 0 ? currentIdx : today < plan.weeks[0].weekOf ? 0 : plan.weeks.length - 1;
  const currentWeek = plan.weeks[idx];
  const complete = today > addDays(currentWeek.weekOf, 6);
  const pastWeeks = plan.weeks.slice(0, idx).reverse(); // earlier weeks, newest first

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Summary</h1>

      <WeeklyRecapCard week={currentWeek} complete={complete} />

      {pastWeeks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground/60">Earlier weeks</h2>
          {pastWeeks.map((w) => (
            <PastWeekRow key={w.id} week={w} />
          ))}
        </div>
      )}
    </div>
  );
}
