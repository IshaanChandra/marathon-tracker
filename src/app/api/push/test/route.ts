import { NextResponse } from "next/server";
import { sendPush, pushConfigured, runNotification, weeklyRecapNotification } from "@/lib/push";
import { getState } from "@/lib/db";
import { weekForDate } from "@/lib/plan";
import { recapWeek, weekRecap } from "@/lib/weekStats";
import { todayNY } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Fire a sample notification to all registered devices so the owner can confirm delivery.
 * PIN-gated (see proxy.ts). Body `{ kind: "weekly" }` sends the real weekly recap for the
 * current week (same content the Sunday cron sends); default is the run-sync sample.
 */
export async function POST(request: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push not configured (VAPID env unset)" }, { status: 500 });
  }
  let kind = "run";
  try {
    const body = (await request.json()) as { kind?: string };
    if (body?.kind) kind = body.kind;
  } catch {
    /* no body — default run sample */
  }

  if (kind === "weekly") {
    const today = todayNY();
    const week = recapWeek(today)?.week ?? weekForDate(today);
    if (!week) return NextResponse.json({ error: "no plan week for today" }, { status: 200 });
    const stats = weekRecap(week, await getState());
    const report = await sendPush(weeklyRecapNotification({ weekId: week.id, ...stats }));
    return NextResponse.json(report);
  }

  const report = await sendPush(runNotification(6.2, "9:24"));
  return NextResponse.json(report);
}
