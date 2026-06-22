"use client";

import { useStore } from "@/lib/store";
import type { StravaStatus } from "@/lib/strava";

/** Connect / status card for the Garmin→Strava auto-sync. Owner-only (PIN-gated). */
export default function StravaCard() {
  const { authed, state, setSetting } = useStore();
  if (!authed) return null;

  const status = state.settings["strava.status"] as StravaStatus | undefined;
  const connected = !!status?.connected;

  const disconnect = async () => {
    try {
      await fetch("/api/strava/connect", { method: "DELETE" });
    } catch {
      // best effort — clear the local mirror regardless
    }
    setSetting("strava.status", null);
  };

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold">Auto-log runs from Garmin</h2>
      <p className="text-xs text-foreground/55 mt-1">
        Connect Strava (your Garmin runs already sync there). When a run finishes, the
        site checks it off and fills in your distance and pace automatically.
      </p>

      {connected ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-success" />
            <span className="font-semibold">
              Connected{status?.athleteName ? ` · ${status.athleteName}` : ""}
            </span>
          </div>
          {status?.lastRun && (
            <div className="text-xs text-foreground/55">
              Last synced: {status.lastRun.miles} mi
              {status.lastRun.pace ? ` @ ${status.lastRun.pace}/mi` : ""} on {status.lastRun.date}
            </div>
          )}
          {!status?.subscribed && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-200">
              Connected, but auto-sync isn’t armed yet — finish setup below.
            </div>
          )}
          <button
            onClick={disconnect}
            className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <a
          href="/api/strava/connect"
          className="mt-3 inline-block rounded-lg bg-[#fc4c02] text-white px-3 py-2 text-xs font-semibold"
        >
          Connect Strava
        </a>
      )}
    </div>
  );
}
