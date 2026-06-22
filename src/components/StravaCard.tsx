"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { StravaStatus } from "@/lib/strava";

/** Connect / status card for the Garmin→Strava auto-sync. Owner-only (PIN-gated). */
export default function StravaCard() {
  const { authed, state, setSetting } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!authed) return null;

  const status = state.settings["strava.status"] as StravaStatus | undefined;
  const connected = !!status?.connected;
  const subscribed = !!status?.subscribed;

  const disconnect = async () => {
    try {
      await fetch("/api/strava/subscribe", { method: "DELETE" });
      await fetch("/api/strava/connect", { method: "DELETE" });
    } catch {
      // best effort — clear the local mirror regardless
    }
    setSetting("strava.status", null);
  };

  const toggleSync = async (enable: boolean) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/strava/subscribe", { method: enable ? "POST" : "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(body.error ?? `Failed (${res.status})`);
        return;
      }
      window.location.reload(); // pull the refreshed strava.status
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
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
          {subscribed ? (
            <div className="flex items-center gap-2 text-xs text-foreground/55">
              <span className="inline-block w-2 h-2 rounded-full bg-success" />
              Auto-sync on — finished runs check themselves off.
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-200">
              Connected, but auto-sync isn’t armed yet — tap “Enable auto-sync”.
            </div>
          )}
          {err && <div className="text-[11px] text-rose-600 dark:text-rose-300">{err}</div>}
          <div className="flex gap-2">
            <button
              onClick={() => toggleSync(!subscribed)}
              disabled={busy}
              className="rounded-lg bg-primary text-primary-contrast px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {busy ? "…" : subscribed ? "Disable auto-sync" : "Enable auto-sync"}
            </button>
            <button
              onClick={disconnect}
              className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300"
            >
              Disconnect
            </button>
          </div>
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
