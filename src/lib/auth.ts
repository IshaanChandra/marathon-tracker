export const AUTH_COOKIE = "mt_auth";

/**
 * Cookie value derived from the PIN; no session table needed for a single user.
 * Uses Web Crypto so it runs in both the Node runtime (API routes) and the
 * edge runtime (proxy.ts).
 */
export async function expectedToken(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`marathon-tracker:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function pinConfigured(): boolean {
  return !!process.env.APP_PIN;
}

/**
 * Token for the read-only calendar feed URL. Derived with a different salt than
 * the auth cookie so a leaked calendar URL can never authorize writes.
 */
export async function calToken(): Promise<string> {
  const data = new TextEncoder().encode(`marathon-cal:${process.env.APP_PIN ?? ""}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
