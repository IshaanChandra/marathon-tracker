"use client";

import type { EffectiveDay } from "@/lib/types";
import { RUN_TYPE_LABELS } from "@/lib/plan";
import { RUN_TYPE_CHIP, RUN_TYPE_TINT } from "@/lib/ui";
import { useStore } from "@/lib/store";
import FuelingPanel from "./FuelingPanel";

function CheckButton({
  done,
  label,
  onToggle,
}: {
  done: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        done
          ? "bg-success text-success-contrast"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      <span
        className={`grid place-items-center w-5 h-5 rounded-full border-2 text-[11px] ${
          done ? "border-success-contrast/60" : "border-primary/40"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

function emptyLog() {
  return {
    runDone: false,
    liftDone: false,
    addonDone: false,
    actualMiles: null,
    actualPace: null,
    notes: null,
  };
}

export default function DayCard({ day }: { day: EffectiveDay }) {
  const { setLog } = useStore();
  const log = day.log ?? emptyLog();

  const patchLog = (patch: Partial<typeof log>) => setLog(day.date, { ...log, ...patch });

  if (day.skipped) {
    return (
      <div className="card p-5 opacity-70">
        <div className="text-sm font-semibold text-foreground/50 uppercase tracking-wide">
          Skipped
        </div>
        <p className="mt-1 text-foreground/60 line-through whitespace-pre-line">{day.raw}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {day.run && (
        <div
          className={`rounded-2xl border border-edge border-l-4 bg-card bg-gradient-to-br to-card shadow-sm p-5 ${
            RUN_TYPE_TINT[day.run.type] ?? RUN_TYPE_TINT.easy
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  RUN_TYPE_CHIP[day.run.type] ?? RUN_TYPE_CHIP.easy
                }`}
              >
                {RUN_TYPE_LABELS[day.run.type] ?? day.run.type}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{day.run.miles}</span>
                <span className="text-lg text-foreground/50 font-medium">mi</span>
              </div>
            </div>
            <CheckButton
              done={log.runDone}
              label={log.runDone ? "Done" : "Mark run"}
              onToggle={() => patchLog({ runDone: !log.runDone })}
            />
          </div>

          <dl className="mt-3 space-y-1.5 text-sm">
            {day.run.pace && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-foreground/45 font-medium">Pace</dt>
                <dd className="font-semibold">{day.run.pace}</dd>
              </div>
            )}
            {day.run.hrZone && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-foreground/45 font-medium">Heart rate</dt>
                <dd className="font-semibold">{day.run.hrZone.replace("HR", "")} bpm</dd>
              </div>
            )}
            {day.run.structure && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-foreground/45 font-medium">Workout</dt>
                <dd>{day.run.structure}</dd>
              </div>
            )}
            {day.notes && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-foreground/45 font-medium">Note</dt>
                <dd className="text-foreground/70">{day.notes}</dd>
              </div>
            )}
          </dl>

          <FuelingPanel
            run={day.run}
            actuals={{ actualMiles: log.actualMiles, actualPace: log.actualPace }}
          />

          {/* Actuals */}
          <div className="mt-4 pt-3 border-t border-edge/60 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-medium text-foreground/45">Actual miles</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                defaultValue={log.actualMiles ?? ""}
                key={`${day.date}-mi-${log.actualMiles}`}
                onBlur={(e) =>
                  patchLog({ actualMiles: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder={String(day.run.miles)}
                className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground/45">Avg pace</span>
              <input
                type="text"
                defaultValue={log.actualPace ?? ""}
                key={`${day.date}-pace-${log.actualPace}`}
                onBlur={(e) => patchLog({ actualPace: e.target.value || null })}
                placeholder="9:45"
                className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
        </div>
      )}

      {day.lift && (
        <div className="rounded-2xl border border-edge border-l-4 !border-l-stone-400 bg-card bg-gradient-to-br from-stone-200/50 to-card shadow-sm p-5 dark:from-stone-500/15">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-stone-200 text-stone-700 dark:bg-stone-500/25 dark:text-stone-200">
                Lift
              </span>
              <div className="mt-1.5 text-xl font-bold tracking-tight">{day.lift.focus}</div>
              {day.lift.notes && (
                <div className="text-sm text-foreground/55 mt-0.5">{day.lift.notes}</div>
              )}
            </div>
            <CheckButton
              done={log.liftDone}
              label={log.liftDone ? "Done" : "Mark lift"}
              onToggle={() => patchLog({ liftDone: !log.liftDone })}
            />
          </div>
        </div>
      )}

      {day.addon && (
        <div className="rounded-2xl border border-edge border-l-4 !border-l-teal-400 bg-card bg-gradient-to-br from-teal-200/40 to-card shadow-sm p-5 dark:from-teal-500/15">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-500/25 dark:text-teal-200">
                Recovery
              </span>
              <div className="mt-1.5 text-xl font-bold tracking-tight">{day.addon.label}</div>
              {day.addon.notes && (
                <div className="text-sm text-foreground/55 mt-0.5">{day.addon.notes}</div>
              )}
            </div>
            <CheckButton
              done={log.addonDone}
              label={log.addonDone ? "Done" : "Mark done"}
              onToggle={() => patchLog({ addonDone: !log.addonDone })}
            />
          </div>
        </div>
      )}

      {/* A run logged on a day with no planned run (e.g. an unplanned run synced from
          Strava) — surfaced so its miles are visible, not silently swallowed. */}
      {!day.run && (log.runDone || log.actualMiles != null) && (
        <div className="rounded-2xl border border-edge border-l-4 !border-l-sky-400 bg-card bg-gradient-to-br from-sky-100/60 to-card shadow-sm p-5 dark:from-sky-500/15">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200">
                Extra run
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{log.actualMiles ?? "—"}</span>
                <span className="text-lg text-foreground/50 font-medium">mi</span>
                {log.actualPace && (
                  <span className="text-sm text-foreground/55 font-medium">· {log.actualPace}/mi</span>
                )}
              </div>
              <div className="mt-1 text-xs text-foreground/45">Logged on a rest day — counts toward your totals.</div>
            </div>
            <CheckButton
              done={log.runDone}
              label={log.runDone ? "Done" : "Mark run"}
              onToggle={() => patchLog({ runDone: !log.runDone })}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-edge/60 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-medium text-foreground/45">Actual miles</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                defaultValue={log.actualMiles ?? ""}
                key={`${day.date}-xmi-${log.actualMiles}`}
                onBlur={(e) =>
                  patchLog({ actualMiles: e.target.value === "" ? null : Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground/45">Avg pace</span>
              <input
                type="text"
                defaultValue={log.actualPace ?? ""}
                key={`${day.date}-xpace-${log.actualPace}`}
                onBlur={(e) => patchLog({ actualPace: e.target.value || null })}
                placeholder="9:45"
                className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
        </div>
      )}

      {!day.run && !day.lift && !day.addon && !(log.runDone || log.actualMiles != null) && (
        <div className="card p-5">
          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-500/25 dark:text-slate-300">
            Rest
          </span>
          <p className="mt-2 text-foreground/70">{day.notes ?? "Rest day — stretch and recover."}</p>
        </div>
      )}

      {/* Day notes */}
      <div className="card p-4">
        <label className="block">
          <span className="text-xs font-medium text-foreground/45">Notes</span>
          <textarea
            defaultValue={log.notes ?? ""}
            key={`${day.date}-notes-${log.notes}`}
            onBlur={(e) => patchLog({ notes: e.target.value || null })}
            placeholder="How did it feel?"
            rows={2}
            className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </label>
      </div>
    </div>
  );
}
