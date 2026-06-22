import { NextResponse } from "next/server";
import { stravaToken } from "@/lib/auth";
import { exchangeCode } from "@/lib/strava";

export const dynamic = "force-dynamic";

function origin(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host");
  return `${proto}://${host}`;
}

/**
 * OAuth redirect target. Open (no PIN — Strava redirects the browser here), but the
 * `state` must match our salted token, and the one-time `code` is useless without our
 * client secret. On success, persist tokens and bounce back to the Progress tab.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = origin(request);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error || !code) {
    return NextResponse.redirect(`${base}/progress?strava=denied`);
  }
  if (state !== (await stravaToken())) {
    return NextResponse.redirect(`${base}/progress?strava=badstate`);
  }
  try {
    await exchangeCode(code);
  } catch {
    return NextResponse.redirect(`${base}/progress?strava=error`);
  }
  return NextResponse.redirect(`${base}/progress?strava=connected`);
}
