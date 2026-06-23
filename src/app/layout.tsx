import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import PinModal from "@/components/PinModal";
import { StoreProvider } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE = "NYC 26.2 — Ishaan Chandra's Marathon Training";
const SITE_DESCRIPTION =
  "Following Ishaan's 20-week road to a sub-4:00 at the 2026 NYC Marathon.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ishaans-nyc-marathon.vercel.app"),
  title: "Ishaan's NYC 26.2",
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NYC 26.2",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "NYC 26.2",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f6fb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Runs before paint so a dark-mode reload never flashes light. ?theme= overrides for debugging. */
const themeInit = `try{var q=new URLSearchParams(location.search).get("theme");var t=q||localStorage.getItem("mt_theme");if(t==="dark"){document.documentElement.dataset.theme="dark";var m=document.querySelector('meta[name="theme-color"]');m&&m.setAttribute("content","#0e1322")}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // data-theme is set pre-hydration by the inline script below
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      {/* suppressHydrationWarning: browser extensions inject classes into <body> */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <StoreProvider>
          <Nav />
          {/* Mobile: extra top padding clears the floating theme/lock cluster */}
          <main className="mx-auto w-full max-w-3xl px-4 pt-12 sm:pt-4 pb-24 sm:pb-12 flex-1">
            {children}
          </main>
          <PinModal />
        </StoreProvider>
      </body>
    </html>
  );
}
