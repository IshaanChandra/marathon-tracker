/** Phase + run-type visual language. One place so every view matches. */

export interface PhaseStyle {
  chip: string; // small label badge
  dot: string; // calendar dot / bar segments
  border: string; // accent borders
}

export const PHASE_STYLES: Record<string, PhaseStyle> = {
  "Base Building": {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/25 dark:text-slate-200",
    dot: "bg-slate-400",
    border: "border-slate-300",
  },
  Base: {
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-500/25 dark:text-sky-200",
    dot: "bg-sky-400",
    border: "border-sky-300",
  },
  Hills: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200",
    dot: "bg-amber-400",
    border: "border-amber-300",
  },
  Intervals: {
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-violet-200",
    dot: "bg-violet-400",
    border: "border-violet-300",
  },
  "Tempo/MP": {
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200",
    dot: "bg-rose-400",
    border: "border-rose-300",
  },
  Peak: {
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-500/25 dark:text-orange-200",
    dot: "bg-orange-500",
    border: "border-orange-300",
  },
  Taper: {
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-500/25 dark:text-teal-200",
    dot: "bg-teal-400",
    border: "border-teal-300",
  },
  Race: {
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200",
    dot: "bg-emerald-500",
    border: "border-emerald-300",
  },
};

export function phaseStyle(phase: string): PhaseStyle {
  return PHASE_STYLES[phase] ?? PHASE_STYLES["Base Building"];
}

/** Hard sessions pop; easy days stay quiet. */
export const RUN_TYPE_CHIP: Record<string, string> = {
  easy: "bg-sky-100 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200",
  long: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/30 dark:text-indigo-200",
  hills: "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200",
  threshold: "bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200",
  vo2: "bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-violet-200",
  tempo: "bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-200",
  mp: "bg-orange-100 text-orange-800 dark:bg-orange-500/25 dark:text-orange-200",
  shakeout: "bg-slate-100 text-slate-600 dark:bg-slate-500/25 dark:text-slate-300",
  strides: "bg-slate-100 text-slate-600 dark:bg-slate-500/25 dark:text-slate-300",
  race: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
};
