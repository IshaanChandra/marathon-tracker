"use client";

import { useState } from "react";
import RecapCard from "./RecapCard";
import { useStore } from "@/lib/store";
import { todayNY } from "@/lib/dates";
import { currentPeriodIndex, periodRecap, periodsFor, type Period, type PeriodMode } from "@/lib/periods";
import { phaseStyle } from "@/lib/ui";

/** One earlier period, compact: phase dot, label, logged/planned + a thin progress bar.
 *  Tapping it promotes that period into the hero card above. */
function PastPeriodRow({ period, onSelect }: { period: Period; onSelect: () => void }) {
  const { state } = useStore();
  const s = periodRecap(period, state);
  const style = phaseStyle(period.dotPhase);
  const denom = s.planned > 0 ? s.planned : 1;
  return (
    <button onClick={onSelect} className="card p-3 w-full text-left hover:bg-soft transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <span className="font-semibold">{period.label}</span>
        <span className="text-foreground/45 text-xs truncate">{period.phase}</span>
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
    </button>
  );
}

export default function SummaryView() {
  const today = todayNY();
  const [mode, setMode] = useState<PeriodMode>("week");
  const [idx, setIdx] = useState(() => currentPeriodIndex("week", today));

  const periods = periodsFor(mode);
  const current = currentPeriodIndex(mode, today);
  const selected = periods[Math.min(idx, periods.length - 1)];
  // Stepping forward stops at the period containing today — a future one is always 0%.
  const canNext = idx < current;
  const earlier = periods.slice(0, idx).reverse(); // before the selected one, newest first

  const changeMode = (m: PeriodMode) => {
    setMode(m);
    setIdx(currentPeriodIndex(m, today)); // land on the equivalent current period
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold tracking-tight">Summary</h1>

      <RecapCard
        period={selected}
        mode={mode}
        onModeChange={changeMode}
        onStep={(d) => setIdx((i) => Math.max(0, Math.min(current, i + d)))}
        canPrev={idx > 0}
        canNext={canNext}
      />

      {earlier.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground/60">
            Earlier {mode === "week" ? "weeks" : "months"}
          </h2>
          {earlier.map((p) => (
            <PastPeriodRow key={p.key} period={p} onSelect={() => setIdx(periods.indexOf(p))} />
          ))}
        </div>
      )}
    </div>
  );
}
