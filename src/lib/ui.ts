/** Phase + run-type visual language. One place so every view matches. */

export interface PhaseStyle {
  chip: string; // small label badge
  dot: string; // calendar dot / bar segments
  border: string; // accent borders
}

export const PHASE_STYLES: Record<string, PhaseStyle> = {
  "Base Building": { chip: "bg-slate-100 text-slate-700", dot: "bg-slate-400", border: "border-slate-300" },
  Base: { chip: "bg-sky-100 text-sky-800", dot: "bg-sky-400", border: "border-sky-300" },
  Hills: { chip: "bg-amber-100 text-amber-800", dot: "bg-amber-400", border: "border-amber-300" },
  Intervals: { chip: "bg-violet-100 text-violet-800", dot: "bg-violet-400", border: "border-violet-300" },
  "Tempo/MP": { chip: "bg-rose-100 text-rose-800", dot: "bg-rose-400", border: "border-rose-300" },
  Peak: { chip: "bg-orange-100 text-orange-800", dot: "bg-orange-500", border: "border-orange-300" },
  Taper: { chip: "bg-teal-100 text-teal-800", dot: "bg-teal-400", border: "border-teal-300" },
  Race: { chip: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", border: "border-emerald-300" },
};

export function phaseStyle(phase: string): PhaseStyle {
  return PHASE_STYLES[phase] ?? PHASE_STYLES["Base Building"];
}

/** Hard sessions pop; easy days stay quiet. */
export const RUN_TYPE_CHIP: Record<string, string> = {
  easy: "bg-sky-50 text-sky-700",
  long: "bg-indigo-100 text-indigo-800",
  hills: "bg-amber-100 text-amber-800",
  threshold: "bg-rose-100 text-rose-800",
  vo2: "bg-violet-100 text-violet-800",
  tempo: "bg-rose-100 text-rose-800",
  mp: "bg-orange-100 text-orange-800",
  shakeout: "bg-slate-100 text-slate-600",
  strides: "bg-slate-100 text-slate-600",
  race: "bg-emerald-600 text-white",
};
