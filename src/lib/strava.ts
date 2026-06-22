import "server-only";
import type { DayLog } from "./types";
import { getDayLog, getSetting, setLog, setSetting } from "./db";
import { nyDateFromInstant } from "./dates";

/**
 * Strava → plan-day sync. This module is source-shaped but deliberately thin: a
 * Strava activity is mapped to a {date, miles, pace} patch and applied to the day's
 * log. Garmin/Strava is authoritative for distance/pace (they overwrite), but the
 * run's notes / lift / stretch check-offs are never touched.
 *
 * Phase 1 (here) is the pure mapping + apply core — testable via /api/strava/test
 * with no Strava wiring. OAuth, tokens, and the webhook live alongside in later phases.
 */

/** The activity-detail fields we use (Strava sends many more; the rest are ignored). */
export interface StravaActivity {
  id: number;
  type?: string; // legacy field, e.g. "Run"
  sport_type?: string; // newer, e.g. "Run" | "TrailRun" | "VirtualRun"
  distance: number; // meters
  moving_time: number; // seconds
  start_date: string; // UTC ISO timestamp
}

const METERS_PER_MILE = 1609.34;

/** Treadmill / trail / virtual runs all carry "run" in their type; rides/walks don't. */
export function isRunActivity(a: StravaActivity): boolean {
  return (a.sport_type || a.type || "").toLowerCase().includes("run");
}

/** Minutes-per-mile (e.g. 9.4) → "9:24"; carries a 60s rounding edge to the next minute. */
function fmtPace(minPerMile: number): string {
  let m = Math.floor(minPerMile);
  let s = Math.round((minPerMile - m) * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface LogPatch {
  date: string;
  miles: number;
  pace: string | null;
}

/** Pure mapping: a run activity → the day + fields it should fill. */
export function activityToLogPatch(a: StravaActivity): LogPatch {
  const date = nyDateFromInstant(a.start_date);
  const miles = Math.round((a.distance / METERS_PER_MILE) * 100) / 100;
  const pace = miles > 0 && a.moving_time > 0 ? fmtPace(a.moving_time / 60 / miles) : null;
  return { date, miles, pace };
}

const EMPTY_LOG: DayLog = {
  runDone: false,
  liftDone: false,
  addonDone: false,
  actualMiles: null,
  actualPace: null,
  notes: null,
};

export interface ApplyResult {
  applied: boolean;
  reason?: string;
  date?: string;
  miles?: number;
  pace?: string | null;
}

/**
 * Check off the matching day's run and fill in distance/pace. Overwrites those run
 * fields (watch is authoritative) while preserving notes/lift/addon. Idempotent —
 * re-applying the same activity yields the same log.
 */
export async function applyActivity(a: StravaActivity): Promise<ApplyResult> {
  if (!isRunActivity(a)) return { applied: false, reason: "not a run" };
  const { date, miles, pace } = activityToLogPatch(a);
  const existing = (await getDayLog(date)) ?? EMPTY_LOG;
  await setLog(date, { ...existing, runDone: true, actualMiles: miles, actualPace: pace });
  await mergeStatus({ lastSyncAt: new Date().toISOString(), lastRun: { date, miles, pace } });
  return { applied: true, date, miles, pace };
}

// ---- OAuth + token store (Phase 2) ----------------------------------------------
//
// Tokens live in the `strava.tokens` setting, which db.isSecretSetting() redacts from
// the public /api/state. A non-secret `strava.status` mirror (connected flag + last
// sync) is what the UI reads.

const TOKENS_KEY = "strava.tokens";
const STATUS_KEY = "strava.status";
const OAUTH_URL = "https://www.strava.com/oauth/token";

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  athlete_id: number;
}

export interface StravaStatus {
  connected: boolean;
  athleteId?: number;
  athleteName?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  lastRun?: { date: string; miles: number; pace: string | null };
  subscribed?: boolean;
  subscriptionId?: number;
}

export function stravaConfigured(): boolean {
  return !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
}

export function clientId(): string {
  return process.env.STRAVA_CLIENT_ID ?? "";
}

async function getTokens(): Promise<StravaTokens | null> {
  return ((await getSetting(TOKENS_KEY)) as StravaTokens | null) ?? null;
}

export async function getStatus(): Promise<StravaStatus | null> {
  return ((await getSetting(STATUS_KEY)) as StravaStatus | null) ?? null;
}

async function mergeStatus(patch: Partial<StravaStatus>): Promise<void> {
  const cur = (await getStatus()) ?? { connected: false };
  await setSetting(STATUS_KEY, { ...cur, ...patch });
}

/** Exchange an OAuth authorization code for tokens and persist them. */
export async function exchangeCode(code: string): Promise<{ athleteId: number }> {
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const athleteId = data.athlete?.id as number;
  await setSetting(TOKENS_KEY, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: athleteId,
  } satisfies StravaTokens);
  await setSetting(STATUS_KEY, {
    connected: true,
    athleteId,
    athleteName: [data.athlete?.firstname, data.athlete?.lastname].filter(Boolean).join(" ") || undefined,
    connectedAt: new Date().toISOString(),
  } satisfies StravaStatus);
  return { athleteId };
}

/** Current access token, refreshed in place when it's within 60s of expiry. */
export async function getAccessToken(): Promise<string | null> {
  const t = await getTokens();
  if (!t) return null;
  if (t.expires_at > Date.now() / 1000 + 60) return t.access_token;
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: t.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const next: StravaTokens = {
    ...t,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };
  await setSetting(TOKENS_KEY, next);
  return next.access_token;
}

/** The athlete id we authorized — used to ignore webhook events for anyone else. */
export async function getAthleteId(): Promise<number | null> {
  return (await getTokens())?.athlete_id ?? null;
}

/** Forget the Strava connection (tokens + status). Subscription teardown is separate. */
export async function disconnect(): Promise<void> {
  await setSetting(TOKENS_KEY, null);
  await setSetting(STATUS_KEY, null);
}

// ---- Activity fetch + webhook subscription (Phase 3) ----------------------------

const API = "https://www.strava.com/api/v3";

/** Fetch a full activity detail by id, using the (refreshed) access token. */
export async function fetchActivity(id: number): Promise<StravaActivity | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API}/activities/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as StravaActivity;
}

/** The webhook entry point: fetch the activity, then apply it to its day. */
export async function syncActivityById(id: number): Promise<ApplyResult> {
  const a = await fetchActivity(id);
  if (!a) return { applied: false, reason: "fetch failed" };
  return applyActivity(a);
}

function creds(): URLSearchParams {
  return new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    client_secret: process.env.STRAVA_CLIENT_SECRET ?? "",
  });
}

/** Create the single push subscription. Strava immediately GET-validates callbackUrl. */
export async function createSubscription(callbackUrl: string, verifyToken: string): Promise<unknown> {
  const body = creds();
  body.set("callback_url", callbackUrl);
  body.set("verify_token", verifyToken);
  const res = await fetch(`${API}/push_subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`subscribe failed: ${res.status} ${JSON.stringify(data)}`);
  await mergeStatus({ subscribed: true, subscriptionId: data.id });
  return data;
}

export async function getSubscriptions(): Promise<Array<{ id: number; callback_url: string }>> {
  const res = await fetch(`${API}/push_subscriptions?${creds()}`, { cache: "no-store" });
  return res.ok ? await res.json() : [];
}

/** Tear down any existing subscription(s). */
export async function deleteSubscription(): Promise<void> {
  for (const s of await getSubscriptions()) {
    await fetch(`${API}/push_subscriptions/${s.id}?${creds()}`, { method: "DELETE" });
  }
  await mergeStatus({ subscribed: false, subscriptionId: undefined });
}
