import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, expectedToken, pinConfigured } from "@/lib/auth";

/** PIN gate. When APP_PIN is unset (local dev), everything is open. */
export async function proxy(request: NextRequest) {
  if (!pinConfigured()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === "/pin" || pathname === "/api/pin") return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token === (await expectedToken(process.env.APP_PIN!))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/pin";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except static assets and PWA files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)"],
};
