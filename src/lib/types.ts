export type RunType =
  | "easy"
  | "long"
  | "hills"
  | "threshold"
  | "vo2"
  | "tempo"
  | "mp"
  | "shakeout"
  | "strides"
  | "race";

export interface Run {
  miles: number;
  type: RunType;
  hrZone: string | null;
  pace: string | null;
  structure: string | null;
  fueling: string | null;
}

export interface Lift {
  focus: string;
  notes: string | null;
}

export interface PlanDay {
  weekId: string;
  dow: string;
  raw: string;
  run: Run | null;
  lift: Lift | null;
  rest: boolean;
  notes: string | null;
}

export interface Week {
  id: string;
  phase: string;
  weekOf: string; // Monday, YYYY-MM-DD
  targetMiles: number | null;
  targetMilesText: string;
  liftDays: string;
  isCutback: boolean;
  travel: "italy" | "wedding" | null;
  note: string | null;
}

export interface ScenarioOption {
  label: string;
  miles: string | null;
  description: string;
}

export interface Plan {
  meta: {
    goal: string;
    race: string;
    raceDate: string;
    startDate: string;
    marathonPace: string;
    baseBuildingNotes: string[];
  };
  weeks: Week[];
  days: Record<string, PlanDay>;
  scenarios: Record<string, { weekId: string; options: Record<string, ScenarioOption> }>;
}

export interface RefItem {
  term: string;
  body: string;
  sub: boolean;
}

export interface RefSection {
  heading: string;
  items: RefItem[];
}

// ---- dynamic layer ----

export interface DayLog {
  runDone: boolean;
  liftDone: boolean;
  actualMiles: number | null;
  actualPace: string | null;
  notes: string | null;
}

/** Partial replacement of a planned day. `skipped` excludes it from planned miles. */
export interface DayOverride {
  run?: Run | null;
  lift?: Lift | null;
  rest?: boolean;
  skipped?: boolean;
  swappedWith?: string; // date this day was swapped with
}

export interface AppState {
  logs: Record<string, DayLog>;
  overrides: Record<string, DayOverride>;
  settings: Record<string, unknown>; // e.g. "travel.italy": {scenario: "B"}
}

/** A plan day with overrides merged in and log state attached. */
export interface EffectiveDay extends PlanDay {
  date: string;
  adjusted: boolean;
  skipped: boolean;
  log: DayLog | null;
}
