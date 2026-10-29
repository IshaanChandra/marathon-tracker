"use client";

import { usePathname } from "next/navigation";

/** Race Day opens with its own hero, so the Guide title + tabs row is hidden there
 *  (that page shows the tabs at its foot instead). */
export default function GuideHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/guide/race-day") return null;
  return <>{children}</>;
}
