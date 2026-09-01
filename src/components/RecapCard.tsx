"use client";

import { useState } from "react";
import { plan } from "@/lib/plan";
import { useStore } from "@/lib/store";
import { todayNY, daysBetween } from "@/lib/dates";
import { periodRecap, type Period, type PeriodMode } from "@/lib/periods";

/**
 * A shareable recap in the Empire gradient — screenshot-friendly and wired to the native
 * share sheet (copy-link fallback on desktop). Presentational: the caller owns which period
 * is shown and the week/month mode, so the stats always come from the shared periodRecap().
 */

function fmtTime(min: number): string {
  const t = Math.round(min);
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "This week" / "Week wrapped" / "Upcoming" for the header's leading chip. */
function statusLabel(period: Period, today: string): string {
  const noun = period.mode === "week" ? "Week" : "Month";
  if (today > period.end) return `${noun} wrapped`;
  if (today < period.start) return "Upcoming";
  return `This ${noun.toLowerCase()}`;
}

function ModeToggle({ mode, onChange }: { mode: PeriodMode; onChange: (m: PeriodMode) => void }) {
  return (
    <div className="shrink-0 flex items-center rounded-full bg-white/15 p-0.5 text-[11px] font-bold">
      {(["week", "month"] as PeriodMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          aria-label={m === "week" ? "Weekly recap" : "Monthly recap"}
          className={`px-2 py-1 rounded-full transition-colors ${
            mode === m ? "bg-white text-blue-900" : "text-white/70 hover:text-white"
          }`}
        >
          {m === "week" ? "W" : "M"}
        </button>
      ))}
    </div>
  );
}

function StepButton({
  dir,
  disabled,
  onClick,
}: {
  dir: -1 | 1;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === -1 ? "Previous period" : "Next period"}
      className={`shrink-0 h-8 w-8 grid place-items-center rounded-full text-lg leading-none transition-colors ${
        disabled ? "text-white/25" : "text-white/80 hover:bg-white/15 hover:text-white"
      }`}
    >
      {dir === -1 ? "‹" : "›"}
    </button>
  );
}

export default function RecapCard({
  period,
  mode,
  onModeChange,
  onStep,
  canPrev,
  canNext,
}: {
  period: Period;
  mode: PeriodMode;
  onModeChange: (m: PeriodMode) => void;
  onStep: (delta: -1 | 1) => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  const { state } = useStore();
  const [copied, setCopied] = useState(false);
  const today = todayNY();

  const s = periodRecap(period, state);
  const daysToRace = daysBetween(today, plan.meta.raceDate);
  const title = period.mode === "week" ? `Week ${period.key}` : period.label;

  const share = async () => {
    const url = window.location.origin;
    const text =
      `${title} (${period.phase}): ${s.logged}/${s.planned} mi (${s.pct}%), ` +
      `${s.runs} run${s.runs === 1 ? "" : "s"}, longest ${s.longest} mi. ` +
      `Chasing sub-4:00 at the 2026 NYC Marathon 🗽`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "NYC 26.2 — recap", text, url });
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
        <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-white/80">
          {statusLabel(period, today)} · {period.label}
        </span>
        <div className="shrink-0 flex items-center gap-1.5">
          <ModeToggle mode={mode} onChange={onModeChange} />
          <button
            onClick={share}
            aria-label="Share recap"
            className="shrink-0 h-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition-colors px-2.5 text-sm font-semibold"
          >
            {copied ? <span className="text-[11px]">Copied ✓</span> : "Share ↗"}
          </button>
        </div>
      </div>

      <div className="mt-1 flex items-center">
        <StepButton dir={-1} disabled={!canPrev} onClick={() => onStep(-1)} />
        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-white/75">
          <span className="tabular-nums">{period.range}</span>
          <span className="text-white/50"> · {period.phase}</span>
        </span>
        <StepButton dir={1} disabled={!canNext} onClick={() => onStep(1)} />
      </div>

      <div className="mt-1 flex items-baseline gap-2">
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
