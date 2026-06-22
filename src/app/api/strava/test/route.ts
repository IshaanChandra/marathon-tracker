import { NextResponse } from "next/server";
import { applyActivity, type StravaActivity } from "@/lib/strava";

/**
 * Dev/QA hook: POST a sample Strava activity JSON and run the real apply path
 * (check-off + fill), with no Strava wiring. PIN-gated via proxy.ts. Lets us verify
 * mapping, the NY-date match, and that existing notes survive before OAuth exists.
 *
 *   curl -X POST .../api/strava/test -d '{"id":1,"sport_type":"Run",
 *     "distance":17750,"moving_time":5956,"start_date":"2026-06-20T13:30:00Z"}'
 */
export async function POST(request: Request) {
  const a = (await request.json()) as Partial<StravaActivity>;
  if (typeof a?.start_date !== "string" || typeof a?.distance !== "number") {
    return NextResponse.json({ error: "invalid activity" }, { status: 400 });
  }
  const result = await applyActivity(a as StravaActivity);
  return NextResponse.json(result);
}
