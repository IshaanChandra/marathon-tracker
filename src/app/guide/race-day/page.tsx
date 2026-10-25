import type { Metadata } from "next";
import SpectatorGuide from "@/components/SpectatorGuide";
import { race } from "@/data/spectator";

const DESCRIPTION = `Where to stand, when to be there, and how to get to the next spot — ${race.name}, ${race.dateLabel}. Bib ${race.bib}.`;

// Overriding openGraph here drops the root opengraph-image, so reference it explicitly.
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Ishaan Chandra — Road to the 2026 NYC Marathon",
};

export const metadata: Metadata = {
  title: `${race.title} — Ishaan's NYC 26.2`,
  description: DESCRIPTION,
  openGraph: {
    title: race.title,
    description: DESCRIPTION,
    siteName: "NYC 26.2",
    type: "website",
    url: "/guide/race-day",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: race.title,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RaceDayPage() {
  return <SpectatorGuide />;
}
