import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, expectedToken, pinConfigured } from "@/lib/auth";

// Without this, a build with APP_PIN unset bakes the no-PIN early return into a
// static response and the route never reads the cookie.
export const dynamic = "force-dynamic";

/** Tells the client whether this device already holds a valid PIN cookie. */
export async function GET() {
  if (!pinConfigured()) return NextResponse.json({ authed: true });
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  return NextResponse.json({
    authed: token === (await expectedToken(process.env.APP_PIN!)),
  });
}
