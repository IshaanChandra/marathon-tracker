import { NextResponse } from "next/server";
import { setLog } from "@/lib/db";

export async function POST(request: Request) {
  const { date, log } = await request.json();
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  await setLog(date, log ?? null);
  return NextResponse.json({ ok: true });
}
