import { NextResponse } from "next/server";
import { getState } from "@/lib/db";
import { sendPush, pushConfigured, weeklyRecapNotification } from "@/lib/push";
import { weekForDate } from "@/lib/plan";
import { recapWeek, weekRecap } from "@/lib/weekStats";
import { todayNY } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Sunday-night weekly recap push, fired by a Vercel cron (see vercel.json — Mon 01:00 UTC
 * = Sun 9 PM ET during the plan's EDT window). OPEN like the Strava webhook (cron can't send
 * the PIN cookie) — guarded
 * instead by CRON_SECRET, which Vercel attaches as `Authorization: Bearer <secret>` when the
 * env var is set. When it's unset (local dev) the route is allowed so it's testable.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, reason: "push not configured" });
  }
  const today = todayNY();
  // Fires Sunday night → the wrapping week; falls back to today's week for off-schedule runs.
  const week = recapWeek(today)?.week ?? weekForDate(today);
  if (!week) return NextResponse.json({ ok: false, reason: "no plan week for today" });

  const stats = weekRecap(week, await getState());
  const report = await sendPush(
    weeklyRecapNotification({ weekId: week.id, ...stats }),
  );
  return NextResponse.json({ ok: true, week: week.id, ...report });
}
