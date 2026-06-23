import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { AppState, DayLog, DayOverride } from "./types";

/**
 * Server-side persistence. Two backends:
 * - Supabase (when SUPABASE_URL + SUPABASE_SERVICE_KEY are set) — production / synced
 * - Local JSON file at .data/local-store.json (gitignored) — dev fallback so the app
 *   is fully usable before Supabase exists
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

// ---------- Supabase REST backend (no SDK needed for 3 simple tables) ----------

async function sb(pathname: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase ${pathname}: ${res.status} ${await res.text()}`);
  }
  return res;
}

async function sbUpsert(table: string, row: Record<string, unknown>): Promise<void> {
  await sb(table, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(row),
  });
}

// ---------- local file backend ----------

const LOCAL_PATH = path.join(process.cwd(), ".data", "local-store.json");

function readLocal(): AppState {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_PATH, "utf8")) as AppState;
  } catch {
    return { logs: {}, overrides: {}, settings: {} };
  }
}

function writeLocal(state: AppState): void {
  fs.mkdirSync(path.dirname(LOCAL_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_PATH, JSON.stringify(state, null, 2));
}

// ---------- public API ----------

export async function getState(): Promise<AppState> {
  if (!useSupabase) return readLocal();
  const [logs, overrides, settings] = await Promise.all([
    sb("day_log?select=*").then((r) => r.json()),
    sb("day_override?select=*").then((r) => r.json()),
    sb("settings?select=*").then((r) => r.json()),
  ]);
  const state: AppState = { logs: {}, overrides: {}, settings: {} };
  for (const row of logs as Array<Record<string, unknown>>) {
    state.logs[row.date as string] = {
      runDone: !!row.run_done,
      liftDone: !!row.lift_done,
      addonDone: !!row.addon_done,
      actualMiles: (row.actual_miles as number) ?? null,
      actualPace: (row.actual_pace as string) ?? null,
      notes: (row.notes as string) ?? null,
    };
  }
  for (const row of overrides as Array<Record<string, unknown>>) {
    state.overrides[row.date as string] = row.patch as DayOverride;
  }
  for (const row of settings as Array<Record<string, unknown>>) {
    state.settings[row.key as string] = row.value;
  }
  return state;
}

/** Read a single day's log (used by sync, which preserves notes/lift/addon). */
export async function getDayLog(date: string): Promise<DayLog | null> {
  if (!useSupabase) return readLocal().logs[date] ?? null;
  const rows = (await sb(`day_log?date=eq.${date}&select=*`).then((r) => r.json())) as Array<
    Record<string, unknown>
  >;
  const row = rows[0];
  if (!row) return null;
  return {
    runDone: !!row.run_done,
    liftDone: !!row.lift_done,
    addonDone: !!row.addon_done,
    actualMiles: (row.actual_miles as number) ?? null,
    actualPace: (row.actual_pace as string) ?? null,
    notes: (row.notes as string) ?? null,
  };
}

export async function setLog(date: string, log: DayLog | null): Promise<void> {
  if (!useSupabase) {
    const state = readLocal();
    if (log) state.logs[date] = log;
    else delete state.logs[date];
    writeLocal(state);
    return;
  }
  if (log) {
    await sbUpsert("day_log", {
      date,
      run_done: log.runDone,
      lift_done: log.liftDone,
      addon_done: log.addonDone,
      actual_miles: log.actualMiles,
      actual_pace: log.actualPace,
      notes: log.notes,
      updated_at: new Date().toISOString(),
    });
  } else {
    await sb(`day_log?date=eq.${date}`, { method: "DELETE" });
  }
}

export async function setOverride(date: string, patch: DayOverride | null): Promise<void> {
  if (!useSupabase) {
    const state = readLocal();
    if (patch) state.overrides[date] = patch;
    else delete state.overrides[date];
    writeLocal(state);
    return;
  }
  if (patch) {
    await sbUpsert("day_override", { date, patch, updated_at: new Date().toISOString() });
  } else {
    await sb(`day_override?date=eq.${date}`, { method: "DELETE" });
  }
}

/** Read a single setting value (used by the Strava token store). */
export async function getSetting(key: string): Promise<unknown> {
  if (!useSupabase) return readLocal().settings[key] ?? null;
  const rows = (await sb(`settings?key=eq.${encodeURIComponent(key)}&select=value`).then((r) =>
    r.json(),
  )) as Array<{ value: unknown }>;
  return rows[0]?.value ?? null;
}

/**
 * Settings holding secrets (Strava OAuth tokens) or owner-only data (push
 * subscriptions — endpoints that can make us notify a device). These must be redacted
 * from the public /api/state response — the site is publicly readable.
 */
export function isSecretSetting(key: string): boolean {
  return key.startsWith("strava.tokens") || key.startsWith("push.subscriptions");
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  if (!useSupabase) {
    const state = readLocal();
    if (value === null) delete state.settings[key];
    else state.settings[key] = value;
    writeLocal(state);
    return;
  }
  if (value === null) {
    await sb(`settings?key=eq.${encodeURIComponent(key)}`, { method: "DELETE" });
  } else {
    await sbUpsert("settings", { key, value, updated_at: new Date().toISOString() });
  }
}
