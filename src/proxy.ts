import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, expectedToken, pinConfigured } from "@/lib/auth";

/**
 * Auth model: the site is publicly readable; the PIN is required only for writes.
 * Only the mutating API routes are gated here. When APP_PIN is unset (local dev),
 * everything is open.
 */
export async function proxy(request: NextRequest) {
  if (!pinConfigured()) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token === (await expectedToken(process.env.APP_PIN!))) {
    return NextResponse.next();
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export const config = {
  // Strava callback + webhook stay OPEN (Strava can't send the cookie; they carry
  // their own validation). connect/subscribe/test are owner-only, so PIN-gate them.
  matcher: [
    "/api/log/:path*",
    "/api/override/:path*",
    "/api/settings/:path*",
    "/api/strava/connect/:path*",
    "/api/strava/subscribe/:path*",
    "/api/strava/test/:path*",
  ],
};
