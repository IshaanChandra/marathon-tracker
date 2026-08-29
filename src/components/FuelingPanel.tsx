import type { Run } from "@/lib/types";
import { fuelingFor, type FuelActuals } from "@/lib/fueling";

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="w-14 shrink-0 text-[11px] font-bold uppercase tracking-wide text-amber-700/80 dark:text-amber-300/80 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-amber-950/90 dark:text-amber-50/90">{body}</span>
    </div>
  );
}

/** Before / During / Sodium / Water fueling guidance, derived from the run and,
 *  when logged, the actual distance/pace (so time on feet stays accurate). */
export default function FuelingPanel({ run, actuals }: { run: Run; actuals?: FuelActuals | null }) {
  const fuel = fuelingFor(run, actuals);

  // Short runs: one quiet line, no big amber block.
  if (fuel.level !== "full") {
    return (
      <div className="mt-3 text-xs text-foreground/55">
        <span className="font-semibold text-foreground/70">Fueling · </span>
        {fuel.hydration}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200/70 px-3.5 py-3 dark:bg-amber-500/10 dark:border-amber-500/25">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-amber-900 dark:text-amber-200">⛽ Fueling</span>
        <span className="text-[11px] font-semibold text-amber-700/70 dark:text-amber-300/70">
          ~{fuel.durationLabel} on feet{fuel.fromActuals ? " · actual" : ""}
        </span>
      </div>
      <div className="space-y-2">
        <Row label="Before" body={fuel.before} />
        {fuel.during && <Row label="During" body={fuel.during} />}
        {fuel.carbGoal && <Row label="Carbs" body={fuel.carbGoal} />}
        {fuel.planCue && <Row label="Plan" body={fuel.planCue} />}
        {fuel.sodium && <Row label="Sodium" body={fuel.sodium} />}
        <Row label="Water" body={fuel.hydration} />
      </div>
    </div>
  );
}
