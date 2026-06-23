import { NextResponse } from "next/server";
import { addSubscription, removeSubscription, pushConfigured, type PushSub } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Register / unregister this device for run notifications. PIN-gated (see proxy.ts) —
 * only the owner can subscribe, so a public viewer can't make the site notify their phone.
 */
export async function POST(request: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push not configured (VAPID env unset)" }, { status: 500 });
  }
  let sub: PushSub;
  try {
    sub = (await request.json()) as PushSub;
  } catch {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "incomplete subscription" }, { status: 400 });
  }
  await addSubscription(sub);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  let body: { endpoint?: string };
  try {
    body = (await request.json()) as { endpoint?: string };
  } catch {
    body = {};
  }
  if (!body.endpoint) {
    return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
  }
  await removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
