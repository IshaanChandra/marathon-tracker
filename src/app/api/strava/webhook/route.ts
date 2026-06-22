import { NextResponse, after } from "next/server";
import { stravaToken } from "@/lib/auth";
import { getAthleteId, syncActivityById } from "@/lib/strava";

export const dynamic = "force-dynamic";

/**
 * Strava webhook callback. OPEN (Strava can't send our cookie) — guarded instead by
 * the `verify_token` (GET) and the `?t=` secret + owner_id check (POST).
 *
 * Validation handshake: Strava GETs with hub.mode/hub.challenge/hub.verify_token and
 * expects `{ "hub.challenge": <value> }` back within 2s.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const verify = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (url.searchParams.get("hub.mode") === "subscribe" && verify === (await stravaToken())) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

/**
 * Event delivery. Must ack 200 within 2s, so we validate + return immediately and do
 * the Strava fetch + apply in after() (post-response, kept alive by Vercel waitUntil).
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let event: { object_type?: string; aspect_type?: string; object_id?: number; owner_id?: number };
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // ack malformed, nothing to do
  }

  if (url.searchParams.get("t") === (await stravaToken())) {
    const isRunCreate =
      event.object_type === "activity" &&
      (event.aspect_type === "create" || event.aspect_type === "update") &&
      typeof event.object_id === "number";
    if (isRunCreate) {
      after(async () => {
        const athleteId = await getAthleteId();
        if (athleteId !== null && event.owner_id !== athleteId) return; // not our athlete
        await syncActivityById(event.object_id!);
      });
    }
  }
  // Always 200 fast — Strava retries on non-200 and gives up after 3 tries.
  return NextResponse.json({ ok: true });
}
