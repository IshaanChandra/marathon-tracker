"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/", label: "Today", icon: "●" },
  { href: "/plan", label: "Plan", icon: "▦" },
  { href: "/progress", label: "Progress", icon: "▲" },
  { href: "/guide/travel", label: "Guide", icon: "✦" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/guide")) return pathname.startsWith("/guide");
  return pathname.startsWith(href);
}

function LockChip() {
  const { authed, openPinPrompt } = useStore();
  if (authed) return null;
  return (
    <button
      onClick={openPinPrompt}
      className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-foreground/50 hover:text-foreground"
    >
      🔒 View only
    </button>
  );
}

export default function Nav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden sm:block sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-edge">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-6">
          <span className="font-semibold tracking-tight">
            NYC <span className="text-accent font-bold">26.2</span>
          </span>
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive(pathname, t.href)
                    ? "bg-primary text-primary-contrast"
                    : "text-foreground/60 hover:text-foreground hover:bg-soft"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LockChip />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile top-right cluster */}
      <div className="sm:hidden fixed top-3 right-3 z-20 flex items-center gap-2">
        <LockChip />
        <ThemeToggle />
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-card/90 backdrop-blur border-t border-edge pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive(pathname, t.href) ? "text-primary" : "text-foreground/40"
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
