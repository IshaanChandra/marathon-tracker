import { NextResponse } from "next/server";
import { stravaToken } from "@/lib/auth";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  stravaConfigured,
} from "@/lib/strava";

export const dynamic = "force-dynamic";

function origin(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host");
  return `${proto}://${host}`;
}

/** Current subscription(s). PIN-gated. */
export async function GET() {
  if (!stravaConfigured()) {
    return NextResponse.json({ error: "Strava env not configured" }, { status: 500 });
  }
  return NextResponse.json({ subscriptions: await getSubscriptions() });
}

/**
 * Arm auto-sync: register the webhook push subscription. Strava synchronously GET-
 * validates our callback, so this only succeeds against a publicly reachable URL
 * (i.e. the deployed site, not localhost). PIN-gated.
 */
export async function POST(request: Request) {
  if (!stravaConfigured()) {
    return NextResponse.json({ error: "Strava env not configured" }, { status: 500 });
  }
  // Clean callback URL — NO query string. Strava appends its own hub.* params during
  // validation; a pre-existing `?t=` would collide into `...?t=...?hub.mode=...` and
  // break parsing. The `verify_token` below is the secret that guards the GET handshake.
  const token = await stravaToken();
  const callbackUrl = `${origin(request)}/api/strava/webhook`;
  try {
    const sub = await createSubscription(callbackUrl, token);
    return NextResponse.json({ ok: true, subscription: sub });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

/** Disarm auto-sync: delete the subscription. PIN-gated. */
export async function DELETE() {
  await deleteSubscription();
  return NextResponse.json({ ok: true });
}
