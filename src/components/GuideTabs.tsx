"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/guide/travel", label: "Travel" },
  { href: "/guide/fueling", label: "Fueling" },
  { href: "/guide/paces", label: "Paces" },
];

export default function GuideTabs() {
  const pathname = usePathname();
  return (
    <div className="flex rounded-full bg-black/5 p-0.5 text-sm font-medium">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`px-3.5 py-1.5 rounded-full transition-colors ${
            pathname === t.href ? "bg-white shadow-sm font-semibold" : "text-foreground/50"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
