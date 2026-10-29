"use client";

import { useSyncExternalStore } from "react";

/** Every collapsible section/row on the Race Day page (see Fold and StopRow in SpectatorGuide). */
function folds(): HTMLDetailsElement[] {
  return [...document.querySelectorAll<HTMLDetailsElement>("details[data-rd-fold]")];
}

/** `toggle` doesn't bubble, so listen in the capture phase. */
function subscribe(onChange: () => void) {
  document.addEventListener("toggle", onChange, true);
  return () => document.removeEventListener("toggle", onChange, true);
}

/** "Expand all" / "Collapse all" for the Race Day page. */
export default function FoldControls() {
  const allOpen = useSyncExternalStore(
    subscribe,
    () => folds().every((d) => d.open),
    () => false,
  );

  return (
    <button
      type="button"
      onClick={() => folds().forEach((d) => (d.open = !allOpen))}
      className="min-h-11 rounded-full bg-soft px-4 text-sm font-semibold text-foreground/80 active:bg-edge"
    >
      {allOpen ? "Collapse all" : "Expand all"}
    </button>
  );
}
