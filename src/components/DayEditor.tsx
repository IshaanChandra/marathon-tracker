"use client";

import { useState } from "react";
import type { EffectiveDay, Run, RunType } from "@/lib/types";
import { getDay, getWeek, weekDates, RUN_TYPE_LABELS } from "@/lib/plan";
import { formatWeekday, formatShort } from "@/lib/dates";
import { useStore } from "@/lib/store";

const RUN_TYPES = Object.keys(RUN_TYPE_LABELS) as RunType[];

/**
 * Bottom-sheet editor. Writes a day_override patch; the plan itself is untouched.
 * "Revert to plan" deletes the override.
 */
export default function DayEditor({
  day,
  onClose,
}: {
  day: EffectiveDay;
  onClose: () => void;
}) {
  const { state, setOverride } = useStore();
  const planned = getDay(day.date)!; // original, pre-override
  const [run, setRun] = useState<Run | null>(day.run ? { ...day.run } : null);
  const [skipped, setSkipped] = useState(day.skipped);

  const week = getWeek(planned.weekId);
  const swapCandidates = week
    ? weekDates(week).filter((d) => d !== day.date && getDay(d))
    : [];

  const patchRun = (patch: Partial<Run>) =>
    setRun((r) => (r ? { ...r, ...patch } : r));

  const save = () => {
    const existing = state.overrides[day.date] ?? {};
    setOverride(day.date, { ...existing, run, skipped: skipped || undefined });
    onClose();
  };

  const revert = () => {
    setOverride(day.date, null);
    // If this day was part of a swap, also revert its partner
    const partner = state.overrides[day.date]?.swappedWith;
    if (partner) setOverride(partner, null);
    onClose();
  };

  const swapWith = (other: string) => {
    const a = getDay(day.date)!;
    const b = getDay(other)!;
    setOverride(day.date, {
      run: b.run,
      lift: b.lift,
      rest: b.rest,
      swappedWith: other,
    });
    setOverride(other, {
      run: a.run,
      lift: a.lift,
      rest: a.rest,
      swappedWith: day.date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 sm:max-w-lg sm:mx-auto bg-white rounded-t-2xl shadow-xl max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-black/5 flex items-center justify-between">
          <h2 className="font-semibold">
            Edit {formatWeekday(day.date)} {formatShort(day.date)}
          </h2>
          <button onClick={onClose} className="text-foreground/40 text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Skip */}
          <label className="flex items-center justify-between">
            <span className="font-medium text-sm">Skip this day</span>
            <input
              type="checkbox"
              checked={skipped}
              onChange={(e) => setSkipped(e.target.checked)}
              className="w-5 h-5 accent-emerald-600"
            />
          </label>

          {/* Run fields */}
          {run ? (
            <div className={`space-y-3 ${skipped ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-medium text-foreground/45">Miles</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={run.miles}
                    onChange={(e) => patchRun({ miles: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-foreground/45">Type</span>
                  <select
                    value={run.type}
                    onChange={(e) => patchRun({ type: e.target.value as RunType })}
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                  >
                    {RUN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {RUN_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-foreground/45">Pace / HR</span>
                <input
                  type="text"
                  value={run.pace ?? run.hrZone ?? ""}
                  onChange={(e) => patchRun({ pace: e.target.value || null })}
                  placeholder="e.g. 8:35 or HR 135-145"
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground/45">Workout structure</span>
                <input
                  type="text"
                  value={run.structure ?? ""}
                  onChange={(e) => patchRun({ structure: e.target.value || null })}
                  placeholder="e.g. 2 mi wu + 4 mi tempo + 1 mi cd"
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground/45">Fueling</span>
                <input
                  type="text"
                  value={run.fueling ?? ""}
                  onChange={(e) => patchRun({ fueling: e.target.value || null })}
                  placeholder="e.g. 3 gels + 2 SaltStick + water"
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : (
            <button
              onClick={() =>
                setRun({ miles: 4, type: "easy", hrZone: "HR 135-145", pace: null, structure: null, fueling: null })
              }
              className="w-full rounded-xl border border-dashed border-black/20 py-3 text-sm font-medium text-foreground/60 hover:bg-black/5"
            >
              + Add a run to this day
            </button>
          )}

          {/* Swap */}
          {swapCandidates.length > 0 && (
            <div>
              <div className="text-xs font-medium text-foreground/45 mb-2">
                Swap with another day this week
              </div>
              <div className="flex flex-wrap gap-2">
                {swapCandidates.map((d) => {
                  const pd = getDay(d)!;
                  return (
                    <button
                      key={d}
                      onClick={() => swapWith(d)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                    >
                      {formatWeekday(d)} ·{" "}
                      {pd.run ? `${pd.run.miles} mi` : pd.lift ? pd.lift.focus : "Rest"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              className="flex-1 rounded-xl bg-foreground text-background py-3 font-semibold text-sm"
            >
              Save changes
            </button>
            {day.adjusted && (
              <button
                onClick={revert}
                className="rounded-xl border border-black/10 px-4 py-3 font-semibold text-sm text-rose-600 hover:bg-rose-50"
              >
                Revert to plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
