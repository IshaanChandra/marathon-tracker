import { NextResponse } from "next/server";
import { sendPush, pushConfigured, runNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Fire a sample run notification to all registered devices, so the owner can confirm
 * delivery on their phone. PIN-gated (see proxy.ts).
 */
export async function POST() {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push not configured (VAPID env unset)" }, { status: 500 });
  }
  const report = await sendPush(runNotification(6.2, "9:24"));
  return NextResponse.json(report);
}
