"use client";

import { useState } from "react";

const SHARE = {
  title: "NYC 26.2 — Ishaan Chandra's Marathon Training",
  text: "Follow Ishaan's road to a sub-3:45 at the 2026 NYC Marathon",
};

/** Native share sheet on mobile; copy-link with feedback on desktop. */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ ...SHARE, url });
        return;
      } catch {
        // user dismissed the sheet — fall through to nothing
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — nothing sensible to do
    }
  };

  return (
    <button
      onClick={share}
      aria-label="Share this site"
      className="h-7 grid place-items-center rounded-full bg-soft text-sm hover:bg-edge transition-colors px-2"
    >
      {copied ? <span className="text-[11px] font-semibold text-success px-0.5">Copied ✓</span> : "↗"}
    </button>
  );
}
