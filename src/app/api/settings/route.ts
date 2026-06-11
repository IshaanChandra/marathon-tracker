import { NextResponse } from "next/server";
import { setSetting } from "@/lib/db";

export async function POST(request: Request) {
  const { key, value } = await request.json();
  if (typeof key !== "string" || !key) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }
  await setSetting(key, value ?? null);
  return NextResponse.json({ ok: true });
}
