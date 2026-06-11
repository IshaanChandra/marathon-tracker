"use client";

import { plan } from "@/lib/plan";
import { scenarioFor } from "@/lib/merge";
import { useStore } from "@/lib/store";

const TRIP_LABELS: Record<string, string> = {
  italy: "Italy — week 4 (Jul 6)",
  wedding: "Wedding — week 10 (Aug 17)",
};

/**
 * Pick the A/B/C scenario for each travel week. The choice is stored in settings
 * and re-targets that week's mileage everywhere in the app.
 */
export default function ScenarioPicker() {
  const { state, setSetting } = useStore();

  return (
    <div className="space-y-3">
      {Object.entries(plan.scenarios).map(([trip, { options }]) => {
        const selected = scenarioFor(state, trip);
        return (
          <div key={trip} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{TRIP_LABELS[trip] ?? trip}</h3>
              {selected && (
                <button
                  onClick={() => setSetting(`travel.${trip}`, null)}
                  className="text-xs font-medium text-foreground/45 hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(options).map(([letter, opt]) => {
                const active = selected === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => setSetting(`travel.${trip}`, { scenario: letter })}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-success bg-emerald-50 ring-1 ring-success/60 dark:bg-emerald-500/15"
                        : "border-edge hover:bg-soft"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        {letter} · {opt.label}
                      </span>
                      {active && <span className="text-success font-bold text-sm">✓</span>}
                    </div>
                    <div className="text-xs font-semibold text-foreground/60 mt-1">
                      {opt.miles} mi
                    </div>
                    <div className="text-xs text-foreground/55 mt-1 line-clamp-3">
                      {opt.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
