import { NextResponse } from "next/server";
import { setOverride } from "@/lib/db";

export async function POST(request: Request) {
  const { date, patch } = await request.json();
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  await setOverride(date, patch ?? null);
  return NextResponse.json({ ok: true });
}
