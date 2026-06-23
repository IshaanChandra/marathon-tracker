import { NextResponse } from "next/server";
import { sendPush, pushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Fire a sample run notification to all registered devices, so the owner can confirm
 * delivery on their phone. PIN-gated (see proxy.ts).
 */
export async function POST() {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push not configured (VAPID env unset)" }, { status: 500 });
  }
  await sendPush({ title: "Nice run, Ishaan 🏃", body: "6.2 mi @ 9:24/mi ✅", url: "/" });
  return NextResponse.json({ ok: true });
}
