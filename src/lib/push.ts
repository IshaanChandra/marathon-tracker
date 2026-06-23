import "server-only";
import webpush from "web-push";
import { getSetting, setSetting } from "./db";

/**
 * Web Push for the installed iOS PWA. Only the owner can subscribe: the
 * /api/push/subscribe route that calls addSubscription() is PIN-gated, and the stored
 * subscriptions live in the `push.subscriptions` setting, which db.isSecretSetting()
 * redacts from the public /api/state. So a public viewer can neither register a device
 * nor read who's subscribed. The server only ever pushes to these owner-registered subs.
 *
 * The public VAPID key is, by design, public (it ships to the client as the
 * applicationServerKey); only VAPID_PRIVATE_KEY is secret and stays server-side.
 */

const SUBS_KEY = "push.subscriptions";

export interface PushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// The public key uses the NEXT_PUBLIC_ prefix because the client also needs it (as the
// applicationServerKey). NEXT_PUBLIC_ vars are still readable here on the server.
export function pushConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let vapidSet = false;
function initVapid() {
  if (vapidSet) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:ishaanc3@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidSet = true;
}

async function getSubs(): Promise<PushSub[]> {
  return ((await getSetting(SUBS_KEY)) as PushSub[] | null) ?? [];
}

/** Idempotent — re-enabling the same device (same endpoint) doesn't duplicate it. */
export async function addSubscription(sub: PushSub): Promise<void> {
  const subs = await getSubs();
  if (subs.some((s) => s.endpoint === sub.endpoint)) return;
  subs.push(sub);
  await setSetting(SUBS_KEY, subs);
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const kept = (await getSubs()).filter((s) => s.endpoint !== endpoint);
  await setSetting(SUBS_KEY, kept.length ? kept : null);
}

export interface SendReport {
  configured: boolean;
  subCount: number;
  sent: number;
  errors: { status?: number; message: string }[];
}

/**
 * Push to every owner-registered device. Returns a report (used by /api/push/test to
 * surface delivery failures). Best-effort: a 404/410 means the browser dropped the
 * subscription (uninstalled / revoked), so we prune it.
 */
export async function sendPush(payload: PushPayload): Promise<SendReport> {
  if (!pushConfigured()) return { configured: false, subCount: 0, sent: 0, errors: [] };
  const subs = await getSubs();
  const report: SendReport = { configured: true, subCount: subs.length, sent: 0, errors: [] };
  if (!subs.length) return report;
  initVapid();
  const data = JSON.stringify(payload);
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(s, data);
        report.sent++;
      } catch (e) {
        const err = e as { statusCode?: number; body?: string; message?: string };
        if (err.statusCode === 404 || err.statusCode === 410) stale.push(s.endpoint);
        report.errors.push({
          status: err.statusCode,
          message: (err.body || err.message || String(e)).slice(0, 200),
        });
      }
    }),
  );
  if (stale.length) {
    const kept = subs.filter((s) => !stale.includes(s.endpoint));
    await setSetting(SUBS_KEY, kept.length ? kept : null);
  }
  return report;
}

const TITLES = [
  "Nice run, Ishaan 🏃",
  "Strong work, Ishaan 💪",
  "Another one done 🔥",
  "Let's go, Ishaan 👟",
];

/** Notification for an auto-synced run: motivational title + "X mi @ pace ✅". */
export function runNotification(miles: number, pace: string | null): PushPayload {
  const title = TITLES[Math.floor(Math.random() * TITLES.length)];
  const body = pace ? `${miles} mi @ ${pace}/mi ✅` : `${miles} mi ✅`;
  return { title, body, url: "/" };
}
