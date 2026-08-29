"use client";

import { plan, allDates, RUN_TYPE_LABELS } from "@/lib/plan";
import { effectiveDay } from "@/lib/merge";
import { todayNY, addDays, formatShort } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { AppState } from "@/lib/types";

/**
 * Fitness check: projects a marathon finish from your own logged runs using Riegel's
 * endurance formula (T₂ = T₁·(D₂/D₁)^1.06), then compares it to the sub-4:00 goal and the
 * 8:35/mi pacing target. It reads the *sharpest* recent effort (the fastest projection
 * among your logged runs ≥ 3 mi in the last 6 weeks), so it tracks current fitness rather
 * than an average of easy days. Training-run estimates, not a race result — the caveat says so.
 */

const MARATHON_MI = 26.21875;
const RIEGEL = 1.06;
const GOAL_SEC = 4 * 3600; // sub-4:00
const TARGET_PACE_SEC = 8 * 60 + 35; // 8:35/mi plan pacing → ~3:45
const WINDOW_DAYS = 42; // last 6 weeks reflects current fitness
const MIN_MILES = 3; // ignore very short reps that over-project

/** "8:20" | "8:20/mi" → 500 (sec/mi); null if unparseable. */
function paceToSec(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(/(\d+):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Seconds → "H:MM:SS" (or "M:SS" under an hour). */
function hms(total: number): string {
  const s = Math.round(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

/** Seconds/mile → "M:SS". */
function paceStr(secPerMi: number): string {
  const m = Math.floor(secPerMi / 60);
  const s = Math.round(secPerMi % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Effort {
  date: string;
  miles: number;
  totalSec: number;
  type: string;
  /** Riegel-projected marathon time from this effort, in seconds. */
  projMara: number;
}

/** Predict the time for `dist` miles from an effort via Riegel. */
function riegel(effort: Effort, dist: number): number {
  return effort.totalSec * Math.pow(dist / effort.miles, RIEGEL);
}

function bestEffort(state: AppState, today: string): Effort | null {
  const cutoff = addDays(today, -WINDOW_DAYS);
  const efforts: Effort[] = [];
  for (const d of allDates) {
    if (d > today || d < cutoff) continue;
    const day = effectiveDay(d, state);
    if (!day?.log?.runDone) continue;
    const miles = day.log.actualMiles ?? day.run?.miles ?? 0;
    const secPerMi = paceToSec(day.log.actualPace) ?? paceToSec(day.run?.pace);
    if (miles < MIN_MILES || !secPerMi) continue;
    const totalSec = miles * secPerMi;
    const eff: Effort = {
      date: d,
      miles,
      totalSec,
      type: day.run?.type ?? "easy",
      projMara: 0,
    };
    eff.projMara = riegel(eff, MARATHON_MI);
    efforts.push(eff);
  }
  if (efforts.length === 0) return null;
  // Sharpest = fastest projection (a strong tempo/long effort, not an easy shuffle).
  return efforts.reduce((best, e) => (e.projMara < best.projMara ? e : best));
}

const LADDER: { label: string; miles: number }[] = [
  { label: "5K", miles: 3.10686 },
  { label: "10K", miles: 6.21371 },
  { label: "Half", miles: 13.10938 },
];

export default function RacePredictorCard() {
  const { state } = useStore();
  const today = todayNY();
  const eff = bestEffort(state, today);

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Fitness check</h2>
        <span className="text-[11px] font-medium text-foreground/45 shrink-0">projected marathon</span>
      </div>

      {!eff ? (
        <p className="text-xs text-foreground/55 mt-2">
          Log a run of 3+ miles with an average pace (they sync automatically from Strava) and
          this will project your marathon time from it.
        </p>
      ) : (
        (() => {
          const proj = eff.projMara;
          const projPace = proj / MARATHON_MI;
          const vsGoal = GOAL_SEC - proj; // positive = under 4:00
          const onTrack = vsGoal >= 0;
          return (
            <>
              <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold tracking-tight tabular-nums">{hms(proj)}</span>
                <span className="text-sm font-medium text-foreground/50">@ {paceStr(projPace)}/mi</span>
              </div>

              <div
                className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  onTrack
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                }`}
              >
                {onTrack ? (
                  <>
                    On track for sub-4:00 — <strong>{hms(Math.abs(vsGoal))}</strong> to spare.
                    {proj <= TARGET_PACE_SEC * MARATHON_MI
                      ? " You're at or under the 8:35/mi plan pace."
                      : ` Plan pace (8:35/mi → ${hms(TARGET_PACE_SEC * MARATHON_MI)}) is still ${hms(
                          proj - TARGET_PACE_SEC * MARATHON_MI,
                        )} faster — the taper + peak weeks close that.`}
                  </>
                ) : (
                  <>
                    <strong>{hms(Math.abs(vsGoal))}</strong> over sub-4:00 right now — expected
                    mid-build. Peak + taper typically drop projected time before race day.
                  </>
                )}
              </div>

              {/* Equivalent efforts at shorter distances, from the same run */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center tabular-nums">
                {LADDER.map((r) => (
                  <div key={r.label} className="rounded-lg bg-soft px-2 py-1.5">
                    <div className="text-[11px] font-medium text-foreground/45">{r.label}</div>
                    <div className="text-sm font-semibold">{hms(riegel(eff, r.miles))}</div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-foreground/45 mt-2.5">
                Riegel projection from your {eff.miles} mi{" "}
                {RUN_TYPE_LABELS[eff.type]?.toLowerCase() ?? eff.type} at {paceStr(eff.totalSec / eff.miles)}/mi
                on {formatShort(eff.date)}. Training-run estimate — a tune-up race would sharpen it.
              </p>
            </>
          );
        })()
      )}
    </div>
  );
}
