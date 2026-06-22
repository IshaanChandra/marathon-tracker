"use client";

import { useState } from "react";
import type { Addon, EffectiveDay, Lift, Run, RunType } from "@/lib/types";
import { getDay, getWeek, weekDates, RUN_TYPE_LABELS } from "@/lib/plan";
import { effectiveDay } from "@/lib/merge";
import { formatWeekday, formatShort } from "@/lib/dates";
import { useStore } from "@/lib/store";

const RUN_TYPES = Object.keys(RUN_TYPE_LABELS) as RunType[];
const LIFT_PRESETS = ["Chest/Tri", "Back/Bi", "Legs", "Shoulders/Arms", "Full body"];

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
  const [lift, setLift] = useState<Lift | null>(day.lift ? { ...day.lift } : null);
  const [addon, setAddon] = useState<Addon | null>(day.addon ? { ...day.addon } : null);
  const [skipped, setSkipped] = useState(day.skipped);

  const week = getWeek(planned.weekId);
  const swapCandidates = week
    ? weekDates(week).filter((d) => d !== day.date && getDay(d))
    : [];

  const patchRun = (patch: Partial<Run>) =>
    setRun((r) => (r ? { ...r, ...patch } : r));

  const save = () => {
    const existing = state.overrides[day.date] ?? {};
    setOverride(day.date, { ...existing, run, lift, addon, skipped: skipped || undefined });
    onClose();
  };

  const revert = () => {
    setOverride(day.date, null);
    // If this day was part of a swap, also revert its partner
    const partner = state.overrides[day.date]?.swappedWith;
    if (partner) setOverride(partner, null);
    onClose();
  };

  /** Move this day's (possibly edited) run to another day; this day keeps its lift. */
  const moveRun = (other: string) => {
    if (!run) return;
    setOverride(day.date, { ...state.overrides[day.date], run: null });
    setOverride(other, { ...state.overrides[other], run });
    onClose();
  };

  const moveLift = (other: string) => {
    if (!lift) return;
    setOverride(day.date, { ...state.overrides[day.date], lift: null });
    setOverride(other, { ...state.overrides[other], lift });
    onClose();
  };

  /** Short label of what currently lives on a candidate day. */
  const dayLabel = (d: string) => {
    const eff = effectiveDay(d, state);
    if (!eff || eff.skipped) return "—";
    if (eff.run) return `${eff.run.miles} mi`;
    if (eff.lift) return `Lift`;
    return "Rest";
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
      <div className="absolute bottom-0 inset-x-0 sm:max-w-lg sm:mx-auto bg-card rounded-t-2xl shadow-xl max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 bg-card px-5 pt-4 pb-3 border-b border-edge/60 flex items-center justify-between">
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
              className="w-5 h-5 accent-success"
            />
          </label>

          {/* Run fields */}
          {run ? (
            <div className={`space-y-3 ${skipped ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground/45">Run</span>
                <button
                  onClick={() => setRun(null)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-300"
                >
                  Remove run
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-medium text-foreground/45">Miles</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={run.miles}
                    onChange={(e) => patchRun({ miles: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-foreground/45">Type</span>
                  <select
                    value={run.type}
                    onChange={(e) => patchRun({ type: e.target.value as RunType })}
                    className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card"
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
                  className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground/45">Workout structure</span>
                <input
                  type="text"
                  value={run.structure ?? ""}
                  onChange={(e) => patchRun({ structure: e.target.value || null })}
                  placeholder="e.g. 2 mi wu + 4 mi tempo + 1 mi cd"
                  className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground/45">Fueling</span>
                <input
                  type="text"
                  value={run.fueling ?? ""}
                  onChange={(e) => patchRun({ fueling: e.target.value || null })}
                  placeholder="e.g. 3 gels + 2 SaltStick + water"
                  className="mt-1 w-full rounded-lg border border-edge px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : (
            <button
              onClick={() =>
                setRun({ miles: 4, type: "easy", hrZone: "HR 135-145", pace: null, structure: null, fueling: null })
              }
              className="w-full rounded-xl border border-dashed border-edge py-3 text-sm font-medium text-foreground/60 hover:bg-soft"
            >
              + Add a run to this day
            </button>
          )}

          {/* Lift */}
          {lift ? (
            <div className={`space-y-2 ${skipped ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground/45">Lift</span>
                <button
                  onClick={() => setLift(null)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-300"
                >
                  Remove lift
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LIFT_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setLift({ ...lift, focus: p })}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      lift.focus === p
                        ? "bg-primary text-primary-contrast"
                        : "bg-soft text-foreground/70 hover:bg-edge"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={lift.focus}
                onChange={(e) => setLift({ ...lift, focus: e.target.value })}
                placeholder="Focus (e.g. Legs)"
                className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card"
              />
              <input
                type="text"
                value={lift.notes ?? ""}
                onChange={(e) => setLift({ ...lift, notes: e.target.value || null })}
                placeholder="Notes (e.g. RPE 7, light)"
                className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card"
              />
            </div>
          ) : (
            <button
              onClick={() => setLift({ focus: "Chest/Tri", notes: null })}
              className="w-full rounded-xl border border-dashed border-edge py-3 text-sm font-medium text-foreground/60 hover:bg-soft"
            >
              + Add a lift to this day
            </button>
          )}

          {/* Stretch / recover add-on */}
          {addon ? (
            <div className={`space-y-2 ${skipped ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground/45">Stretch / recover</span>
                <button
                  onClick={() => setAddon(null)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-300"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={addon.label}
                onChange={(e) => setAddon({ ...addon, label: e.target.value })}
                placeholder="e.g. Stretch / recover, Mobility, Yoga"
                className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card"
              />
              <input
                type="text"
                value={addon.notes ?? ""}
                onChange={(e) => setAddon({ ...addon, notes: e.target.value || null })}
                placeholder="Notes (e.g. 20 min, hips + calves)"
                className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-card"
              />
            </div>
          ) : (
            <button
              onClick={() => setAddon({ label: "Stretch / recover", notes: null })}
              className="w-full rounded-xl border border-dashed border-edge py-3 text-sm font-medium text-foreground/60 hover:bg-soft"
            >
              + Add stretch / recover
            </button>
          )}

          {/* Move run / lift to another day this week */}
          {run && swapCandidates.length > 0 && (
            <div className={skipped ? "opacity-40 pointer-events-none" : ""}>
              <div className="text-xs font-medium text-foreground/45 mb-2">
                Move this run to… <span className="text-foreground/35">(replaces what&apos;s there)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {swapCandidates.map((d) => (
                  <button
                    key={d}
                    onClick={() => moveRun(d)}
                    className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium hover:bg-soft"
                  >
                    {formatWeekday(d)} <span className="text-foreground/45">· now {dayLabel(d)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {lift && swapCandidates.length > 0 && (
            <div className={skipped ? "opacity-40 pointer-events-none" : ""}>
              <div className="text-xs font-medium text-foreground/45 mb-2">Move this lift to…</div>
              <div className="flex flex-wrap gap-2">
                {swapCandidates.map((d) => (
                  <button
                    key={d}
                    onClick={() => moveLift(d)}
                    className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium hover:bg-soft"
                  >
                    {formatWeekday(d)} <span className="text-foreground/45">· now {dayLabel(d)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Swap entire days */}
          {swapCandidates.length > 0 && (
            <div>
              <div className="text-xs font-medium text-foreground/45 mb-2">
                Swap whole day with…
              </div>
              <div className="flex flex-wrap gap-2">
                {swapCandidates.map((d) => {
                  const pd = getDay(d)!;
                  return (
                    <button
                      key={d}
                      onClick={() => swapWith(d)}
                      className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium hover:bg-soft"
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
              className="flex-1 rounded-xl bg-primary text-primary-contrast py-3 font-semibold text-sm"
            >
              Save changes
            </button>
            {day.adjusted && (
              <button
                onClick={revert}
                className="rounded-xl border border-edge px-4 py-3 font-semibold text-sm text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/15"
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
