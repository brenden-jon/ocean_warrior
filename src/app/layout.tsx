import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import AccessGate from "@/components/AccessGate";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Planetary Pulse — Ocean Warrior",
    template: "%s — Planetary Pulse",
  },
  description: "A living view of a changing ocean.",
  // The prototype is private. Belt and braces alongside the header in
  // next.config.ts and public/robots.txt.
  icons: { icon: "/icon.svg" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  themeColor: "#020914",
  width: "device-width",
  initialScale: 1,
  // Deliberately not locking zoom — pinch-zoom is an accessibility affordance.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className="antialiased">
        <AccessGate>{children}</AccessGate>
      </body>
    </html>
  );
}
