import { plan } from "@/lib/plan";
import { fuelingFor } from "@/lib/fueling";
import type { Run } from "@/lib/types";
import { daysBetween, todayNY, formatLong } from "@/lib/dates";

/**
 * Race-day pacing + fueling reference. Splits are derived from the plan's marathon
 * pace (8:35/mi → ~3:45) so they always match the plan; the gel/water schedule reuses
 * fuelingFor() so it's identical to what the Fueling panel shows on race day. The 3:45
 * pacing carries a deliberate cushion under the sub-4:00 goal for bathroom/family stops.
 */

const MARATHON_MI = 26.21875;

const SPLITS: { label: string; miles: number }[] = [
  { label: "5K", miles: 3.10686 },
  { label: "10K", miles: 6.21371 },
  { label: "Half", miles: 13.10938 },
  { label: "30K", miles: 18.64114 },
  { label: "20 mi", miles: 20 },
  { label: "Marathon", miles: MARATHON_MI },
];

/** "8:35/mi" → 515 seconds per mile. */
function paceSeconds(p: string): number {
  const m = p.match(/(\d+):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

/** Seconds → "H:MM:SS" (or "M:SS" under an hour). */
function hms(totalSec: number): string {
  const s = Math.round(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export default function RaceCard() {
  const { marathonPace, raceDate } = plan.meta;
  const secPerMi = paceSeconds(marathonPace);
  const finishSec = secPerMi * MARATHON_MI;
  const bufferSec = 4 * 3600 - finishSec; // cushion under the sub-4:00 goal
  const daysOut = daysBetween(todayNY(), raceDate);

  const raceRun: Run = {
    miles: MARATHON_MI,
    type: "race",
    hrZone: null,
    pace: marathonPace,
    structure: null,
    fueling: null,
  };
  const fuel = fuelingFor(raceRun);

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Race day — {formatLong(raceDate)}</h2>
        {daysOut > 0 && (
          <span className="text-[11px] font-medium text-foreground/45 shrink-0">
            {daysOut} days out
          </span>
        )}
      </div>

      <p className="text-xs text-foreground/55 mt-1">
        Pace <strong className="text-foreground/80">{marathonPace}</strong> → target{" "}
        <strong className="text-foreground/80">{hms(finishSec)}</strong>, which banks{" "}
        <strong className="text-foreground/80">{hms(bufferSec)}</strong> of cushion under 4:00 for
        bathroom stops and hellos.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center tabular-nums">
        {SPLITS.map((s) => (
          <div key={s.label} className="rounded-lg bg-soft px-2 py-1.5">
            <div className="text-[11px] font-medium text-foreground/45">{s.label}</div>
            <div className="text-sm font-semibold">{hms(secPerMi * s.miles)}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 text-xs text-foreground/70">
        {fuel.during && (
          <div>
            <span className="text-foreground/45">Gels · </span>
            {fuel.during}
          </div>
        )}
        {fuel.carbGoal && (
          <div>
            <span className="text-foreground/45">Carbs · </span>
            {fuel.carbGoal}
          </div>
        )}
        <div>
          <span className="text-foreground/45">Before · </span>
          {fuel.before}
        </div>
        {fuel.sodium && (
          <div>
            <span className="text-foreground/45">Sodium · </span>
            {fuel.sodium}
          </div>
        )}
        <div>
          <span className="text-foreground/45">Water · </span>
          {fuel.hydration}
        </div>
      </div>
    </div>
  );
}
