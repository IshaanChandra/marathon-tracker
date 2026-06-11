import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, calToken, expectedToken, pinConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Returns the private webcal subscription URL — only to an unlocked device. */
export async function GET(request: Request) {
  if (pinConfigured()) {
    const store = await cookies();
    const token = store.get(AUTH_COOKIE)?.value;
    if (token !== (await expectedToken(process.env.APP_PIN!))) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const host = new URL(request.url).host;
  return NextResponse.json({
    webcal: `webcal://${host}/api/calendar?t=${await calToken()}`,
    https: `https://${host}/api/calendar?t=${await calToken()}`,
  });
}
