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

export const metadata: Metadata = {
  title: "NYC 26.2 — Marathon Tracker",
  description: "Sub-3:45 NYC Marathon training plan tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NYC 26.2",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f7f9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions inject classes into <body> */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <StoreProvider>
          <Nav />
          <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-24 sm:pb-12 flex-1">
            {children}
          </main>
          <PinModal />
        </StoreProvider>
      </body>
    </html>
  );
}
