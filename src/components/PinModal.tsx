"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Shown when a view-only visitor tries to make a change. A successful unlock
 * runs the action that triggered the prompt.
 */
export default function PinModal() {
  const { pinPromptOpen, closePinPrompt, unlock } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pinPromptOpen) {
      setPin("");
      setError(false);
      // focus after the dialog paints
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pinPromptOpen]);

  if (!pinPromptOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await unlock(pin);
    setBusy(false);
    if (!ok) {
      setError(true);
      setPin("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={closePinPrompt} />
      <form
        onSubmit={submit}
        className="relative card p-6 w-full max-w-xs text-center space-y-4 shadow-xl"
      >
        <div>
          <div className="text-2xl">🔒</div>
          <h2 className="font-bold mt-1">Enter PIN to edit</h2>
          <p className="text-sm text-foreground/50">
            Anyone can view — changes need the PIN once per device.
          </p>
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          className={`w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 ${
            error ? "border-rose-400 ring-rose-200" : "border-edge focus:ring-primary/40"
          }`}
        />
        {error && <p className="text-sm text-rose-600 dark:text-rose-300 font-medium">Wrong PIN — try again</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={closePinPrompt}
            className="flex-1 rounded-xl border border-edge py-3 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !pin}
            className="flex-1 rounded-xl bg-primary text-primary-contrast py-3 font-semibold text-sm disabled:opacity-50"
          >
            Unlock
          </button>
        </div>
      </form>
    </div>
  );
}
