"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ShareButton from "./ShareButton";
import ThemeToggle from "./ThemeToggle";
import { useStore } from "@/lib/store";

type IconProps = { className?: string };

const HomeIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    <path d="M9 21v-7h6v7" />
  </svg>
);
const CalendarIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="17" rx="2" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </svg>
);
const ProgressIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);
const SummaryIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="9" r="6" />
    <path d="M8.5 13.5 7 21l5-3 5 3-1.5-7.5" />
  </svg>
);
const GuideIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" />
    <path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" />
  </svg>
);

const TABS = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/plan", label: "Plan", Icon: CalendarIcon },
  { href: "/progress", label: "Progress", Icon: ProgressIcon },
  { href: "/summary", label: "Summary", Icon: SummaryIcon },
  { href: "/guide/travel", label: "Guide", Icon: GuideIcon },
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
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-4">
          <span className="flex items-baseline gap-2.5 shrink-0 whitespace-nowrap">
            <span className="font-semibold tracking-tight">
              NYC <span className="text-accent font-bold">26.2</span>
            </span>
            <span className="hidden lg:inline text-xs font-medium text-foreground/45">Ishaan Chandra</span>
          </span>
          <nav className="flex gap-0.5">
            {TABS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive(pathname, href)
                    ? "bg-primary text-primary-contrast"
                    : "text-foreground/60 hover:text-foreground hover:bg-soft"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LockChip />
            <ShareButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile top-right cluster */}
      <div className="sm:hidden fixed top-3 right-3 z-20 flex items-center gap-2">
        <LockChip />
        <ShareButton />
        <ThemeToggle />
      </div>

      {/* Mobile floating pill nav */}
      <nav className="sm:hidden fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pointer-events-none">
        <div className="pointer-events-auto mx-auto flex max-w-sm items-center justify-around gap-1 rounded-2xl border border-edge bg-card/90 px-2 py-1.5 shadow-lg shadow-black/10 backdrop-blur-lg">
          {TABS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${
                  active ? "bg-primary text-primary-contrast" : "text-foreground/45"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
