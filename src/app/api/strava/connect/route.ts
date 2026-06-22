import { NextResponse } from "next/server";
import { stravaToken } from "@/lib/auth";
import { clientId, disconnect, stravaConfigured } from "@/lib/strava";

export const dynamic = "force-dynamic";

function origin(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host");
  return `${proto}://${host}`;
}

/** Kick off the OAuth dance: redirect to Strava's consent screen. PIN-gated. */
export async function GET(request: Request) {
  if (!stravaConfigured()) {
    return NextResponse.json({ error: "Strava env not configured" }, { status: 500 });
  }
  const redirectUri = `${origin(request)}/api/strava/callback`;
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", "activity:read_all");
  url.searchParams.set("state", await stravaToken()); // CSRF guard, verified on callback
  return NextResponse.redirect(url.toString());
}

/** Disconnect: forget tokens + status. PIN-gated. */
export async function DELETE() {
  await disconnect();
  return NextResponse.json({ ok: true });
}
