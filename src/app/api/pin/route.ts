import { NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken, pinConfigured } from "@/lib/auth";

export async function POST(request: Request) {
  const { pin } = await request.json();
  if (!pinConfigured()) {
    return NextResponse.json({ ok: true }); // no PIN set (local dev) — open
  }
  if (typeof pin !== "string" || pin !== process.env.APP_PIN) {
    return NextResponse.json({ error: "wrong pin" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await expectedToken(pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // once per device per year
  });
  return res;
}
