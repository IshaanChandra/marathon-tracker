import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { calToken, pinConfigured } from "@/lib/auth";
import { getState } from "@/lib/db";
import { allDates, RUN_TYPE_LABELS } from "@/lib/plan";
import { effectiveDay } from "@/lib/merge";

export const dynamic = "force-dynamic";

/**
 * Live ICS feed of the training plan (subscribe via webcal://).
 * Run = 7:00–8:00 AM ET, lift = 8:00–9:00 AM ET, race day = 8:00 AM–12:00 PM.
 * Overrides/skips from the app are reflected; stable UIDs let calendars update in place.
 */

const TZID = "America/New_York";

// Covers EDT/EST for the plan window; standard minimal VTIMEZONE.
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:20070311T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:20071104T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

function esc(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** RFC 5545 line folding: continuation lines start with a space. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function vevent(date: string, startHour: number, endHour: number, summary: string, description: string): string {
  const d = date.replace(/-/g, "");
  const pad = (h: number) => String(h).padStart(2, "0");
  return [
    "BEGIN:VEVENT",
    `UID:${date}-${startHour}@marathon-tracker`,
    `DTSTAMP:20260101T000000Z`,
    `DTSTART;TZID=${TZID}:${d}T${pad(startHour)}0000`,
    `DTEND;TZID=${TZID}:${d}T${pad(endHour)}0000`,
    fold(`SUMMARY:${esc(summary)}`),
    description ? fold(`DESCRIPTION:${esc(description)}`) : "",
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export async function GET(request: NextRequest) {
  if (pinConfigured()) {
    const t = request.nextUrl.searchParams.get("t");
    if (t !== (await calToken())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const state = await getState();
  const events: string[] = [];

  for (const date of allDates) {
    const day = effectiveDay(date, state);
    if (!day || day.skipped) continue;

    if (day.run) {
      const label = RUN_TYPE_LABELS[day.run.type] ?? day.run.type;
      const desc = [
        day.run.structure,
        day.run.pace && `Pace: ${day.run.pace}`,
        day.run.hrZone,
        day.run.fueling && `Fueling: ${day.run.fueling}`,
        day.notes,
      ]
        .filter(Boolean)
        .join("\n");
      if (day.run.type === "race") {
        events.push(vevent(date, 8, 12, "🗽 RACE DAY — NYC Marathon · 26.2 @ 8:35", "Goal 3:45. This is it."));
      } else {
        events.push(vevent(date, 7, 8, `🏃 ${day.run.miles} mi ${label}`, desc));
      }
    }
    if (day.lift) {
      const liftStart = day.run ? 8 : 7;
      events.push(
        vevent(date, liftStart, liftStart + 1, `🏋️ Lift: ${day.lift.focus}`, day.lift.notes ?? ""),
      );
    }
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//marathon-tracker//NYC 26.2//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:NYC 26.2 — Ishaan's Training",
    `X-WR-TIMEZONE:${TZID}`,
    VTIMEZONE,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="nyc-26-2.ics"',
      "Cache-Control": "no-store",
    },
  });
}
