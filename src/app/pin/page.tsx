"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Standalone unlock page (the site is publicly viewable; unlocking enables edits).
 * Kept for bookmarks and as a direct way to authorize a device.
 */
export default function PinPage() {
  const { authed, unlock } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await unlock(pin)) {
      window.location.assign("/");
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-[60dvh] grid place-items-center">
      <form onSubmit={submit} className="card p-6 w-full max-w-xs text-center space-y-4">
        <div>
          <div className="text-2xl">🗽</div>
          <h1 className="font-bold mt-1">NYC 26.2</h1>
          <p className="text-sm text-foreground/50">
            {authed ? "This device is already unlocked for editing." : "Enter the PIN to enable editing on this device"}
          </p>
        </div>
        {!authed && (
          <>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              className={`w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 ${
                error ? "border-rose-400 ring-rose-200" : "border-black/10 focus:ring-foreground/20"
              }`}
            />
            {error && <p className="text-sm text-rose-600 font-medium">Wrong PIN — try again</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-foreground text-background py-3 font-semibold text-sm"
            >
              Unlock
            </button>
          </>
        )}
      </form>
    </div>
  );
}
