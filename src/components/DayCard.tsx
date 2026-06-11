"use client";

import type { EffectiveDay } from "@/lib/types";
import { RUN_TYPE_LABELS } from "@/lib/plan";
import { RUN_TYPE_CHIP } from "@/lib/ui";
import { useStore } from "@/lib/store";

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
          ? "bg-emerald-600 text-white"
          : "bg-black/5 text-foreground/70 hover:bg-black/10"
      }`}
    >
      <span
        className={`grid place-items-center w-5 h-5 rounded-full border-2 text-[11px] ${
          done ? "border-white/70" : "border-foreground/30"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

function emptyLog() {
  return { runDone: false, liftDone: false, actualMiles: null, actualPace: null, notes: null };
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
        <div className="card p-5">
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

          {day.run.fueling && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200/60 px-3.5 py-2.5 text-sm">
              <span className="font-semibold text-amber-900">Fueling · </span>
              <span className="text-amber-900/90">{day.run.fueling}</span>
            </div>
          )}

          {/* Actuals */}
          <div className="mt-4 pt-3 border-t border-black/5 grid grid-cols-2 gap-2">
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
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
          </div>
        </div>
      )}

      {day.lift && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-stone-200 text-stone-700">
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

      {!day.run && !day.lift && (
        <div className="card p-5">
          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
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
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
          />
        </label>
      </div>
    </div>
  );
}
