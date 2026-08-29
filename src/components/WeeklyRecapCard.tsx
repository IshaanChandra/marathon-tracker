"use client";

import { useState } from "react";
import { plan } from "@/lib/plan";
import { useStore } from "@/lib/store";
import { todayNY, daysBetween } from "@/lib/dates";
import { weekRecap } from "@/lib/weekStats";
import type { Week } from "@/lib/types";

/**
 * A shareable weekly recap in the Empire gradient — screenshot-friendly and wired to the
 * native share sheet (copy-link fallback on desktop). Takes the week to recap as a prop;
 * the caller decides which week and when to show it (Today surfaces it Sat–Mon).
 */

function fmtTime(min: number): string {
  const t = Math.round(min);
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function WeeklyRecapCard({ week, complete }: { week: Week; complete?: boolean }) {
  const { state } = useStore();
  const [copied, setCopied] = useState(false);
  const today = todayNY();

  const s = weekRecap(week, state);
  const daysToRace = daysBetween(today, plan.meta.raceDate);

  const share = async () => {
    const url = window.location.origin;
    const text =
      `Week ${week.id} (${week.phase}): ${s.logged}/${s.planned} mi (${s.pct}%), ` +
      `${s.runs} run${s.runs === 1 ? "" : "s"}, longest ${s.longest} mi. ` +
      `Chasing sub-4:00 at the 2026 NYC Marathon 🗽`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "NYC 26.2 — weekly recap", text, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-orange-600 dark:from-blue-950 dark:via-blue-900 dark:to-orange-900 text-white shadow-md p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-xs font-bold uppercase tracking-wide text-white/80">
          {complete ? "Week wrapped" : "This week"} · Wk {week.id} · {week.phase}
        </span>
        <button
          onClick={share}
          aria-label="Share weekly recap"
          className="shrink-0 h-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition-colors px-2.5 text-sm font-semibold"
        >
          {copied ? <span className="text-[11px]">Copied ✓</span> : "Share ↗"}
        </button>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight tabular-nums">{s.logged}</span>
        <span className="text-lg font-medium text-white/70">mi</span>
        <span className="text-sm font-medium text-white/70 tabular-nums">
          / {s.planned} planned · {s.pct}%
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/10 py-1.5">
          <div className="text-lg font-bold tabular-nums">{s.runs}</div>
          <div className="text-[10px] font-medium text-white/65">runs</div>
        </div>
        <div className="rounded-lg bg-white/10 py-1.5">
          <div className="text-lg font-bold tabular-nums">{s.longest}</div>
          <div className="text-[10px] font-medium text-white/65">longest mi</div>
        </div>
        <div className="rounded-lg bg-white/10 py-1.5">
          <div className="text-lg font-bold tabular-nums">{s.timeMin > 0 ? fmtTime(s.timeMin) : "—"}</div>
          <div className="text-[10px] font-medium text-white/65">on feet</div>
        </div>
      </div>

      <div className="mt-3 text-[11px] font-medium text-white/70">
        NYC 26.2 · sub-4:00 · {daysToRace > 0 ? `${daysToRace} days out 🗽` : "race week 🗽"}
      </div>
    </div>
  );
}
