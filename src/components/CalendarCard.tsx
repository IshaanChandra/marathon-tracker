"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

/** Subscribe-in-calendar card. Only an unlocked device can fetch the feed URL. */
export default function CalendarCard() {
  const { authed } = useStore();
  const [copied, setCopied] = useState<"webcal" | "https" | null>(null);

  if (!authed) return null;

  const copy = async (kind: "webcal" | "https") => {
    try {
      const res = await fetch("/api/calendar/url");
      if (!res.ok) return;
      const urls = (await res.json()) as { webcal: string; https: string };
      await navigator.clipboard.writeText(urls[kind]);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard blocked — nothing sensible to do
    }
  };

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold">Training plan in your calendar</h2>
      <p className="text-xs text-foreground/55 mt-1">
        Subscribe once and every workout appears as a morning block (run 7–8 AM, lift
        8–9 AM) — including any edits or swaps you make here. On iPhone: copy the link,
        then Settings → Apps → Calendar → Accounts → Add Subscribed Calendar.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => copy("webcal")}
          className="rounded-lg bg-primary text-primary-contrast px-3 py-2 text-xs font-semibold"
        >
          {copied === "webcal" ? "Copied ✓" : "Copy webcal link"}
        </button>
        <button
          onClick={() => copy("https")}
          className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-foreground/70"
        >
          {copied === "https" ? "Copied ✓" : "Copy https link"}
        </button>
      </div>
    </div>
  );
}
