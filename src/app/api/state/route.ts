import { NextResponse } from "next/server";
import { getState, isSecretSetting } from "@/lib/db";

export async function GET() {
  const state = await getState();
  // The site is public-read: never ship secret settings (Strava tokens) to clients.
  const settings = Object.fromEntries(
    Object.entries(state.settings).filter(([k]) => !isSecretSetting(k)),
  );
  return NextResponse.json({ ...state, settings });
}
