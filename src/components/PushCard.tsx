"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Base64url VAPID key → Uint8Array for pushManager.subscribe(). */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Run-notification opt-in. Owner-only (PIN-gated subscribe route). Push on iOS only
 * works from the installed home-screen app, so we nudge the user there if they're in a
 * browser tab. Subscribing is per-device — enabling here (the phone) never touches the
 * laptop, which is exactly the "mobile only" behavior wanted.
 */
export default function PushCard() {
  const { authed } = useStore();
  const [supported, setSupported] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && !!VAPID_PUBLIC_KEY;
    setSupported(ok);
    setStandalone(isStandalone());
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  if (!authed) return null;

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("Notifications are blocked — allow them in Settings to enable.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg(body.error ?? `Failed (${res.status})`);
        return;
      }
      setSubscribed(true);
      setMsg("On — you'll get a notification each time a run syncs.");
    } catch (e) {
      setMsg(`Couldn't enable: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Off on this device.");
    } catch (e) {
      setMsg(`Couldn't disable: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const r = (await res.json().catch(() => ({}))) as {
        error?: string;
        subCount?: number;
        sent?: number;
        errors?: { status?: number; message: string }[];
      };
      if (!res.ok) {
        setMsg(r.error ?? `Test failed (${res.status}).`);
        return;
      }
      if (!r.subCount) {
        setMsg("No device registered on the server — tap Turn off, then Enable again.");
        return;
      }
      if (r.sent && (!r.errors || r.errors.length === 0)) {
        setMsg(`Sent to ${r.sent} device(s) — check your lock screen.`);
        return;
      }
      const e = r.errors?.[0];
      setMsg(`Push rejected${e?.status ? ` (${e.status})` : ""}: ${e?.message ?? "unknown"}`);
    } catch {
      setMsg("Test failed — network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold">Run notifications</h2>
      <p className="text-xs text-foreground/55 mt-1">
        Get a phone notification the moment a finished run auto-syncs from Garmin — a quick
        “{`{distance} @ {pace} ✅`}” so you know it logged.
      </p>

      {!supported ? (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-200">
          {VAPID_PUBLIC_KEY
            ? "This browser can't do push notifications."
            : "Notifications aren't configured yet (VAPID key missing)."}
        </div>
      ) : !standalone ? (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-200">
          Open the app from your home screen to turn these on — iPhone only delivers
          notifications to the installed app, not the Safari tab.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {subscribed && (
            <div className="flex items-center gap-2 text-xs text-foreground/55">
              <span className="inline-block w-2 h-2 rounded-full bg-success" />
              On for this device.
            </div>
          )}
          {msg && <div className="text-[11px] text-foreground/70">{msg}</div>}
          <div className="flex gap-2">
            <button
              onClick={subscribed ? disable : enable}
              disabled={busy}
              className="rounded-lg bg-primary text-primary-contrast px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {busy ? "…" : subscribed ? "Turn off" : "Enable notifications"}
            </button>
            {subscribed && (
              <button
                onClick={sendTest}
                disabled={busy}
                className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Send test
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
